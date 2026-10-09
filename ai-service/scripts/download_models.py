"""Download and verify the voice deepfake detection model."""
import sys
import os
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def main():
    print("=" * 60)
    print("TrustGuard AI - Voice Model Download")
    print("=" * 60)

    from config import settings
    model_id = settings.voice_model_id
    print(f"\nModel: {model_id}")
    print("Downloading (this may take a few minutes on first run)...\n")

    import torch
    from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

    feature_extractor = AutoFeatureExtractor.from_pretrained(model_id)
    model = AutoModelForAudioClassification.from_pretrained(model_id)
    model.eval()

    print("Model loaded successfully!")
    print(f"  id2label: {model.config.id2label}")
    print(f"  label2id: {model.config.label2id}")

    # Read the spoof index from model config; never hardcode it.
    # The model may use "spoof" or "LABEL_1" depending on the version.
    spoof_idx = model.config.label2id.get("spoof")
    if spoof_idx is None:
        # For models that use LABEL_0/LABEL_1, LABEL_1 is typically spoof
        # (verified: silent audio -> LABEL_1 high probability)
        spoof_idx = model.config.label2id.get("LABEL_1")
        if spoof_idx is not None:
            print(f"  Note: Using LABEL_1 (index {spoof_idx}) as spoof class")

    if spoof_idx is None:
        print("  WARNING: Could not determine spoof label")
        print(f"  Available labels: {model.config.label2id}")
    else:
        print(f"  Spoof index: {spoof_idx}")

    # Verify with a 4-second silent clip at 16kHz
    print("\nRunning inference on a 4s silent clip at 16kHz...")
    sample_rate = 16000
    duration = 4
    silent_audio = np.zeros(sample_rate * duration, dtype=np.float32)

    inputs = feature_extractor(
        silent_audio,
        sampling_rate=sample_rate,
        return_tensors="pt",
        padding=True,
    )

    with torch.no_grad():
        logits = model(**inputs).logits
        probs = torch.nn.functional.softmax(logits, dim=-1)

    print(f"  Logits: {logits.tolist()}")
    print(f"  Probabilities: {probs.tolist()}")

    if spoof_idx is not None:
        spoof_prob = probs[0][spoof_idx].item()
        print(f"  Spoof probability: {spoof_prob:.4f}")

    print("\nVoice model download and verification complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
