"""TrustGuard AI — Free-text redaction service.

Redacts sensitive PII from free-text before saving to Firestore:
- emails -> [email]
- phone numbers -> [phone]
- UPI IDs -> [upi-id]
- URLs -> registrable domain
- runs of 4+ digits not preceded by a currency marker -> [number]
"""
import re
from typing import Any
import tldextract

# Pre-compiled regexes
_EMAIL_RE = re.compile(
    r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}',
    re.IGNORECASE,
)

_UPI_RE = re.compile(
    r'[a-zA-Z0-9._\-]{2,256}@[a-zA-Z]{2,64}(?!\.[a-zA-Z0-9])(?!\w)',
)

_URL_RE = re.compile(
    r'https?://[^\s<>"\'\)\]]+|(?<![\w@.])(?:www\.)[^\s<>"\'\)\]]+',
    re.IGNORECASE,
)

_PHONE_RE = re.compile(
    r'(?<!\w)(?:\+\d{1,3}[\s\-]|\(\d{2,5}\)[\s\-]?|\b\d{3,5}[\s\-]\d{3,5}[\s\-]|\b\d{3,5}[\s\-])\d{3,8}(?!\w)'
    r'|\b\d{10}\b',
)

# 4+ consecutive digits not preceded by ₹, $, INR, or Rs. / Rs
_NUMBER_RE = re.compile(
    r'(?<![₹\$])(?<!INR\s)(?<!Rs\.\s)(?<!Rs\s)(?<!\d)\d{4,}(?!\d)',
    re.IGNORECASE,
)


def _replace_url(match: re.Match) -> str:
    url = match.group(0)
    ext = tldextract.extract(url)
    rd = getattr(ext, 'top_domain_under_public_suffix', None) or getattr(ext, 'registered_domain', None)
    if rd:
        return rd
    if ext.domain:
        return ext.domain
    return '[url]'


def redact_text(text: str | None) -> str:
    """Redact sensitive PII and URLs from free-text string."""
    if not text:
        return ""

    s = text

    # 1. URLs -> registrable domain
    s = _URL_RE.sub(_replace_url, s)

    # 2. UPI IDs -> [upi-id] (must be checked before or distinctly from emails)
    # UPI IDs have no dot after @, while emails have dot after @
    # We substitute UPI first if pattern matches
    def _upi_replacer(m: re.Match) -> str:
        candidate = m.group(0)
        at_part = candidate.split('@')
        if len(at_part) == 2 and '.' not in at_part[1]:
            return '[upi-id]'
        return candidate

    s = _UPI_RE.sub(_upi_replacer, s)

    # 3. Emails -> [email]
    s = _EMAIL_RE.sub('[email]', s)

    # 4. Phones -> [phone] (avoid clobbering tags)
    s = _PHONE_RE.sub('[phone]', s)

    # 5. 4+ digit runs (account / card / OTP / ref nums) -> [number]
    s = _NUMBER_RE.sub('[number]', s)

    return s


def redact_data_structure(data: Any) -> Any:
    """Recursively redact strings in dictionaries, lists, or tuples."""
    if isinstance(data, str):
        return redact_text(data)
    if isinstance(data, dict):
        return {k: redact_data_structure(v) for k, v in data.items()}
    if isinstance(data, list):
        return [redact_data_structure(item) for item in data]
    if isinstance(data, tuple):
        return tuple(redact_data_structure(item) for item in data)
    return data
