"""File type validation by magic bytes."""
from errors import TrustGuardError, ErrorCode

# Magic bytes for supported file types
MAGIC_SIGNATURES: list[tuple[bytes, str, str]] = [
    (b'\x89PNG\r\n\x1a\n', 'image/png', 'png'),
    (b'\xff\xd8\xff', 'image/jpeg', 'jpeg'),
    (b'RIFF', 'audio/wav', 'wav'),     # RIFF....WAVE
    (b'%PDF', 'application/pdf', 'pdf'),
    (b'OggS', 'audio/ogg', 'ogg'),
    (b'fLaC', 'audio/flac', 'flac'),
    (b'ID3', 'audio/mpeg', 'mp3'),       # MP3 with ID3 tag
    (b'\xff\xfb', 'audio/mpeg', 'mp3'),  # MP3 without ID3
    (b'\xff\xf3', 'audio/mpeg', 'mp3'),  # MP3 MPEG2
    (b'\xff\xf2', 'audio/mpeg', 'mp3'),  # MP3 MPEG2.5
]

# WEBP: starts with RIFF....WEBP
def _is_webp(data: bytes) -> bool:
    return len(data) >= 12 and data[:4] == b'RIFF' and data[8:12] == b'WEBP'

def _is_wav(data: bytes) -> bool:
    return len(data) >= 12 and data[:4] == b'RIFF' and data[8:12] == b'WAVE'


IMAGE_TYPES = {'image/png', 'image/jpeg', 'image/webp'}
DOCUMENT_TYPES = {'application/pdf'}
AUDIO_TYPES = {'audio/wav', 'audio/mpeg', 'audio/ogg', 'audio/flac'}
ALL_TYPES = IMAGE_TYPES | DOCUMENT_TYPES | AUDIO_TYPES

# Size limits
IMAGE_MAX_BYTES = 10 * 1024 * 1024      # 10 MB
PDF_MAX_BYTES = 10 * 1024 * 1024         # 10 MB
AUDIO_MAX_BYTES = 15 * 1024 * 1024       # 15 MB
TEXT_MAX_CHARS = 10_000
QUESTION_MAX_CHARS = 500
PDF_MAX_PAGES = 10


def detect_mime_type(data: bytes) -> str | None:
    """Detect MIME type from magic bytes. Returns None if unknown."""
    if len(data) < 4:
        return None

    # Check WEBP vs WAV (both start with RIFF)
    if data[:4] == b'RIFF':
        if _is_webp(data):
            return 'image/webp'
        if _is_wav(data):
            return 'audio/wav'
        return None

    for magic, mime, _ in MAGIC_SIGNATURES:
        if magic != b'RIFF' and data[:len(magic)] == magic:
            return mime

    return None


def validate_file(data: bytes, allowed_types: set[str] | None = None) -> str:
    """Validate file by magic bytes and size. Returns MIME type.
    Raises TrustGuardError on failure."""
    mime = detect_mime_type(data)
    if mime is None:
        raise TrustGuardError(ErrorCode.UNSUPPORTED_FILE)

    if allowed_types and mime not in allowed_types:
        raise TrustGuardError(ErrorCode.UNSUPPORTED_FILE)

    # Size checks
    size = len(data)
    if mime in IMAGE_TYPES and size > IMAGE_MAX_BYTES:
        raise TrustGuardError(ErrorCode.FILE_TOO_LARGE)
    if mime in DOCUMENT_TYPES and size > PDF_MAX_BYTES:
        raise TrustGuardError(ErrorCode.FILE_TOO_LARGE)
    if mime in AUDIO_TYPES and size > AUDIO_MAX_BYTES:
        raise TrustGuardError(ErrorCode.FILE_TOO_LARGE)

    return mime


def validate_text(text: str) -> None:
    """Validate text input length."""
    if len(text) > TEXT_MAX_CHARS:
        raise TrustGuardError(ErrorCode.FILE_TOO_LARGE)
