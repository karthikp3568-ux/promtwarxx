from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-3.8-flash"
    voice_model_id: str = "DavidCombei/wavLM-base-Deepfake_V2"
    voice_model_enabled: bool = True
    url_fetch_enabled: bool = True
    demo_cache: bool = False
    allowed_origins: str = "http://localhost:5173"
    firebase_project_id: str = "promtwars-745af"
    google_application_credentials: Optional[str] = None
    use_firebase_emulators: bool = False

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key)

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
