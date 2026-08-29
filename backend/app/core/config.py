"""Application configuration via Pydantic settings.

Values are read from environment variables (and an optional ``.env`` file).
Import the ready-made ``settings`` singleton, or depend on ``get_settings`` in
FastAPI routes for easy overriding in tests.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Project metadata ---
    PROJECT_NAME: str = "ReMind AI"
    PROJECT_DESCRIPTION: str = "AI-Powered Memory Companion for Dementia Patients"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: Literal["development", "test", "staging", "production"] = "development"
    DEBUG: bool = True

    # --- Database (Postgres/Neon in prod; SQLite fallback for local dev) ---
    DATABASE_URL: str = "sqlite:///./remind_ai.db"

    # --- Cache / rate-limit backend (wired in Phase 2) ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- Security / JWT ---
    ALGORITHM: str = "RS256"
    PRIVATE_KEY_PATH: str = "../certs/private_key.pem"
    PUBLIC_KEY_PATH: str = "../certs/public_key.pem"
    # Optional: direct key content for production environments like Render
    PRIVATE_KEY_CONTENT: str | None = None
    PUBLIC_KEY_CONTENT: str | None = None
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- CORS ---
    # Comma-separated list of allowed origins (kept as a plain string to avoid
    # pydantic-settings' JSON parsing of complex env values). Use ``cors_origins``.
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"

    # --- Cloudinary media storage (Phase 3) ---
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    @property
    def cors_origins(self) -> list[str]:
        """Allowed CORS origins as a clean list."""
        return [o.strip() for o in self.BACKEND_CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance (safe to use as a FastAPI dependency)."""
    return Settings()


settings = get_settings()
