"""Voice deepfake detection service using WavLM model."""
import logging
from dataclasses import dataclass
import numpy as np
import torch

from config import settings
from schemas import VoiceDetails, Factor, Severity, FactorSource
from services.signals import SIGNAL_TABLE, compute_weight

logger = logging.getLogger(__name__)

_model = None
_feature_extractor = None
_spoof_idx = None
_initialized = False

CAVEAT_TEXT = (
    "A human voice can run a scam; a synthetic voice can be harmless. "
    "Voice authenticity is assessed independently from conversational risk."
)


def _init_model():
    global _model, _feature_extractor, _spoof_idx, _initialized
    if _initialized:
        return
    _initialized = True

    if not settings.voice_model_enabled:
        logger.info("Voice model is disabled in configuration")
        return

    try:
        from transformers import AutoFeatureExtractor, AutoModelForAudioClassification
        model_id = settings.voice_model_id
        logger.info(f"Loading voice deepfake model: {model_id} on CPU")
        _feature_extractor = AutoFeatureExtractor.from_pretrained(model_id)
        _model = AutoModelForAudioClassification.from_pretrained(model_id)
        _model.eval()

        # Find spoof index
        if hasattr(_model.config, "label2id") and _model.config.label2id:
            _spoof_idx = _model.config.label2id.get("spoof")
            if _spoof_idx is None:
                _spoof_idx = _model.config.label2id.get("LABEL_1", 1)
        else:
            _spoof_idx = 1

        logger.info(f"Voice model loaded successfully (spoof_idx={_spoof_idx})")
    except Exception as e:
        logger.warning(f"Voice model initialization deferred or unavailable: {e}")
        _model = None


def analyze_voice_clip(
    samples: np.ndarray,
    sample_rate: int,
    duration_seconds: float,
    transcript: str | None = None,
) -> tuple[VoiceDetails, list[Factor]]:
    """Analyze an audio clip for synthetic/deepfake indicators.

    Returns:
        (VoiceDetails, deterministic_factors)
    """
    _init_model()

    if _model is None or _feature_extractor is None:
        details = VoiceDetails(
            duration_seconds=round(duration_seconds, 1),
            analyzed_seconds=0.0,
            transcript=transcript,
            spoof_probability=None,
            spoof_window_ratio=None,
            voice_verdict="Voice forensic model unavailable",
            voice_caveat=CAVEAT_TEXT,
            model_available=False,
        )
        return details, []

    # Window analysis: 4s windows with 2s stride
    window_samples = int(4.0 * sample_rate)
    stride_samples = int(2.0 * sample_rate)

    windows = []
    if len(samples) < window_samples:
        # Pad to 4s
        padded = np.pad(samples, (0, window_samples - len(samples)), mode="constant")
        windows.append(padded)
    else:
        for start in range(0, len(samples) - window_samples + 1, stride_samples):
            windows.append(samples[start : start + window_samples])
        if not windows:
            windows.append(samples[:window_samples])

    window_scores = []
    with torch.no_grad():
        for win in windows:
            inputs = _feature_extractor(
                win,
                sampling_rate=sample_rate,
                return_tensors="pt",
                padding=True,
            )
            logits = _model(**inputs).logits
            probs = torch.softmax(logits, dim=-1)
            spoof_prob = float(probs[0, _spoof_idx].item())
            window_scores.append(spoof_prob)

    mean_spoof = float(np.mean(window_scores))
    window_ratio = float(sum(1 for s in window_scores if s >= 0.5) / len(window_scores))

    # Wording bands
    if mean_spoof < 0.25:
        verdict = "Human voice patterns detected"
    elif mean_spoof < 0.70:
        verdict = "Inconclusive acoustic indicators"
    else:
        verdict = "Synthetic-voice indicators detected"

    deterministic_factors: list[Factor] = []
    if mean_spoof >= 0.70:
        sig_def = SIGNAL_TABLE.get("SYNTHETIC_VOICE_INDICATORS")
        if sig_def:
            weight = compute_weight(sig_def.base_weight, "HIGH")
            deterministic_factors.append(Factor(
                code="SYNTHETIC_VOICE_INDICATORS",
                category=sig_def.category.value,
                severity=Severity.HIGH,
                weight=weight,
                source=FactorSource.DETERMINISTIC,
                title="Synthetic voice indicators detected",
                why_it_matters="Acoustic analysis shows characteristics consistent with AI speech synthesis or voice conversion.",
                evidence=f"Acoustic confidence: {mean_spoof:.2f}",
            ))

    analyzed_secs = round(min(duration_seconds, len(windows) * 2.0 + 2.0), 1)

    details = VoiceDetails(
        duration_seconds=round(duration_seconds, 1),
        analyzed_seconds=analyzed_secs,
        transcript=transcript,
        spoof_probability=round(mean_spoof, 3),
        spoof_window_ratio=round(window_ratio, 3),
        voice_verdict=verdict,
        voice_caveat=CAVEAT_TEXT,
        model_available=True,
    )

    return details, deterministic_factors
