"""Deterministic text extractors using regex only."""
import re
from dataclasses import dataclass, field
from schemas import Hint


# --- URL extraction ---
_URL_RE = re.compile(
    r'https?://[^\s<>"\')\]]+'
    r'|(?<![\w@.])(?:www\.)[^\s<>"\')\]]+',
    re.IGNORECASE,
)

# --- Email ---
_EMAIL_RE = re.compile(
    r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}',
)

# --- Phone (Indian + international) ---
_PHONE_RE = re.compile(
    r'(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{2,5}\)?[\s\-]?)?\d{5,10}'
    r'(?![\w@])',  # negative lookahead to avoid matching inside emails/UPI
)

# --- UPI ID: [\w.\-]{2,256}@[A-Za-z]{2,64} with no dot after @ ---
_UPI_RE = re.compile(
    r'[\w.\-]{2,256}@[A-Za-z]{2,64}(?![.\w])',
)

# --- Amounts ---
_AMOUNT_RE = re.compile(
    r'(?:Rs\.?|INR|\u20B9|\$)\s*[\d,]+(?:\.\d{1,2})?',
    re.IGNORECASE,
)

# --- Hint keywords ---
_HINT_PATTERNS: dict[str, list[re.Pattern]] = {
    "otp_pin_request": [
        re.compile(r'\b(?:otp|pin|cvv|mpin)\b', re.IGNORECASE),
    ],
    "credential_request": [
        re.compile(r'\b(?:password|login|username|credentials?)\b', re.IGNORECASE),
    ],
    "remote_access_request": [
        re.compile(r'\b(?:anydesk|teamviewer|quicksupport|remote\s*access|screen\s*share)\b', re.IGNORECASE),
    ],
    "app_install_request": [
        re.compile(r'\b(?:\.apk|install\s+(?:this|the)\s+app|download\s+(?:this|the)\s+app)\b', re.IGNORECASE),
    ],
    "upfront_fee": [
        re.compile(
            r'\b(?:fee|registration|processing)\b.*\b(?:pay|scan|transfer|deposit)\b'
            r'|\b(?:pay|scan|transfer|deposit)\b.*\b(?:fee|registration|processing)\b',
            re.IGNORECASE,
        ),
    ],
    "receive_via_pay": [
        re.compile(
            r'\b(?:refund|cashback|prize|reward|bonus)\b.*\b(?:pay|scan|pin|upi)\b'
            r'|\b(?:pay|scan|pin|upi)\b.*\b(?:refund|cashback|prize|reward|bonus)\b'
            r'|\bscan\s+to\s+receive\b',
            re.IGNORECASE,
        ),
    ],
    "urgency": [
        re.compile(
            r'\b(?:immediately|urgent|expires?\s+(?:today|soon|in\s+\d)|within\s+\d+\s*(?:hour|min|hr)|act\s+now|don\'?t\s+delay|last\s+chance|limited\s+time)\b',
            re.IGNORECASE,
        ),
    ],
}

# --- Injection detection ---
_INJECTION_PATTERNS = [
    re.compile(r'ignore\s+(?:all|any|previous|prior)\s+instructions', re.IGNORECASE),
    re.compile(r'you\s+are\s+an\s+AI', re.IGNORECASE),
    re.compile(r'(?:note|instruction|message)\s+to\s+(?:the\s+|an?\s+)?AI(?:\s+systems?)?', re.IGNORECASE),
    re.compile(r'(?:rate|mark|classify|label)\s+.*(?:safe|low|benign|legitimate)', re.IGNORECASE),
    re.compile(r'verified\s+safe,\s*(?:rate|mark|classify)', re.IGNORECASE),
    re.compile(r'system\s+(?:prompt|override|directive)', re.IGNORECASE),
    re.compile(r'(?:forget|disregard)\s+.*(?:instructions|rules|guidelines)', re.IGNORECASE),
    re.compile(r'new\s+instructions?\s*:', re.IGNORECASE),
]


@dataclass
class ExtractionResult:
    urls: list[str] = field(default_factory=list)
    emails: list[str] = field(default_factory=list)
    phones: list[str] = field(default_factory=list)
    upi_ids: list[str] = field(default_factory=list)
    amounts: list[str] = field(default_factory=list)
    hints: list[Hint] = field(default_factory=list)
    injection_detected: bool = False


def _is_upi_id(s: str) -> bool:
    """UPI IDs have no dot after the @."""
    at_idx = s.find("@")
    if at_idx < 0:
        return False
    after_at = s[at_idx + 1:]
    return "." not in after_at and len(after_at) >= 2


def extract_all(text: str) -> ExtractionResult:
    """Run all regex extractors on text. No AI calls."""
    result = ExtractionResult()

    # URLs
    result.urls = list(dict.fromkeys(_URL_RE.findall(text)))

    # Emails vs UPI IDs
    email_candidates = _EMAIL_RE.findall(text)
    upi_candidates = _UPI_RE.findall(text)
    
    # UPI IDs: no dot after @
    seen_upi = set()
    for u in upi_candidates:
        if _is_upi_id(u) and u not in seen_upi:
            result.upi_ids.append(u)
            seen_upi.add(u)
    
    # Emails: have dot after @ (and not already a UPI ID)
    seen_email = set()
    for e in email_candidates:
        if e not in seen_upi and e not in seen_email:
            result.emails.append(e)
            seen_email.add(e)

    # Phones (basic dedup)
    phones = _PHONE_RE.findall(text)
    clean_phones = []
    seen_digits = set()
    for p in phones:
        digits = re.sub(r'\D', '', p)
        if len(digits) >= 7 and digits not in seen_digits:
            clean_phones.append(p.strip())
            seen_digits.add(digits)
    result.phones = clean_phones

    # Amounts
    result.amounts = list(dict.fromkeys(_AMOUNT_RE.findall(text)))

    # Hints
    for hint_id, patterns in _HINT_PATTERNS.items():
        for pat in patterns:
            if pat.search(text):
                result.hints.append(Hint(
                    id=hint_id,
                    mapped_signal=hint_id.upper(),
                    description=f"Keyword pattern matched: {hint_id}",
                ))
                break

    # Injection detection
    for pat in _INJECTION_PATTERNS:
        if pat.search(text):
            result.injection_detected = True
            break

    return result


def escape_untrusted_tags(text: str) -> str:
    """Escape <untrusted_content> tags inside untrusted content."""
    return text.replace("<untrusted_content>", "&lt;untrusted_content&gt;").replace(
        "</untrusted_content>", "&lt;/untrusted_content&gt;"
    )
