"""TrustGuard AI — Firestore persistence and history management service.

Handles:
- User history preference checks
- Idempotent HistoryRecord writes
- 10-minute in-memory retry cache for transient failures
- Recursive deletes for single analyses or all user analyses
"""
import logging
import time
from typing import Any
from google.cloud import firestore

from schemas import AnalysisResult
from services.firebase_app import get_firestore_db
from services.redaction import redact_text, redact_data_structure

logger = logging.getLogger(__name__)

# In-memory retry cache: (uid, analysis_id) -> (record_dict, expires_at)
_RETRY_CACHE: dict[tuple[str, str], tuple[dict[str, Any], float]] = {}
RETRY_CACHE_TTL_SECONDS = 600  # 10 minutes


def _clean_retry_cache():
    now = time.monotonic()
    expired = [k for k, (_, exp) in _RETRY_CACHE.items() if exp < now]
    for k in expired:
        _RETRY_CACHE.pop(k, None)


def _derive_identity_status(result: AnalysisResult) -> str:
    """Derive identity status from result signals and factors."""
    codes = {f.code for f in result.factors}
    if "IDENTITY_MISMATCH" in codes or "IMPERSONATION_PATTERN" in codes:
        return "INCONSISTENT"
    if "IDENTITY_UNVERIFIED" in codes or (result.claimed_identity and not codes):
        return "UNVERIFIED"
    if result.claimed_identity:
        return "NO_ISSUES_FOUND"
    return "NOT_APPLICABLE"


def _build_history_record(result: AnalysisResult) -> dict[str, Any]:
    """Convert an AnalysisResult into a redacted Firestore HistoryRecord dict."""
    # 1. Categories map
    cat_map = {}
    for c in result.categories:
        key = c.category.lower()
        cat_map[key] = c.label.upper().replace(" ", "_") if c.label else "NOT_DETECTED"

    # 2. Evidence factors (all factors without quotes)
    evidence = []
    for f in result.factors:
        evidence.append({
            "code": f.code,
            "category": f.category,
            "severity": f.severity.value,
            "weight": f.weight,
            "source": f.source.value,
            "title": redact_text(f.title),
            "description": redact_text(f.why_it_matters),
        })

    # 3. Top indicators (up to 3 titles)
    top_indicators = [redact_text(f.title) for f in result.factors[:3]]

    # 4. Recommendations
    recs = []
    for idx, r in enumerate(result.recommendations):
        priority = "HIGH" if idx == 0 else "MEDIUM"
        recs.append({"priority": priority, "action": redact_text(r)})

    # 5. Feature-specific details
    details_dict = {}
    if result.details:
        dump = result.details.model_dump()
        # Redact and sanitize details
        if hasattr(result.details, "payee_vpa") and result.details.payee_vpa:
            vpa = result.details.payee_vpa
            parts = vpa.split("@")
            masked = f"{parts[0][:2]}***@{parts[1]}" if len(parts) == 2 else "[upi-id]"
            dump["payeeMasked"] = masked
            dump.pop("payee_vpa", None)
        details_dict = redact_data_structure(dump)

    record = {
        "schemaVersion": 1,
        "featureType": result.feature.value if hasattr(result.feature, "value") else str(result.feature),
        "status": result.status.value if hasattr(result.status, "value") else str(result.status),
        "riskScore": result.score,
        "riskLevel": result.level.value if result.level and hasattr(result.level, "value") else (str(result.level) if result.level else None),
        "confidence": result.confidence.value if hasattr(result.confidence, "value") else str(result.confidence),
        "summary": redact_text(result.summary)[:120],
        "contentType": result.content_type,
        "identityStatus": _derive_identity_status(result),
        "riskCategories": cat_map,
        "evidence": evidence,
        "topIndicators": top_indicators,
        "reasoning": redact_text(result.reasoning),
        "recommendations": recs,
        "attackStage": result.attack_stage.value if result.attack_stage and hasattr(result.attack_stage, "value") else None,
        "details": details_dict,
        "meta": {
            "model": result.meta.model,
            "promptVersion": result.meta.prompt_version,
            "cached": result.meta.cached,
        },
        "createdAt": firestore.SERVER_TIMESTAMP,
    }

    return record


async def should_save_history(uid: str) -> bool:
    """Check users/{uid}.preferences.saveAnalysisHistory. Defaults to True."""
    db = get_firestore_db()
    if db is None:
        return True

    try:
        doc = db.collection("users").document(uid).get()
        if doc.exists:
            data = doc.to_dict() or {}
            prefs = data.get("preferences", {})
            return prefs.get("saveAnalysisHistory", True)
    except Exception as e:
        logger.warning(f"Failed to read preferences for user {uid}: {e}")
    return True


async def save_analysis_result(uid: str, result: AnalysisResult) -> str:
    """Save analysis result to Firestore.

    Returns:
        "saved" | "save_skipped" | "save_failed"
    """
    save_enabled = await should_save_history(uid)
    if not save_enabled:
        logger.info(f"History saving is disabled for user={uid}, skipping save")
        return "save_skipped"

    record_data = _build_history_record(result)
    db = get_firestore_db()
    if db is None:
        logger.error("Firestore database client not available for saving analysis")
        _cache_for_retry(uid, result.id, record_data)
        return "save_failed"

    try:
        # Idempotent write: doc ID = result.id
        db.collection("users").document(uid).collection("analyses").document(result.id).set(record_data)
        logger.info(f"Successfully saved analysis id={result.id} for user={uid}")
        # Remove from retry cache if present
        _RETRY_CACHE.pop((uid, result.id), None)
        return "saved"
    except Exception as e:
        logger.error(f"Failed to save analysis id={result.id} for user={uid}: {e}")
        _cache_for_retry(uid, result.id, record_data)
        return "save_failed"


def _cache_for_retry(uid: str, analysis_id: str, record_data: dict[str, Any]):
    _clean_retry_cache()
    _RETRY_CACHE[(uid, analysis_id)] = (record_data, time.monotonic() + RETRY_CACHE_TTL_SECONDS)


async def retry_save_analysis(uid: str, analysis_id: str) -> bool:
    """Retry saving an analysis from in-memory retry cache."""
    _clean_retry_cache()
    cached = _RETRY_CACHE.get((uid, analysis_id))
    if not cached:
        return False

    record_data, _ = cached
    db = get_firestore_db()
    if db is None:
        return False

    try:
        db.collection("users").document(uid).collection("analyses").document(analysis_id).set(record_data)
        _RETRY_CACHE.pop((uid, analysis_id), None)
        return True
    except Exception as e:
        logger.error(f"Retry save failed for analysis={analysis_id}: {e}")
        return False


def _delete_collection_recursive(db, coll_ref, batch_size=50):
    """Recursively delete a Firestore collection and its subcollections."""
    docs = coll_ref.limit(batch_size).stream()
    deleted = 0
    for doc in docs:
        doc_ref = doc.reference
        # Delete subcollections
        for subcoll in doc_ref.collections():
            _delete_collection_recursive(db, subcoll, batch_size)
        doc_ref.delete()
        deleted += 1

    if deleted >= batch_size:
        return _delete_collection_recursive(db, coll_ref, batch_size)


async def delete_analysis_doc(uid: str, analysis_id: str) -> bool:
    """Recursively delete an analysis document and any subcollections."""
    db = get_firestore_db()
    if db is None:
        return False

    try:
        doc_ref = db.collection("users").document(uid).collection("analyses").document(analysis_id)
        # Check subcollections (e.g. simulation)
        for subcoll in doc_ref.collections():
            _delete_collection_recursive(db, subcoll)
        doc_ref.delete()
        _RETRY_CACHE.pop((uid, analysis_id), None)
        return True
    except Exception as e:
        logger.error(f"Failed to delete analysis={analysis_id} for user={uid}: {e}")
        return False


async def delete_all_user_analyses(uid: str) -> bool:
    """Recursively delete all analysis documents for a user."""
    db = get_firestore_db()
    if db is None:
        return False

    try:
        coll_ref = db.collection("users").document(uid).collection("analyses")
        _delete_collection_recursive(db, coll_ref)
        # Clean retry cache for user
        keys_to_remove = [k for k in _RETRY_CACHE.keys() if k[0] == uid]
        for k in keys_to_remove:
            _RETRY_CACHE.pop(k, None)
        return True
    except Exception as e:
        logger.error(f"Failed to delete all analyses for user={uid}: {e}")
        return False
