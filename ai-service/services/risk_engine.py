"""Deterministic risk engine.

Gemini can add factors but never remove or downgrade deterministic ones.
An injection attempt detected by code cancels all Gemini hint dismissals.
"""
from schemas import (
    Factor,
    FactorSource,
    Severity,
    RiskLevel,
    CategoryStatus,
    DismissedHint,
    AIAssessment,
    HintVerdict,
    Hint,
)
from services.signals import (
    SIGNAL_TABLE,
    SignalCategory,
    GRID_CATEGORIES,
    HINT_SIGNAL_MAP,
    compute_weight,
)


def _severity_rank(s: str) -> int:
    return {"LOW": 0, "MEDIUM": 1, "HIGH": 2}.get(s, -1)


def _level_from_score(score: int) -> RiskLevel:
    if score >= 80:
        return RiskLevel.CRITICAL
    if score >= 60:
        return RiskLevel.HIGH
    if score >= 30:
        return RiskLevel.MEDIUM
    return RiskLevel.LOW


def score_risk(
    deterministic_factors: list[Factor],
    ai_assessment: AIAssessment | None,
    hints: list[Hint],
    injection_detected_by_code: bool = False,
    is_voice: bool = False,
) -> tuple[list[Factor], int | None, RiskLevel | None, list[CategoryStatus], list[DismissedHint]]:
    """Compute risk score from deterministic factors and AI assessment.

    Returns: (merged_factors, score, level, categories, dismissed_hints)
    """
    if ai_assessment and ai_assessment.status.value == "insufficient_content":
        cats = _build_categories([], is_voice)
        return [], None, None, cats, []

    # Step 1: Start with deterministic factors (keyed by code)
    factor_map: dict[str, Factor] = {}
    for f in deterministic_factors:
        factor_map[f.code] = f

    # Step 2: Process hints
    dismissed: list[DismissedHint] = []
    hint_map = {h.id: h for h in hints}

    if ai_assessment:
        review_map = {r.hint_id: r for r in ai_assessment.hint_reviews}
    else:
        review_map = {}

    for hint in hints:
        review = review_map.get(hint.id)
        signal_code = HINT_SIGNAL_MAP.get(hint.id, hint.mapped_signal)
        sig_def = SIGNAL_TABLE.get(signal_code)
        if not sig_def:
            continue

        if injection_detected_by_code:
            # Injection cancels all dismissals: count as MEDIUM deterministic
            sev = Severity.MEDIUM
            w = compute_weight(sig_def.base_weight, sev.value)
            f = Factor(
                code=signal_code,
                category=sig_def.category.value,
                severity=sev,
                weight=w,
                source=FactorSource.DETERMINISTIC,
                title=f"{signal_code.replace('_', ' ').title()} (hint)",
                why_it_matters=hint.description,
                evidence=None,
            )
            _merge_factor(factor_map, f)
        elif review and review.verdict == HintVerdict.CONFIRMED:
            # Confirmed by AI
            ai_sig = _find_ai_signal(ai_assessment, signal_code)
            sev = Severity(ai_sig.severity.value) if ai_sig else Severity.MEDIUM
            w = compute_weight(sig_def.base_weight, sev.value)
            title = ai_sig.title if ai_sig else signal_code.replace("_", " ").title()
            why = ai_sig.why_it_matters if ai_sig else hint.description
            evidence = ai_sig.evidence_quote if ai_sig else None
            f = Factor(
                code=signal_code,
                category=sig_def.category.value,
                severity=sev,
                weight=w,
                source=FactorSource.AI,
                title=title,
                why_it_matters=why,
                evidence=evidence,
            )
            _merge_factor(factor_map, f)
        elif review and review.verdict == HintVerdict.DISMISSED:
            dismissed.append(DismissedHint(hint_id=hint.id, reason=review.reason))
        else:
            # Not reviewed -> counts at MEDIUM deterministic
            sev = Severity.MEDIUM
            w = compute_weight(sig_def.base_weight, sev.value)
            f = Factor(
                code=signal_code,
                category=sig_def.category.value,
                severity=sev,
                weight=w,
                source=FactorSource.DETERMINISTIC,
                title=signal_code.replace("_", " ").title(),
                why_it_matters=hint.description,
                evidence=None,
            )
            _merge_factor(factor_map, f)

    # Step 3: Add AI signals (that aren't already from hints)
    if ai_assessment:
        for sig in ai_assessment.signals:
            sig_def = SIGNAL_TABLE.get(sig.code)
            if not sig_def:
                continue
            if sig_def.code_settable and sig.code not in [f.code for f in deterministic_factors]:
                # AI can't set code-only signals
                pass
            else:
                w = compute_weight(sig_def.base_weight, sig.severity.value)
                f = Factor(
                    code=sig.code,
                    category=sig_def.category.value,
                    severity=Severity(sig.severity.value),
                    weight=w,
                    source=FactorSource.AI,
                    title=sig.title,
                    why_it_matters=sig.why_it_matters,
                    evidence=sig.evidence_quote,
                )
                _merge_factor(factor_map, f, allow_downgrade=False)

    # Step 4: Cross-evidence rules
    combined_bonus = _apply_cross_evidence(factor_map)

    # Step 5: Compute score
    factors = sorted(factor_map.values(), key=lambda f: f.weight, reverse=True)
    raw_score = sum(f.weight for f in factors)
    score = min(100, raw_score)
    level = _level_from_score(score)

    categories = _build_categories(factors, is_voice)

    return factors, score, level, categories, dismissed


def _merge_factor(factor_map: dict[str, Factor], new: Factor, allow_downgrade: bool = True) -> None:
    """Merge: one factor per code, highest severity wins.
    Deterministic factors can't be downgraded by AI."""
    existing = factor_map.get(new.code)
    if existing is None:
        factor_map[new.code] = new
        return

    # Deterministic factors survive AI downgrade
    if existing.source == FactorSource.DETERMINISTIC and new.source == FactorSource.AI:
        if _severity_rank(new.severity.value) <= _severity_rank(existing.severity.value):
            return  # AI can't downgrade

    if _severity_rank(new.severity.value) > _severity_rank(existing.severity.value):
        factor_map[new.code] = new
    elif not allow_downgrade and _severity_rank(new.severity.value) < _severity_rank(existing.severity.value):
        return  # Don't downgrade


def _find_ai_signal(assessment: AIAssessment | None, code: str):
    if not assessment:
        return None
    for sig in assessment.signals:
        if sig.code == code:
            return sig
    return None


def _apply_cross_evidence(factor_map: dict[str, Factor]) -> int:
    """Apply cross-evidence rules. Returns total bonus (capped at 25)."""
    total_bonus = 0

    def has_category_at_severity(category: str, min_sev: str) -> bool:
        min_rank = _severity_rank(min_sev)
        for f in factor_map.values():
            if f.category == category and _severity_rank(f.severity.value) >= min_rank:
                return True
        return False

    def has_any_factor_in_category(category: str) -> bool:
        return any(f.category == category for f in factor_map.values())

    def has_code(code: str) -> bool:
        return code in factor_map

    # R1: Payment under pressure
    if (has_category_at_severity("Financial", "MEDIUM")
            and (has_category_at_severity("Urgency", "MEDIUM")
                 or has_category_at_severity("Manipulation", "MEDIUM"))):
        bonus = min(10, 25 - total_bonus)
        if bonus > 0:
            total_bonus += bonus
            factor_map[f"COMBINED_PATTERN_R1"] = Factor(
                code="COMBINED_PATTERN",
                category="Pattern",
                severity=Severity.HIGH,
                weight=bonus,
                source=FactorSource.COMBINED,
                title="Payment under pressure",
                why_it_matters="Being pressured to pay quickly reduces your time to verify the request and is a common manipulation tactic.",
                evidence=None,
            )

    # R2: Unverified requester wants money or secrets
    if (has_any_factor_in_category("Identity")
            and (has_category_at_severity("Financial", "MEDIUM")
                 or has_category_at_severity("Credentials", "MEDIUM"))):
        bonus = min(12, 25 - total_bonus)
        if bonus > 0:
            total_bonus += bonus
            factor_map[f"COMBINED_PATTERN_R2"] = Factor(
                code="COMBINED_PATTERN",
                category="Pattern",
                severity=Severity.HIGH,
                weight=bonus,
                source=FactorSource.COMBINED,
                title="Unverified requester wants money or secrets",
                why_it_matters="An unverified identity combined with a financial or credential request is a strong indicator of a potential scam.",
                evidence=None,
            )

    # R3: Off-brand destination for a sensitive request
    if ((has_code("IDENTITY_MISMATCH") or has_code("DESTINATION_BRAND_MISMATCH"))
            and has_any_factor_in_category("Credentials")):
        bonus = min(15, 25 - total_bonus)
        if bonus > 0:
            total_bonus += bonus
            factor_map[f"COMBINED_PATTERN_R3"] = Factor(
                code="COMBINED_PATTERN",
                category="Pattern",
                severity=Severity.HIGH,
                weight=bonus,
                source=FactorSource.COMBINED,
                title="Off-brand destination for a sensitive request",
                why_it_matters="A credential request from a mismatched or suspicious destination significantly increases the risk of phishing.",
                evidence=None,
            )

    return total_bonus


def _build_categories(factors: list[Factor], is_voice: bool) -> list[CategoryStatus]:
    """Build category grid. Pattern excluded. Voice only for voice analyses."""
    cat_severities: dict[str, Severity | None] = {}
    for cat in GRID_CATEGORIES:
        cat_severities[cat.value] = None

    for f in factors:
        if f.category == "Pattern":
            continue
        current = cat_severities.get(f.category)
        if current is None or _severity_rank(f.severity.value) > _severity_rank(current.value if current else ""):
            cat_severities[f.category] = f.severity

    result = []
    for cat in GRID_CATEGORIES:
        if cat == SignalCategory.VOICE and not is_voice:
            continue
        sev = cat_severities.get(cat.value)
        if sev is None:
            label = "Not detected"
        elif cat == SignalCategory.IDENTITY and sev == Severity.LOW:
            # Special case: only IDENTITY_UNVERIFIED -> show "Unverified"
            identity_factors = [f for f in factors if f.category == "Identity"]
            if all(f.code == "IDENTITY_UNVERIFIED" for f in identity_factors):
                label = "Unverified"
            else:
                label = sev.value.title()
        else:
            label = sev.value.title()
        result.append(CategoryStatus(category=cat.value, severity=sev, label=label))

    return result
