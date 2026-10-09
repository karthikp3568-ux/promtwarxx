"""UPI URI parser and signal detector."""
import re
from urllib.parse import urlparse, parse_qs
from dataclasses import dataclass, field
from schemas import PaymentDetails, Factor, Severity, FactorSource
from services.signals import SIGNAL_TABLE, compute_weight


@dataclass
class UpiParseResult:
    is_upi: bool = False
    payee_vpa: str | None = None
    payee_name: str | None = None
    amount: str | None = None
    currency: str | None = "INR"
    note: str | None = None
    merchant_code: str | None = None
    deterministic_factors: list[Factor] = field(default_factory=list)


# Words in transaction note indicating "Receive via pay" trick
_RECEIVE_KEYWORDS = re.compile(
    r'\b(?:refund|cashback|prize|reward|bonus|claim|receive)\b',
    re.IGNORECASE,
)


def parse_upi_uri(uri: str, stated_purpose: str | None = None) -> UpiParseResult:
    """Parse a upi://pay URI and detect deterministic financial signals."""
    result = UpiParseResult()

    if not uri.lower().startswith("upi://pay"):
        return result

    result.is_upi = True
    parsed = urlparse(uri)
    query = parse_qs(parsed.query)

    result.payee_vpa = query.get("pa", [None])[0]
    result.payee_name = query.get("pn", [None])[0]
    result.amount = query.get("am", [None])[0]
    result.currency = query.get("cu", ["INR"])[0]
    result.note = query.get("tn", [None])[0]
    result.merchant_code = query.get("mc", [None])[0]

    # Signal 1: Personal recipient vs merchant
    if not result.merchant_code:
        sig_def = SIGNAL_TABLE.get("PERSONAL_RECIPIENT")
        if sig_def:
            weight = compute_weight(sig_def.base_weight, "HIGH")
            result.deterministic_factors.append(Factor(
                code="PERSONAL_RECIPIENT",
                category=sig_def.category.value,
                severity=Severity.HIGH,
                weight=weight,
                source=FactorSource.DETERMINISTIC,
                title="Personal account recipient",
                why_it_matters="Payment goes to an individual account with no registered merchant code.",
                evidence=result.payee_vpa,
            ))

    # Signal 2: Receive via pay trap
    note_text = (result.note or "") + " " + (stated_purpose or "")
    if _RECEIVE_KEYWORDS.search(note_text):
        sig_def = SIGNAL_TABLE.get("RECEIVE_VIA_PAY")
        if sig_def:
            weight = compute_weight(sig_def.base_weight, "HIGH")
            result.deterministic_factors.append(Factor(
                code="RECEIVE_VIA_PAY",
                category=sig_def.category.value,
                severity=Severity.HIGH,
                weight=weight,
                source=FactorSource.DETERMINISTIC,
                title="Receive money via outgoing payment trap",
                why_it_matters="The requester claims you are receiving a refund or prize, but scanning a QR code or entering a PIN only authorizes outgoing transfers from your account.",
                evidence=result.note,
            ))

    return result
