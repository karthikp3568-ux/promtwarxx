"""Audio processor for voice analysis."""
import io
import logging
from dataclasses import dataclass
import soundfile as sf
import numpy as np
import librosa

from errors import TrustGuardError, ErrorCode

logger = logging.getLogger(__name__)

MIN_AUDIO_DURATION_SECONDS = 2.0
TARGET_SAMPLE_RATE = 16000


@dataclass
class AudioData:
    samples: np.ndarray  # 16kHz mono float32
    sample_rate: int
    duration_seconds: float


def load_and_preprocess_audio(audio_bytes: bytes) -> AudioData:
    """Load audio bytes, validate duration, convert to 16kHz mono float32."""
    try:
        data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
    except Exception as e:
        logger.warning(f"Soundfile failed to read audio: {e}")
        try:
            # Fallback to librosa
            data, sr = librosa.load(io.BytesIO(audio_bytes), sr=None, mono=False)
        except Exception as e2:
            logger.error(f"Failed to load audio with soundfile and librosa: {e2}")
            raise TrustGuardError(ErrorCode.CORRUPTED_AUDIO)

    # Convert multi-channel to mono
    if data.ndim > 1:
        data = np.mean(data, axis=1 if data.shape[0] > data.shape[1] else 0)

    duration = len(data) / sr
    if duration < MIN_AUDIO_DURATION_SECONDS:
        raise TrustGuardError(ErrorCode.AUDIO_TOO_SHORT)

    # Resample to 16kHz if needed
    if sr != TARGET_SAMPLE_RATE:
        data = librosa.resample(data, orig_sr=sr, target_sr=TARGET_SAMPLE_RATE)
        sr = TARGET_SAMPLE_RATE

    return AudioData(
        samples=data,
        sample_rate=sr,
        duration_seconds=duration,
    )
