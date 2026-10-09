"""QR & Payment Scam Detector router."""
import json
import logging
from fastapi import APIRouter, Form, UploadFile, File, Request, Depends
from fastapi.responses import StreamingResponse

from config import settings
from errors import TrustGuardError, ErrorCode
from schemas import (
    FeatureType,
    AnalysisResult,
    AnalysisMeta,
    ExtractedData,
    PaymentDetails,
    Factor,
    AIAssessment,
    SaveEvent,
)
from services.pipeline import PipelineContext, ndjson_line, stream_error
from services.auth import get_current_user
from services.history_store import save_analysis_result
from services.qr_decoder import decode_qr
from services.upi_parser import parse_upi_uri
from services.url_inspector import inspect_url
from services.file_validation import validate_file, validate_text, IMAGE_TYPES
from services.gemini_client import generate_structured
from services.prompts import load_prompt
from services.risk_engine import score_risk
from services.demo_cache import find_matching_sample

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analyze", tags=["payment"])


async def _run_payment_analysis(
    image_bytes: bytes | None,
    text: str | None,
    purpose: str | None,
    uid: str,
):
    ctx = PipelineContext()
    try:
        yield await ctx.emit_stage("received")

        # Stage: extracting QR codes
        yield await ctx.emit_stage("extracting", "Scanning for QR codes and payment payloads")
        qr_payloads = []
        if image_bytes:
            qr_payloads = decode_qr(image_bytes)
            if not qr_payloads and not text:
                raise TrustGuardError(ErrorCode.NO_QR_FOUND)

        # Stage: checking payment structure & destination
        yield await ctx.emit_stage("checking", "Analyzing payment destination and parameters")
        deterministic_factors: list[Factor] = []
        payment_details = None
        url_findings = []

        primary_payload = qr_payloads[0] if qr_payloads else (text or "")

        # 1. Check if UPI URI
        upi_res = parse_upi_uri(primary_payload, stated_purpose=purpose)
        if upi_res.is_upi:
            deterministic_factors.extend(upi_res.deterministic_factors)
            payment_details = PaymentDetails(
                payment_type="UPI",
                payee_vpa=upi_res.payee_vpa,
                payee_name=upi_res.payee_name,
                amount=upi_res.amount,
                currency=upi_res.currency,
                note=upi_res.note,
                merchant_code=upi_res.merchant_code,
                qr_payloads=qr_payloads,
            )
        elif primary_payload.startswith("http://") or primary_payload.startswith("https://"):
            # QR contains URL
            url_signals, finding = await inspect_url(primary_payload)
            if finding.blocked_reason:
                raise TrustGuardError(ErrorCode.URL_BLOCKED)
            url_findings.append(finding)
            payment_details = PaymentDetails(
                payment_type="URL_PAYMENT",
                qr_payloads=qr_payloads,
            )
        else:
            payment_details = PaymentDetails(
                payment_type="OTHER",
                qr_payloads=qr_payloads,
            )

        # Stage: reasoning (Gemini call 2)
        yield await ctx.emit_stage("reasoning", "Evaluating financial risks, recipient legitimacy, and fee patterns")

        payment_summary = {
            "payloads": qr_payloads,
            "parsed": payment_details.model_dump() if payment_details else {},
            "url_findings": [f.model_dump() for f in url_findings],
        }

        payment_prompt = load_prompt("payment_v1")
        payment_prompt = payment_prompt.replace("{content}", primary_payload)
        payment_prompt = payment_prompt.replace("{purpose}", purpose or "No specific purpose provided")
        payment_prompt = payment_prompt.replace("{payment_json}", json.dumps(payment_summary, indent=2))

        system_prompt = load_prompt("system_v1")
        full_prompt = system_prompt + "\n\n" + payment_prompt

        search_str = f"{primary_payload} {purpose or ''}"
        ai_assessment = None
        if settings.demo_cache:
            cached_result = find_matching_sample(search_str)
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
                cached_res = find_matching_sample(search_str)
                if cached_res:
                    logger.info("Using demo cache fallback for payment due to Gemini limit/unavailability")
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
            hints=[],
        )

        result = AnalysisResult(
            feature=FeatureType.PAYMENT,
            status=ai_assessment.status,
            score=score,
            level=level,
            confidence=ai_assessment.confidence,
            factors=factors,
            categories=categories,
            dismissed_hints=dismissed,
            content_type="qr_code" if qr_payloads else "text",
            claimed_identity=ai_assessment.claimed_identity or (payment_details.payee_name if payment_details else None),
            sender_intent=ai_assessment.sender_intent,
            contradictions=ai_assessment.contradictions,
            attack_stage=ai_assessment.attack_stage,
            reasoning=ai_assessment.reasoning,
            recommendations=ai_assessment.recommendations,
            summary=ai_assessment.history_summary,
            details=payment_details,
            extracted=ExtractedData(
                urls=url_findings,
                upi=[payment_details.payee_vpa] if payment_details and payment_details.payee_vpa else [],
                amounts=[payment_details.amount] if payment_details and payment_details.amount else [],
            ),
            meta=AnalysisMeta(
                model=settings.gemini_model,
                prompt_version="payment_v1",
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
        logger.error(f"Payment analysis failed: {type(e).__name__}: {e}")
        yield await stream_error("AI_UNAVAILABLE", "An unexpected error occurred. Please try again.")


@router.post("/payment")
async def analyze_payment(
    request: Request,
    image: UploadFile | None = File(default=None),
    text: str = Form(default=None),
    purpose: str = Form(default=None),
    uid: str = Depends(get_current_user),
):
    """Analyze QR code or payment request."""
    image_bytes = None
    if image:
        image_bytes = await image.read()
        validate_file(image_bytes, allowed_types=IMAGE_TYPES)

    if not image_bytes and not text:
        raise TrustGuardError(ErrorCode.UNSUPPORTED_FILE)

    if text:
        validate_text(text)

    return StreamingResponse(
        _run_payment_analysis(image_bytes, text, purpose, uid),
        media_type="application/x-ndjson",
    )
