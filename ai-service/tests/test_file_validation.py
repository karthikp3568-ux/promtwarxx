"""File validation (magic bytes) tests."""
import pytest
from services.file_validation import detect_mime_type, validate_file
from errors import TrustGuardError


def test_png():
    data = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
    assert detect_mime_type(data) == 'image/png'


def test_jpeg():
    data = b'\xff\xd8\xff\xe0' + b'\x00' * 100
    assert detect_mime_type(data) == 'image/jpeg'


def test_pdf():
    data = b'%PDF-1.4 ' + b'\x00' * 100
    assert detect_mime_type(data) == 'application/pdf'


def test_wav():
    data = b'RIFF' + b'\x00' * 4 + b'WAVE' + b'\x00' * 100
    assert detect_mime_type(data) == 'audio/wav'


def test_webp():
    data = b'RIFF' + b'\x00' * 4 + b'WEBP' + b'\x00' * 100
    assert detect_mime_type(data) == 'image/webp'


def test_mp3_id3():
    data = b'ID3' + b'\x00' * 100
    assert detect_mime_type(data) == 'audio/mpeg'


def test_ogg():
    data = b'OggS' + b'\x00' * 100
    assert detect_mime_type(data) == 'audio/ogg'


def test_flac():
    data = b'fLaC' + b'\x00' * 100
    assert detect_mime_type(data) == 'audio/flac'


def test_unknown_type():
    data = b'\x00\x01\x02\x03' * 10
    assert detect_mime_type(data) is None


def test_validate_rejects_unknown():
    with pytest.raises(TrustGuardError) as exc:
        validate_file(b'UNKNOWN_FILE_TYPE')
    assert exc.value.code.value == "UNSUPPORTED_FILE"


def test_validate_rejects_wrong_type():
    png_data = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
    with pytest.raises(TrustGuardError) as exc:
        validate_file(png_data, allowed_types={'audio/wav'})
    assert exc.value.code.value == "UNSUPPORTED_FILE"
