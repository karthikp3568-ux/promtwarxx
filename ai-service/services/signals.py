"""Signal taxonomy and code definitions.

All signal weights are defined here and tuned only here.
"""
from dataclasses import dataclass
from enum import Enum


class SignalCategory(str, Enum):
    IDENTITY = "Identity"
    URGENCY = "Urgency"
    MANIPULATION = "Manipulation"
    FINANCIAL = "Financial"
    CREDENTIALS = "Credentials"
    DESTINATION = "Destination"
    VOICE = "Voice"
    PATTERN = "Pattern"


@dataclass(frozen=True)
class SignalDef:
    code: str
    category: SignalCategory
    base_weight: int
    code_settable: bool  # True if code (deterministic) can set this signal


# The ONE signal table. Weights are tuned only here.
SIGNAL_TABLE: dict[str, SignalDef] = {
    # Identity
    "IDENTITY_UNVERIFIED": SignalDef("IDENTITY_UNVERIFIED", SignalCategory.IDENTITY, 5, False),
    "IDENTITY_MISMATCH": SignalDef("IDENTITY_MISMATCH", SignalCategory.IDENTITY, 20, False),
    "IMPERSONATION_PATTERN": SignalDef("IMPERSONATION_PATTERN", SignalCategory.IDENTITY, 20, False),
    "CONTEXT_CONTRADICTION": SignalDef("CONTEXT_CONTRADICTION", SignalCategory.IDENTITY, 12, False),
    # Urgency
    "URGENCY": SignalDef("URGENCY", SignalCategory.URGENCY, 10, False),
    "ARTIFICIAL_DEADLINE": SignalDef("ARTIFICIAL_DEADLINE", SignalCategory.URGENCY, 8, False),
    # Manipulation
    "THREAT_OR_FEAR": SignalDef("THREAT_OR_FEAR", SignalCategory.MANIPULATION, 15, False),
    "AUTHORITY_PRESSURE": SignalDef("AUTHORITY_PRESSURE", SignalCategory.MANIPULATION, 10, False),
    "REWARD_BAIT": SignalDef("REWARD_BAIT", SignalCategory.MANIPULATION, 12, False),
    "SECRECY": SignalDef("SECRECY", SignalCategory.MANIPULATION, 12, False),
    "EMOTIONAL_MANIPULATION": SignalDef("EMOTIONAL_MANIPULATION", SignalCategory.MANIPULATION, 10, False),
    "VERIFICATION_DISCOURAGED": SignalDef("VERIFICATION_DISCOURAGED", SignalCategory.MANIPULATION, 15, False),
    "OFF_PLATFORM_MOVE": SignalDef("OFF_PLATFORM_MOVE", SignalCategory.MANIPULATION, 8, False),
    "PROMPT_INJECTION_ATTEMPT": SignalDef("PROMPT_INJECTION_ATTEMPT", SignalCategory.MANIPULATION, 20, True),
    # Financial
    "UPFRONT_FEE": SignalDef("UPFRONT_FEE", SignalCategory.FINANCIAL, 25, False),
    "RECEIVE_VIA_PAY": SignalDef("RECEIVE_VIA_PAY", SignalCategory.FINANCIAL, 30, False),
    "PERSONAL_RECIPIENT": SignalDef("PERSONAL_RECIPIENT", SignalCategory.FINANCIAL, 15, True),
    "UNUSUAL_AMOUNT": SignalDef("UNUSUAL_AMOUNT", SignalCategory.FINANCIAL, 8, False),
    "CRYPTO_OR_GIFT_CARD": SignalDef("CRYPTO_OR_GIFT_CARD", SignalCategory.FINANCIAL, 20, False),
    # Credentials
    "OTP_PIN_REQUEST": SignalDef("OTP_PIN_REQUEST", SignalCategory.CREDENTIALS, 35, False),
    "CREDENTIAL_REQUEST": SignalDef("CREDENTIAL_REQUEST", SignalCategory.CREDENTIALS, 30, False),
    "REMOTE_ACCESS_REQUEST": SignalDef("REMOTE_ACCESS_REQUEST", SignalCategory.CREDENTIALS, 35, False),
    "APP_INSTALL_REQUEST": SignalDef("APP_INSTALL_REQUEST", SignalCategory.CREDENTIALS, 15, False),
    "PERSONAL_DATA_REQUEST": SignalDef("PERSONAL_DATA_REQUEST", SignalCategory.CREDENTIALS, 12, False),
    # Destination (URL_* and PDF codes are code-only)
    "DESTINATION_BRAND_MISMATCH": SignalDef("DESTINATION_BRAND_MISMATCH", SignalCategory.DESTINATION, 20, False),
    "URL_SHORTENED": SignalDef("URL_SHORTENED", SignalCategory.DESTINATION, 8, True),
    "URL_REDIRECT_DOMAIN_CHANGE": SignalDef("URL_REDIRECT_DOMAIN_CHANGE", SignalCategory.DESTINATION, 12, True),
    "URL_IP_HOST": SignalDef("URL_IP_HOST", SignalCategory.DESTINATION, 15, True),
    "URL_PUNYCODE": SignalDef("URL_PUNYCODE", SignalCategory.DESTINATION, 15, True),
    "URL_USERINFO": SignalDef("URL_USERINFO", SignalCategory.DESTINATION, 15, True),
    "URL_UNUSUAL_SCHEME": SignalDef("URL_UNUSUAL_SCHEME", SignalCategory.DESTINATION, 10, True),
    "PDF_ACTIVE_CONTENT": SignalDef("PDF_ACTIVE_CONTENT", SignalCategory.DESTINATION, 15, True),
    # Voice
    "SYNTHETIC_VOICE_INDICATORS": SignalDef("SYNTHETIC_VOICE_INDICATORS", SignalCategory.VOICE, 15, True),
    # Pattern (set by the engine only)
    "COMBINED_PATTERN": SignalDef("COMBINED_PATTERN", SignalCategory.PATTERN, 0, False),
}


# Severity percentage multipliers (integer math)
SEVERITY_PCT: dict[str, int] = {
    "LOW": 40,
    "MEDIUM": 70,
    "HIGH": 100,
}


def compute_weight(base: int, severity: str) -> int:
    """Weight = (base * pct + 50) // 100, using integer math only."""
    pct = SEVERITY_PCT[severity]
    return (base * pct + 50) // 100


# Hint ID -> mapped signal code
HINT_SIGNAL_MAP: dict[str, str] = {
    "otp_pin_request": "OTP_PIN_REQUEST",
    "credential_request": "CREDENTIAL_REQUEST",
    "remote_access_request": "REMOTE_ACCESS_REQUEST",
    "app_install_request": "APP_INSTALL_REQUEST",
    "upfront_fee": "UPFRONT_FEE",
    "receive_via_pay": "RECEIVE_VIA_PAY",
    "urgency": "URGENCY",
}


# Categories to show in the grid (Pattern excluded from grid)
GRID_CATEGORIES = [
    SignalCategory.IDENTITY,
    SignalCategory.URGENCY,
    SignalCategory.MANIPULATION,
    SignalCategory.FINANCIAL,
    SignalCategory.CREDENTIALS,
    SignalCategory.DESTINATION,
    SignalCategory.VOICE,
]
