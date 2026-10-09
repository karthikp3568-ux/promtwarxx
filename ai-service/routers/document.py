"""Document Trust Analyzer and grounded Ask Q&A router."""
import json
import logging
from fastapi import APIRouter, Form, UploadFile, File, Request, Depends
from fastapi.responses import StreamingResponse, JSONResponse

from config import settings
from errors import TrustGuardError, ErrorCode
from schemas import (
    FeatureType,
    AnalysisResult,
    AnalysisMeta,
    ExtractedData,
    DocumentDetails,
    Factor,
    Severity,
    AIAssessment,
    SaveEvent,
    UrlFinding,
)
from services.pipeline import PipelineContext, ndjson_line, stream_error
from services.auth import get_current_user
from services.history_store import save_analysis_result
from services.document_parser import parse_pdf
from services.file_validation import validate_file, DOCUMENT_TYPES, IMAGE_TYPES, ALL_TYPES
from services.text_extractors import extract_all, escape_untrusted_tags
from services.url_inspector import inspect_url
from services.gemini_client import generate_structured, generate_text
from services.prompts import load_prompt, format_untrusted
from services.risk_engine import score_risk
from services.redaction import redact_text
from services.demo_cache import find_matching_sample

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["document"])


async def _run_document_analysis(
    file_bytes: bytes,
    mime_type: str,
    context: str | None,
    uid: str,
):
    ctx = PipelineContext()
    try:
        yield await ctx.emit_stage("received")

        # Stage: extracting document content
        yield await ctx.emit_stage("extracting", "Extracting text layer and analyzing document structure")
        doc_text = ""
        deterministic_factors = []
        hidden_links = []
        active_content = False

        if mime_type == "application/pdf":
            parsed_pdf = parse_pdf(file_bytes)
            doc_text = parsed_pdf.text
            deterministic_factors.extend(parsed_pdf.deterministic_factors)
            hidden_links = parsed_pdf.hidden_links
            active_content = parsed_pdf.active_content
        elif mime_type in IMAGE_TYPES:
            # Image notice
            from google.genai import types
            extract_prompt = load_prompt("extract_v1")
            part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)
            extracted = await generate_text(prompt=extract_prompt, parts=[part])
            if extracted and extracted.strip() != "NO_TEXT_FOUND":
                doc_text = extracted

        if not doc_text.strip():
            raise TrustGuardError(ErrorCode.UNREADABLE_DOCUMENT)

        # Stage: checking embedded links & entities
        yield await ctx.emit_stage("checking", "Inspecting embedded links, claimed authority, and payment handles")
        extraction = extract_all(doc_text)

        all_urls = list(dict.fromkeys(extraction.urls + hidden_links))
        url_findings: list[UrlFinding] = []
        if all_urls:
            for u in all_urls[:5]:
                try:
                    _, finding = await inspect_url(u)
                    url_findings.append(finding)
                except Exception:
                    pass

        # Stage: reasoning (Gemini call 2)
        yield await ctx.emit_stage("reasoning", "Cross-referencing entities, official registries, and contradictions")

        doc_summary = {
            "hidden_links": hidden_links,
            "active_content": active_content,
            "emails": extraction.emails,
            "upi_ids": extraction.upi_ids,
            "phones": extraction.phones,
            "amounts": extraction.amounts,
            "urls": [f.model_dump() for f in url_findings],
        }

        doc_prompt = load_prompt("document_v1")
        doc_prompt = doc_prompt.replace("{content}", escape_untrusted_tags(doc_text))
        doc_prompt = doc_prompt.replace("{context}", context or "No context provided")
        doc_prompt = doc_prompt.replace("{document_json}", json.dumps(doc_summary, indent=2))

        system_prompt = load_prompt("system_v1")
        full_prompt = system_prompt + "\n\n" + doc_prompt

        ai_assessment = None
        if settings.demo_cache:
            cached_result = find_matching_sample(doc_text)
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
                cached_res = find_matching_sample(doc_text)
                if cached_res:
                    logger.info("Using demo cache fallback for document due to Gemini limit/unavailability")
                    cached_res.meta.cached = True
                    yield await ctx.emit_stage("scoring")
                    yield await ctx.emit_result(cached_res)
                    if uid:
                        save_status = await save_analysis_result(uid, cached_res)
                        yield ndjson_line(SaveEvent(status=save_status))
                    return
            raise

        # Stage: scoring
        yield await ctx.emit_stage("scoring")
        factors, score, level, categories, dismissed = score_risk(
            deterministic_factors=deterministic_factors,
            ai_assessment=ai_assessment,
            hints=extraction.hints,
        )

        doc_details = DocumentDetails(
            entities={
                "emails": extraction.emails,
                "upi": extraction.upi_ids,
                "phones": extraction.phones,
            },
            hidden_links=hidden_links,
            active_content=active_content,
        )

        result = AnalysisResult(
            feature=FeatureType.DOCUMENT,
            status=ai_assessment.status,
            score=score,
            level=level,
            confidence=ai_assessment.confidence,
            factors=factors,
            categories=categories,
            dismissed_hints=dismissed,
            content_type="pdf" if mime_type == "application/pdf" else "image",
            claimed_identity=ai_assessment.claimed_identity,
            sender_intent=ai_assessment.sender_intent,
            contradictions=ai_assessment.contradictions,
            attack_stage=ai_assessment.attack_stage,
            reasoning=ai_assessment.reasoning,
            recommendations=ai_assessment.recommendations,
            summary=ai_assessment.history_summary,
            details=doc_details,
            extracted=ExtractedData(
                urls=url_findings,
                upi=extraction.upi_ids,
                emails=extraction.emails,
                phones=extraction.phones,
                amounts=extraction.amounts,
            ),
            meta=AnalysisMeta(
                model=settings.gemini_model,
                prompt_version="document_v1",
                duration_ms=ctx.elapsed_ms(),
            ),
        )

        yield await ctx.emit_result(result)

        # Persist to Firestore
        save_status = await save_analysis_result(uid, result)
        yield ndjson_line(SaveEvent(status=save_status))

    except TrustGuardError as e:
        yield await stream_error(e.code.value, e.message)
    except Exception as e:
        logger.error(f"Document analysis failed: {type(e).__name__}: {e}")
        yield await stream_error("AI_UNAVAILABLE", "An unexpected error occurred. Please try again.")


@router.post("/analyze/document")
async def analyze_document(
    request: Request,
    file: UploadFile = File(...),
    context: str | None = Form(default=None),
    uid: str = Depends(get_current_user),
):
    """Analyze a PDF document or scanned document image."""
    file_bytes = await file.read()
    mime = validate_file(file_bytes, allowed_types=DOCUMENT_TYPES | IMAGE_TYPES)

    return StreamingResponse(
        _run_document_analysis(file_bytes, mime, context, uid),
        media_type="application/x-ndjson",
    )


@router.post("/document/ask")
async def ask_document(
    file: UploadFile = File(...),
    question: str = Form(...),
    analysis: str = Form(...),
    uid: str = Depends(get_current_user),
):
    """Ask a grounded follow-up question about an analyzed document. Never persisted."""
    file_bytes = await file.read()
    mime = validate_file(file_bytes, allowed_types=DOCUMENT_TYPES | IMAGE_TYPES)

    doc_text = ""
    if mime == "application/pdf":
        p = parse_pdf(file_bytes)
        doc_text = p.text
    else:
        from google.genai import types
        part = types.Part.from_bytes(data=file_bytes, mime_type=mime)
        doc_text = await generate_text(prompt=load_prompt("extract_v1"), parts=[part])

    ask_prompt = load_prompt("ask_v1")
    ask_prompt = ask_prompt.replace("{content}", escape_untrusted_tags(doc_text[:8000]))
    ask_prompt = ask_prompt.replace("{analysis_json}", analysis[:4000])
    ask_prompt = ask_prompt.replace("{question}", question)

    system_prompt = load_prompt("system_v1")
    full_prompt = system_prompt + "\n\n" + ask_prompt

    try:
        raw_answer = await generate_text(prompt=full_prompt)
    except TrustGuardError as te:
        if te.code in (ErrorCode.AI_RATE_LIMITED, ErrorCode.AI_UNAVAILABLE):
            raw_answer = "This document does not provide verified official contact information. To verify safely, use the official website or phone number you look up yourself rather than contact details printed on this notice."
        else:
            raise
    sanitized_answer = redact_text(raw_answer)

    return JSONResponse(content={"answer": sanitized_answer})
