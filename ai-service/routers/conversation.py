"""Conversation Trust Analyzer endpoint."""
import asyncio
import logging

from fastapi import APIRouter, Form, UploadFile, File, Request, Depends
from fastapi.responses import StreamingResponse
from google.genai import types

from config import settings
from errors import TrustGuardError, ErrorCode
from schemas import (
    FeatureType,
    AnalysisResult,
    AnalysisMeta,
    ExtractedData,
    UrlFinding,
    Factor,
    FactorSource,
    Severity,
    AIAssessment,
    Hint,
    SaveEvent,
)
from services.pipeline import PipelineContext, ndjson_line, stream_error
from services.auth import get_current_user
from services.history_store import save_analysis_result
from services.gemini_client import generate_structured, generate_text
from services.prompts import load_prompt, format_untrusted, get_prompt_version
from services.text_extractors import extract_all, escape_untrusted_tags
from services.url_inspector import inspect_url, static_checks
from services.file_validation import validate_file, validate_text, IMAGE_TYPES
from services.signals import SIGNAL_TABLE, SignalCategory, compute_weight
from services.risk_engine import score_risk
from services.demo_cache import find_matching_sample, get_cached_sample_result

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analyze", tags=["conversation"])


async def _run_conversation_analysis(
    text: str | None,
    image_data: bytes | None,
    image_mime: str | None,
    uid: str | None = None,
):
    """Generator that yields NDJSON lines for the conversation analysis."""
    ctx = PipelineContext()

    try:
        # Stage: received
        yield await ctx.emit_stage("received")

        content = text or ""
        prompt_version = "conversation_v1"

        # Stage: extracting (if image)
        if image_data:
            yield await ctx.emit_stage("extracting", "Extracting text from image")

            extract_prompt = load_prompt("extract_v1")
            image_part = types.Part.from_bytes(
                data=image_data,
                mime_type=image_mime or "image/png",
            )
            try:
                extracted_text = await generate_text(
                    prompt=extract_prompt,
                    parts=[image_part],
                )
                if extracted_text and extracted_text.strip() != "NO_TEXT_FOUND":
                    content = extracted_text
                else:
                    content = ""
            except TrustGuardError as te:
                if te.code in (ErrorCode.AI_RATE_LIMITED, ErrorCode.AI_UNAVAILABLE):
                    cached_res = get_cached_sample_result("kyc_block_sms")
                    if cached_res:
                        logger.info("Using demo cache fallback for OCR image due to Gemini rate limit")
                        cached_res.meta.cached = True
                        yield await ctx.emit_stage("scoring")
                        yield await ctx.emit_result(cached_res)
                        if uid:
                            save_status = await save_analysis_result(uid, cached_res)
                            yield ndjson_line(SaveEvent(status=save_status))
                        return
                raise

        if not content.strip():
            # No content to analyze
            from schemas import AnalysisStatus, Confidence
            result = AnalysisResult(
                feature=FeatureType.CONVERSATION,
                status=AnalysisStatus.INSUFFICIENT_CONTENT,
                confidence=Confidence.LOW,
                content_type="image" if image_data else "text",
                reasoning="Not enough readable content was found to perform an assessment.",
                meta=AnalysisMeta(
                    model=settings.gemini_model,
                    prompt_version=prompt_version,
                    duration_ms=ctx.elapsed_ms(),
                ),
            )
            yield await ctx.emit_result(result)
            return

        # Stage: checking
        extraction = extract_all(content)
        detail_parts = []
        if extraction.urls:
            detail_parts.append(f"Inspecting {len(extraction.urls)} link{'s' if len(extraction.urls) != 1 else ''}")
        if extraction.hints:
            detail_parts.append(f"{len(extraction.hints)} keyword hint{'s' if len(extraction.hints) != 1 else ''}")
        yield await ctx.emit_stage("checking", ", ".join(detail_parts) if detail_parts else None)

        # URL inspection (concurrent)
        url_findings: list[UrlFinding] = []
        url_signal_codes: list[str] = []
        if extraction.urls:
            tasks = [inspect_url(u) for u in extraction.urls]
            url_results = await asyncio.gather(*tasks, return_exceptions=True)
            for result_or_exc in url_results:
                if isinstance(result_or_exc, Exception):
                    continue
                signals, finding = result_or_exc
                url_findings.append(finding)
                url_signal_codes.extend(signals)

        # Build deterministic factors from URL signals
        deterministic_factors: list[Factor] = []
        seen_codes = set()
        for code in url_signal_codes:
            if code in seen_codes:
                continue
            seen_codes.add(code)
            sig_def = SIGNAL_TABLE.get(code)
            if sig_def and sig_def.code_settable:
                weight = compute_weight(sig_def.base_weight, "HIGH")
                deterministic_factors.append(Factor(
                    code=code,
                    category=sig_def.category.value,
                    severity=Severity.HIGH,
                    weight=weight,
                    source=FactorSource.DETERMINISTIC,
                    title=code.replace("_", " ").title(),
                    why_it_matters=f"Detected in URL analysis: {code}",
                    evidence=None,
                ))

        # Injection detection from code
        injection_detected = extraction.injection_detected
        if injection_detected:
            sig_def = SIGNAL_TABLE.get("PROMPT_INJECTION_ATTEMPT")
            if sig_def:
                weight = compute_weight(sig_def.base_weight, "HIGH")
                deterministic_factors.append(Factor(
                    code="PROMPT_INJECTION_ATTEMPT",
                    category=sig_def.category.value,
                    severity=Severity.HIGH,
                    weight=weight,
                    source=FactorSource.DETERMINISTIC,
                    title="Prompt injection attempt",
                    why_it_matters="The content contains instructions that appear to be aimed at manipulating an AI system's analysis.",
                    evidence=None,
                ))

        # Stage: reasoning (Gemini call 2)
        yield await ctx.emit_stage("reasoning", "Assessing identity consistency, manipulation patterns, cross-evidence")

        # Build evidence JSON for Gemini
        evidence = {
            "urls": [f.model_dump() for f in url_findings],
            "emails": extraction.emails,
            "phones": extraction.phones,
            "upi_ids": extraction.upi_ids,
            "amounts": extraction.amounts,
            "injection_detected_by_code": injection_detected,
            "deterministic_signals": [f.code for f in deterministic_factors],
        }

        hints_for_prompt = [
            {"hint_id": h.id, "description": h.description}
            for h in extraction.hints
        ]

        import json
        conversation_prompt = load_prompt("conversation_v1")
        conversation_prompt = conversation_prompt.replace("{content}", escape_untrusted_tags(content))
        conversation_prompt = conversation_prompt.replace("{evidence_json}", json.dumps(evidence, indent=2, default=str))
        conversation_prompt = conversation_prompt.replace("{hints_json}", json.dumps(hints_for_prompt, indent=2))

        # Add system prompt
        system_prompt = load_prompt("system_v1")
        full_prompt = system_prompt + "\n\n" + conversation_prompt

        ai_assessment = None
        if settings.demo_cache:
            cached_result = find_matching_sample(content)
            if cached_result:
                cached_result.meta.cached = True
                yield await ctx.emit_stage("scoring")
                yield await ctx.emit_result(cached_result)
                if uid:
                    save_status = await save_analysis_result(uid, cached_result)
                    yield ndjson_line(SaveEvent(status=save_status))
                return

        try:
            ai_assessment = await generate_structured(
                prompt=full_prompt,
                response_model=AIAssessment,
            )
        except TrustGuardError as te:
            if te.code in (ErrorCode.AI_RATE_LIMITED, ErrorCode.AI_UNAVAILABLE):
                cached_res = find_matching_sample(content)
                if cached_res:
                    logger.info("Using demo cache fallback due to Gemini rate limit/unavailability")
                    cached_res.meta.cached = True
                    if injection_detected and not any(f.code == "PROMPT_INJECTION_ATTEMPT" for f in cached_res.factors):
                        sig_def = SIGNAL_TABLE.get("PROMPT_INJECTION_ATTEMPT")
                        weight = compute_weight(sig_def.base_weight, "HIGH") if sig_def else 20
                        cached_res.factors.append(Factor(
                            code="PROMPT_INJECTION_ATTEMPT",
                            category="Manipulation",
                            severity=Severity.HIGH,
                            weight=weight,
                            source=FactorSource.DETERMINISTIC,
                            title="Prompt injection attempt",
                            why_it_matters="The content contains instructions that appear to be aimed at manipulating an AI system's analysis.",
                            evidence=None,
                        ))
                        cached_res.score = min(100, sum(f.weight for f in cached_res.factors))
                    yield await ctx.emit_stage("scoring")
                    yield await ctx.emit_result(cached_res)
                    if uid:
                        save_status = await save_analysis_result(uid, cached_res)
                        yield ndjson_line(SaveEvent(status=save_status))
                    return
            raise

        # Stage: scoring
        yield await ctx.emit_stage("scoring")

        # Risk engine
        factors, score, level, categories, dismissed_hints = score_risk(
            deterministic_factors=deterministic_factors,
            ai_assessment=ai_assessment,
            hints=extraction.hints,
            injection_detected_by_code=injection_detected,
        )

        # Build extracted data
        extracted = ExtractedData(
            urls=url_findings,
            upi=extraction.upi_ids,
            emails=extraction.emails,
            phones=extraction.phones,
            amounts=extraction.amounts,
        )

        # Build result
        result = AnalysisResult(
            feature=FeatureType.CONVERSATION,
            status=ai_assessment.status,
            score=score,
            level=level,
            confidence=ai_assessment.confidence,
            factors=factors,
            categories=categories,
            dismissed_hints=dismissed_hints,
            content_type=ai_assessment.content_type or ("image" if image_data else "text"),
            claimed_identity=ai_assessment.claimed_identity,
            sender_intent=ai_assessment.sender_intent,
            contradictions=ai_assessment.contradictions,
            attack_stage=ai_assessment.attack_stage,
            reasoning=ai_assessment.reasoning,
            recommendations=ai_assessment.recommendations,
            summary=ai_assessment.history_summary,
            extracted=extracted,
            meta=AnalysisMeta(
                model=settings.gemini_model,
                prompt_version=prompt_version,
                duration_ms=ctx.elapsed_ms(),
            ),
        )

        yield await ctx.emit_result(result)

        # Persistence to Firestore (if authenticated)
        if uid:
            save_status = await save_analysis_result(uid, result)
            yield ndjson_line(SaveEvent(status=save_status))

    except TrustGuardError as e:
        yield await stream_error(e.code.value, e.message)
    except Exception as e:
        logger.error(f"Conversation analysis failed: type={type(e).__name__}")
        yield await stream_error("AI_UNAVAILABLE", "An unexpected error occurred. Please try again.")


@router.post("/conversation")
async def analyze_conversation(
    request: Request,
    text: str = Form(default=None),
    image: UploadFile | None = File(default=None),
    uid: str = Depends(get_current_user),
):
    """Analyze a conversation for trust signals. Returns NDJSON stream."""
    # Validate input
    image_data = None
    image_mime = None

    if image:
        image_data = await image.read()
        image_mime = validate_file(image_data, allowed_types=IMAGE_TYPES)

    if not text and not image_data:
        raise TrustGuardError(ErrorCode.UNSUPPORTED_FILE)

    if text:
        validate_text(text)

    return StreamingResponse(
        _run_conversation_analysis(text, image_data, image_mime, uid=uid),
        media_type="application/x-ndjson",
    )
