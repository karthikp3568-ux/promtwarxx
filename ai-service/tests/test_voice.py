"""Tests for audio processor, duration limits, and voice detector."""
import pytest
import io
import numpy as np
import soundfile as sf
from services.audio_processor import load_and_preprocess_audio
from services.voice_detector import analyze_voice_clip
from errors import TrustGuardError


def test_process_sample_bank_call():
    with open("samples/bank_call.wav", "rb") as f:
        audio_bytes = f.read()

    data = load_and_preprocess_audio(audio_bytes)
    assert data.duration_seconds >= 30.0
    assert data.sample_rate == 16000
    assert len(data.samples) > 0


def test_audio_too_short():
    sr = 16000
    # 1 second clip
    samples = np.zeros(sr, dtype=np.float32)
    buf = io.BytesIO()
    sf.write(buf, samples, sr, format="WAV")
    audio_bytes = buf.getvalue()

    with pytest.raises(TrustGuardError) as exc:
        load_and_preprocess_audio(audio_bytes)
    assert exc.value.code.value == "AUDIO_TOO_SHORT"


def test_corrupted_audio():
    garbage = b"NOT_A_VALID_AUDIO_FILE_DATA_12345"
    with pytest.raises(TrustGuardError) as exc:
        load_and_preprocess_audio(garbage)
    assert exc.value.code.value in ("CORRUPTED_AUDIO", "UNSUPPORTED_FILE")


def test_voice_detector_behavioral_fallback():
    # Test inference on a short 4s array
    sr = 16000
    samples = np.zeros(sr * 4, dtype=np.float32)
    details, factors = analyze_voice_clip(samples, sr, 4.0)

    assert details.duration_seconds == 4.0
    assert details.voice_caveat is not None
    assert "A human voice can run a scam" in details.voice_caveat
