import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_NAME: str = "Pramaan - AICTE Approval & Compliance Platform"
    API_PREFIX: str = "/api"
    FRONTEND_ORIGIN: str = "http://localhost:5173"

    DATABASE_URL: str = "sqlite:///./niyamai.db"

    SECRET_KEY: str = "niyamai-sih-26261-secure-jwt-secret-key-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    SESSION_COOKIE_SECURE: bool = False

    STORAGE_BACKEND: str = "local"
    LOCAL_STORAGE_PATH: str = str(BASE_DIR.parent / "storage" / "uploads")
    REPORTS_STORAGE_PATH: str = str(BASE_DIR.parent / "storage" / "reports")
    MAX_UPLOAD_SIZE_MB: int = 25

    OCR_ENGINE: str = "pymupdf_fallback"
    LLM_PROVIDER: str = "none"
    EXTERNAL_VERIFICATION_MODE: str = "synthetic"

    SEED_DEMO_DATA: bool = True

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure directories exist
os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
os.makedirs(settings.REPORTS_STORAGE_PATH, exist_ok=True)
