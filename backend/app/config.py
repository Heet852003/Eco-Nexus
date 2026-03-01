"""Application configuration with env-based settings."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """App settings from environment."""

    app_name: str = "Eco-Nexus IoT & SmartHome API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "sqlite+aiosqlite:///./eco_nexus.db"

    # Redis (optional; fallback to in-memory cache)
    redis_url: str | None = None
    cache_ttl_seconds: int = 300

    # Auth
    secret_key: str = "change-me-in-production-eco-nexus-2026"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Event processing (10K+ events daily)
    event_batch_size: int = 500
    event_ingest_rate_limit: int = 10000  # per day per tenant

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
