"""Gemini API client wrapper.

Uses google-genai SDK with structured JSON output and Pydantic validation.
At most 2 Gemini calls per analysis. 45s timeout with one retry.
"""
import asyncio
import logging
import time
from typing import TypeVar, Type

from google import genai
from google.genai import types
from pydantic import BaseModel, ValidationError

from config import settings
from errors import TrustGuardError, ErrorCode

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

GEMINI_TIMEOUT = 45  # seconds per call
MAX_RETRIES = 2


def _get_client() -> genai.Client | None:
    if not settings.gemini_configured:
        return None
    return genai.Client(api_key=settings.gemini_api_key)


async def generate_structured(
    prompt: str,
    response_model: Type[T],
    parts: list[types.Part] | None = None,
    timeout: float = GEMINI_TIMEOUT,
) -> T:
    """Call Gemini with structured JSON output and validate with Pydantic.

    Args:
        prompt: The text prompt
        response_model: Pydantic model class for validation
        parts: Optional inline file parts
        timeout: Timeout in seconds

    Returns:
        Validated Pydantic model instance

    Raises:
        TrustGuardError: On API or validation failure
    """
    client = _get_client()
    if client is None:
        raise TrustGuardError(ErrorCode.MISSING_API_KEY)

    contents = []
    if parts:
        contents.extend(parts)
    contents.append(prompt)

    candidate_models = [settings.gemini_model]
    if settings.gemini_model != "gemini-3.5-flash":
        candidate_models.append("gemini-3.5-flash")

    last_error = None
    for model_name in candidate_models:
        for attempt in range(MAX_RETRIES + 1):
            try:
                start = time.monotonic()
                response = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=response_model,
                        ),
                    ),
                    timeout=timeout,
                )
                elapsed = time.monotonic() - start
                logger.info(f"Gemini call elapsed={elapsed:.1f}s model={model_name}")

                if not response.text:
                    raise TrustGuardError(ErrorCode.INVALID_AI_RESPONSE)

                try:
                    result = response_model.model_validate_json(response.text)
                    return result
                except ValidationError as e:
                    logger.warning(f"Gemini response validation failed attempt={attempt}")
                    last_error = e
                    if attempt < MAX_RETRIES:
                        continue
                    break

            except asyncio.TimeoutError:
                logger.warning(f"Gemini call timed out attempt={attempt} model={model_name}")
                last_error = TimeoutError("Gemini call timed out")
                if attempt < MAX_RETRIES:
                    continue
                break

            except TrustGuardError:
                raise

            except Exception as e:
                error_str = str(e).lower()
                logger.warning(f"Gemini call failed attempt={attempt} model={model_name}: {type(e).__name__}: {e}")
                last_error = e

                if "429" in str(e) or "rate" in error_str or "quota" in error_str:
                    raise TrustGuardError(ErrorCode.AI_RATE_LIMITED, status_code=429)

                if "503" in str(e) or "unavailable" in error_str:
                    logger.info(f"Retrying after 503 on {model_name} (attempt {attempt})")
                    if attempt < MAX_RETRIES + 1:
                        await asyncio.sleep(3 * (attempt + 1))
                        continue

                if attempt < MAX_RETRIES:
                    await asyncio.sleep(2)
                    continue
                break

    raise TrustGuardError(ErrorCode.AI_UNAVAILABLE)


async def generate_text(
    prompt: str,
    parts: list[types.Part] | None = None,
    timeout: float = GEMINI_TIMEOUT,
) -> str:
    """Call Gemini for plain text output (used for extraction and Ask feature)."""
    client = _get_client()
    if client is None:
        raise TrustGuardError(ErrorCode.MISSING_API_KEY)

    contents = []
    if parts:
        contents.extend(parts)
    contents.append(prompt)

    candidate_models = [settings.gemini_model]
    if settings.gemini_model != "gemini-3.5-flash":
        candidate_models.append("gemini-3.5-flash")

    for model_name in candidate_models:
        for attempt in range(MAX_RETRIES + 1):
            try:
                start = time.monotonic()
                response = await asyncio.wait_for(
                    client.aio.models.generate_content(
                        model=model_name,
                        contents=contents,
                    ),
                    timeout=timeout,
                )
                elapsed = time.monotonic() - start
                logger.info(f"Gemini text call elapsed={elapsed:.1f}s model={model_name}")
                return response.text or ""
            except asyncio.TimeoutError:
                logger.warning(f"Gemini text call timed out attempt={attempt} model={model_name}")
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(2)
                    continue
                break
            except Exception as e:
                error_str = str(e).lower()
                logger.warning(f"Gemini text call failed attempt={attempt} model={model_name}: {type(e).__name__}: {e}")
                if "429" in str(e) or "rate" in error_str or "quota" in error_str:
                    raise TrustGuardError(ErrorCode.AI_RATE_LIMITED, status_code=429)
                if "503" in str(e) or "unavailable" in error_str:
                    break
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(2)
                    continue
                break

    raise TrustGuardError(ErrorCode.AI_UNAVAILABLE)
