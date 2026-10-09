from fastapi import APIRouter

from config import settings

router = APIRouter(prefix="/api", tags=["health"])

# Voice model state is managed globally and updated by the startup task
_voice_model_status: str = "unavailable"


def set_voice_model_status(status: str) -> None:
    global _voice_model_status
    _voice_model_status = status


def get_voice_model_status() -> str:
    return _voice_model_status


@router.get("/health")
async def health():
    from services.firebase_app import is_admin_ready
    return {
        "status": "ok",
        "gemini_configured": settings.gemini_configured,
        "gemini_model": settings.gemini_model,
        "voice_model": _voice_model_status if settings.voice_model_enabled else "disabled",
        "url_fetch_enabled": settings.url_fetch_enabled,
        "firebase": {
            "admin_ready": is_admin_ready(),
            "emulators": settings.use_firebase_emulators,
        },
    }
