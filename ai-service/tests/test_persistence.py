"""Tests for Firestore persistence and retry store."""
import pytest
from unittest.mock import patch, MagicMock
from schemas import (
    AnalysisResult,
    FeatureType,
    AnalysisStatus,
    RiskLevel,
    Confidence,
    Factor,
    FactorSource,
    Severity,
    CategoryStatus,
    AnalysisMeta,
)
from services.history_store import (
    save_analysis_result,
    retry_save_analysis,
    _build_history_record,
    _RETRY_CACHE,
)


def _sample_result(analysis_id="ana-test-01"):
    return AnalysisResult(
        id=analysis_id,
        feature=FeatureType.CONVERSATION,
        status=AnalysisStatus.ASSESSED,
        score=71,
        level=RiskLevel.HIGH,
        confidence=Confidence.HIGH,
        factors=[
            Factor(
                code="UPFRONT_FEE",
                category="Financial",
                severity=Severity.HIGH,
                weight=25,
                source=FactorSource.AI,
                title="Upfront registration fee",
                why_it_matters="Asking for ₹1500 to alice@ybl before job confirmation is suspicious.",
                evidence="Pay ₹1500 to proceed",  # Verbatim quote (must NOT appear in record)
            ),
            Factor(
                code="PERSONAL_RECIPIENT",
                category="Financial",
                severity=Severity.HIGH,
                weight=15,
                source=FactorSource.DETERMINISTIC,
                title="Personal recipient account",
                why_it_matters="Payment goes to 9876543210 on phone.",
                evidence=None,
            ),
            Factor(
                code="COMBINED_PATTERN",
                category="Pattern",
                severity=Severity.HIGH,
                weight=31,
                source=FactorSource.COMBINED,
                title="Payment under pressure",
                why_it_matters="Visit https://phish.example.com/pay within 1 hour.",
                evidence=None,
            ),
        ],
        categories=[
            CategoryStatus(category="Financial", severity=Severity.HIGH, label="High"),
        ],
        summary="Suspicious job fee request for ₹1500 sent to alice@ybl.",
        reasoning="The sender demands ₹1500 via UPI id alice@ybl at https://fake.corp.example.com.",
        recommendations=["Do not send ₹1500 to alice@ybl", "Verify with official employer"],
        meta=AnalysisMeta(model="gemini-3.8-flash", prompt_version="v1", duration_ms=450),
    )


def test_built_record_has_no_quotes_and_redacts_pii():
    res = _sample_result()
    record = _build_history_record(res)

    # 1. No raw evidence quotes stored
    for f in record["evidence"]:
        assert "evidence" not in f

    # 2. Sum of evidence weights equals riskScore
    assert sum(f["weight"] for f in record["evidence"]) == record["riskScore"]

    # 3. PII is redacted in summary, reasoning, recommendations, descriptions
    assert "alice@ybl" not in record["summary"]
    assert "[upi-id]" in record["summary"]
    assert "https://fake.corp.example.com" not in record["reasoning"]
    assert "example.com" in record["reasoning"]
    assert "alice@ybl" not in record["recommendations"][0]["action"]


@pytest.mark.asyncio
async def test_save_skipped_when_history_off():
    with patch("services.history_store.should_save_history", return_value=False):
        result = _sample_result("ana-skip-01")
        status = await save_analysis_result("user-1", result)
        assert status == "save_skipped"


@pytest.mark.asyncio
async def test_save_failed_and_retry_succeeds():
    result = _sample_result("ana-retry-01")
    uid = "user-retry-test"

    # Step 1: Simulate failure when DB is None
    with patch("services.history_store.should_save_history", return_value=True):
        with patch("services.history_store.get_firestore_db", return_value=None):
            status = await save_analysis_result(uid, result)
            assert status == "save_failed"
            assert (uid, "ana-retry-01") in _RETRY_CACHE

    # Step 2: Retry succeeds with mock DB
    mock_db = MagicMock()
    mock_coll = MagicMock()
    mock_doc = MagicMock()
    mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc

    with patch("services.history_store.get_firestore_db", return_value=mock_db):
        success = await retry_save_analysis(uid, "ana-retry-01")
        assert success is True
        assert (uid, "ana-retry-01") not in _RETRY_CACHE
        assert mock_doc.set.called


@pytest.mark.asyncio
async def test_idempotent_save():
    """Saving the exact same analysis id twice calls set() on the same document."""
    result = _sample_result("ana-idemp-01")
    uid = "user-idemp"
    mock_db = MagicMock()
    mock_doc = MagicMock()
    mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc

    with patch("services.history_store.should_save_history", return_value=True):
        with patch("services.history_store.get_firestore_db", return_value=mock_db):
            status1 = await save_analysis_result(uid, result)
            status2 = await save_analysis_result(uid, result)
            assert status1 == "saved"
            assert status2 == "saved"
            # Both writes target the same document ID
            assert mock_db.collection("users").document(uid).collection("analyses").document.call_args[0][0] == "ana-idemp-01"
