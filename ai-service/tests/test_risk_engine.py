"""Risk engine tests."""
import pytest
from schemas import Factor, FactorSource, Severity, RiskLevel, AIAssessment, AISignal, HintReview, HintVerdict, Hint, AnalysisStatus, Confidence
from services.risk_engine import score_risk
from services.signals import compute_weight


def _make_factor(code: str, category: str, severity: str, weight: int, source: str = "ai") -> Factor:
    return Factor(
        code=code, category=category, severity=Severity(severity),
        weight=weight, source=FactorSource(source),
        title=f"{code} title", why_it_matters=f"{code} matters", evidence=None,
    )


def test_worked_example():
    """UPFRONT_FEE HIGH 25 + PERSONAL_RECIPIENT HIGH 15 + URGENCY MEDIUM 7 +
    IDENTITY_UNVERIFIED LOW 2 + R1 10 + R2 12 = 71 -> HIGH."""
    det_factors = [
        _make_factor("PERSONAL_RECIPIENT", "Financial", "HIGH", compute_weight(15, "HIGH"), "deterministic"),
    ]
    ai = AIAssessment(
        status=AnalysisStatus.ASSESSED,
        signals=[
            AISignal(code="UPFRONT_FEE", severity=Severity.HIGH, title="Upfront fee", why_it_matters="Fee scam"),
            AISignal(code="URGENCY", severity=Severity.MEDIUM, title="Urgency", why_it_matters="Time pressure"),
            AISignal(code="IDENTITY_UNVERIFIED", severity=Severity.LOW, title="Unverified", why_it_matters="Unknown"),
        ],
        confidence=Confidence.HIGH,
    )
    factors, score, level, cats, dismissed = score_risk(det_factors, ai, [])

    # Check individual weights
    weight_map = {}
    for f in factors:
        if f.code == "COMBINED_PATTERN":
            weight_map[f.title] = f.weight
        else:
            weight_map[f.code] = f.weight
    
    assert weight_map.get("UPFRONT_FEE") == 25  # HIGH: (25*100+50)//100 = 25
    assert weight_map.get("PERSONAL_RECIPIENT") == 15  # HIGH: (15*100+50)//100 = 15
    assert weight_map.get("URGENCY") == 7  # MEDIUM: (10*70+50)//100 = 7
    assert weight_map.get("IDENTITY_UNVERIFIED") == 2  # LOW: (5*40+50)//100 = 2
    assert weight_map.get("Payment under pressure") == 10  # R1
    assert weight_map.get("Unverified requester wants money or secrets") == 12  # R2

    assert score == 71
    assert level == RiskLevel.HIGH


def test_score_equals_capped_sum():
    """Displayed score must equal min(100, sum of displayed weights)."""
    det_factors = [
        _make_factor("OTP_PIN_REQUEST", "Credentials", "HIGH", compute_weight(35, "HIGH"), "deterministic"),
        _make_factor("UPFRONT_FEE", "Financial", "HIGH", compute_weight(25, "HIGH"), "ai"),
        _make_factor("RECEIVE_VIA_PAY", "Financial", "HIGH", compute_weight(30, "HIGH"), "ai"),
    ]
    factors, score, level, _, _ = score_risk(det_factors, None, [])
    assert score == min(100, sum(f.weight for f in factors))


def test_band_edge_29_low():
    factors = [_make_factor("UPFRONT_FEE", "Financial", "HIGH", 29)]
    _, score, level, _, _ = score_risk(factors, None, [])
    assert score == 29
    assert level == RiskLevel.LOW


def test_band_edge_30_medium():
    factors = [_make_factor("UPFRONT_FEE", "Financial", "HIGH", 30)]
    _, score, level, _, _ = score_risk(factors, None, [])
    assert score == 30
    assert level == RiskLevel.MEDIUM


def test_band_edge_59_medium():
    factors = [_make_factor("UPFRONT_FEE", "Financial", "HIGH", 59)]
    _, score, level, _, _ = score_risk(factors, None, [])
    assert score == 59
    assert level == RiskLevel.MEDIUM


def test_band_edge_60_high():
    factors = [_make_factor("UPFRONT_FEE", "Financial", "HIGH", 60)]
    _, score, level, _, _ = score_risk(factors, None, [])
    assert score == 60
    assert level == RiskLevel.HIGH


def test_band_edge_79_high():
    factors = [_make_factor("UPFRONT_FEE", "Financial", "HIGH", 79)]
    _, score, level, _, _ = score_risk(factors, None, [])
    assert score == 79
    assert level == RiskLevel.HIGH


def test_band_edge_80_critical():
    factors = [_make_factor("UPFRONT_FEE", "Financial", "HIGH", 80)]
    _, score, level, _, _ = score_risk(factors, None, [])
    assert score == 80
    assert level == RiskLevel.CRITICAL


def test_deterministic_survives_ai_downgrade():
    """A deterministic factor at HIGH cannot be downgraded by AI to LOW."""
    det = [_make_factor("PERSONAL_RECIPIENT", "Financial", "HIGH", 15, "deterministic")]
    ai = AIAssessment(
        status=AnalysisStatus.ASSESSED,
        signals=[AISignal(code="PERSONAL_RECIPIENT", severity=Severity.LOW, title="PR", why_it_matters="AI says low")],
        confidence=Confidence.HIGH,
    )
    factors, _, _, _, _ = score_risk(det, ai, [])
    pr = next(f for f in factors if f.code == "PERSONAL_RECIPIENT")
    assert pr.severity == Severity.HIGH
    assert pr.source == FactorSource.DETERMINISTIC


def test_injection_cancels_dismissals():
    """When injection detected by code, all hint dismissals are cancelled."""
    hints = [
        Hint(id="otp_pin_request", mapped_signal="OTP_PIN_REQUEST", description="OTP keyword found"),
    ]
    ai = AIAssessment(
        status=AnalysisStatus.ASSESSED,
        hint_reviews=[HintReview(hint_id="otp_pin_request", verdict=HintVerdict.DISMISSED, reason="Not asking")],
        confidence=Confidence.HIGH,
    )
    # Without injection: dismissed
    factors1, _, _, _, dismissed1 = score_risk([], ai, hints, injection_detected_by_code=False)
    assert len(dismissed1) == 1
    assert not any(f.code == "OTP_PIN_REQUEST" for f in factors1)

    # With injection: not dismissed, counts as MEDIUM deterministic
    factors2, _, _, _, dismissed2 = score_risk([], ai, hints, injection_detected_by_code=True)
    assert len(dismissed2) == 0
    otp = next(f for f in factors2 if f.code == "OTP_PIN_REQUEST")
    assert otp.severity == Severity.MEDIUM
    assert otp.source == FactorSource.DETERMINISTIC


def test_combined_pattern_bonus_capped_at_25():
    """Total COMBINED_PATTERN bonus cannot exceed 25."""
    det = [
        _make_factor("IDENTITY_MISMATCH", "Identity", "HIGH", 20, "ai"),
        _make_factor("UPFRONT_FEE", "Financial", "HIGH", 25, "ai"),
        _make_factor("URGENCY", "Urgency", "MEDIUM", 7, "ai"),
        _make_factor("OTP_PIN_REQUEST", "Credentials", "HIGH", 35, "deterministic"),
    ]
    factors, _, _, _, _ = score_risk(det, None, [])
    combined_total = sum(f.weight for f in factors if f.code == "COMBINED_PATTERN")
    assert combined_total <= 25


def test_insufficient_content():
    ai = AIAssessment(status=AnalysisStatus.INSUFFICIENT_CONTENT)
    factors, score, level, _, _ = score_risk([], ai, [])
    assert score is None
    assert level is None
    assert factors == []
