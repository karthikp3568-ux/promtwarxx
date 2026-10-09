from enum import Enum
from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorCode(str, Enum):
    UNSUPPORTED_FILE = "UNSUPPORTED_FILE"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    TOO_MANY_PAGES = "TOO_MANY_PAGES"
    AUDIO_TOO_SHORT = "AUDIO_TOO_SHORT"
    NO_QR_FOUND = "NO_QR_FOUND"
    UNREADABLE_DOCUMENT = "UNREADABLE_DOCUMENT"
    CORRUPTED_AUDIO = "CORRUPTED_AUDIO"
    MISSING_API_KEY = "MISSING_API_KEY"
    AI_UNAVAILABLE = "AI_UNAVAILABLE"
    AI_RATE_LIMITED = "AI_RATE_LIMITED"
    INVALID_AI_RESPONSE = "INVALID_AI_RESPONSE"
    MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"
    TIMEOUT = "TIMEOUT"
    URL_BLOCKED = "URL_BLOCKED"
    RATE_LIMITED = "RATE_LIMITED"
    AUTH_REQUIRED = "AUTH_REQUIRED"
    AUTH_INVALID = "AUTH_INVALID"
    PERMISSION_DENIED = "PERMISSION_DENIED"
    HISTORY_SAVE_FAILED = "HISTORY_SAVE_FAILED"
    HISTORY_UNAVAILABLE = "HISTORY_UNAVAILABLE"
    FIREBASE_UNAVAILABLE = "FIREBASE_UNAVAILABLE"


ERROR_MESSAGES: dict[ErrorCode, str] = {
    ErrorCode.UNSUPPORTED_FILE: "This file type is not supported. Please upload a PNG, JPEG, WEBP, PDF, WAV, MP3, OGG, or FLAC file.",
    ErrorCode.FILE_TOO_LARGE: "The file is too large. Images and PDFs must be under 10 MB, audio under 15 MB.",
    ErrorCode.TOO_MANY_PAGES: "This PDF has too many pages. Please upload a document with 10 pages or fewer.",
    ErrorCode.AUDIO_TOO_SHORT: "The audio clip is too short. Please provide at least 2 seconds of audio.",
    ErrorCode.NO_QR_FOUND: "No QR code was found in this image. Try a clearer photo or closer crop of the QR code.",
    ErrorCode.UNREADABLE_DOCUMENT: "Could not read the content of this document. The file may be corrupted or empty.",
    ErrorCode.CORRUPTED_AUDIO: "Could not process this audio file. The file may be corrupted or in an unsupported format.",
    ErrorCode.MISSING_API_KEY: "The AI service is not configured. Please set the GEMINI_API_KEY in the server environment.",
    ErrorCode.AI_UNAVAILABLE: "The AI service is temporarily unavailable. Please try again in a moment.",
    ErrorCode.AI_RATE_LIMITED: "Too many requests to the AI service. Please wait a moment and try again.",
    ErrorCode.INVALID_AI_RESPONSE: "The AI returned an unexpected response. Please try again.",
    ErrorCode.MODEL_UNAVAILABLE: "The voice analysis model is not available. Behavioral analysis will still run.",
    ErrorCode.TIMEOUT: "The analysis took too long. Please try again with a simpler input.",
    ErrorCode.URL_BLOCKED: "A URL in this content was blocked for security reasons.",
    ErrorCode.RATE_LIMITED: "Too many requests. Please wait a moment before trying again.",
    ErrorCode.AUTH_REQUIRED: "Authentication required. Please sign in or continue as guest.",
    ErrorCode.AUTH_INVALID: "Invalid or expired authentication credentials. Please sign in again.",
    ErrorCode.PERMISSION_DENIED: "You do not have permission to access this resource.",
    ErrorCode.HISTORY_SAVE_FAILED: "The analysis completed, but saving to history failed. You can retry.",
    ErrorCode.HISTORY_UNAVAILABLE: "History service is temporarily unavailable. Please try again later.",
    ErrorCode.FIREBASE_UNAVAILABLE: "Authentication service is temporarily unavailable. Please try again later.",
}


class ErrorResponse(BaseModel):
    code: str
    message: str


class TrustGuardError(Exception):
    def __init__(self, code: ErrorCode, status_code: int = 400):
        self.code = code
        self.message = ERROR_MESSAGES[code]
        self.status_code = status_code
        super().__init__(self.message)


async def trustguard_error_handler(request: Request, exc: TrustGuardError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code.value, "message": exc.message},
    )
