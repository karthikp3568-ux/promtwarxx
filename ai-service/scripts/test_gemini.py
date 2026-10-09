"""One-off Gemini test - verifies the API key and model work."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from config import settings
from google import genai

def main():
    if not settings.gemini_configured:
        print("ERROR: GEMINI_API_KEY not set")
        sys.exit(1)

    print(f"Model: {settings.gemini_model}")
    print("Testing Gemini API call...")

    client = genai.Client(api_key=settings.gemini_api_key)
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents="Respond with exactly: TrustGuard AI connection successful."
    )

    print(f"Response: {response.text}")
    print("\n✓ Gemini API call successful!")

if __name__ == "__main__":
    main()
