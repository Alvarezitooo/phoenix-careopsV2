"""
⚙️ Configuration centralisée pour FastAPI
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    """Configuration de l'application avec validation Pydantic"""

    # Application
    app_name: str = "PhoenixCare RAG API"
    app_version: str = "2.0.0"
    debug: bool = False
    environment: str = "development"

    # Serveur
    host: str = "127.0.0.1"
    port: int = 8080

    # Security
    allowed_origins: str = "http://localhost:3000,http://localhost:3001"
    vercel_pattern: str = r"https://phoenix-careops[a-z0-9-]*\.vercel\.app$"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""  # JWT secret from Supabase Dashboard → Settings → API

    # Gemini AI
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash-exp"

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # Cache
    cache_ttl_hours: int = 24
    cache_max_size: int = 1000

    # Rate Limiting
    rate_limit_requests: int = 10
    rate_limit_window: int = 60  # secondes

    # Redis (pour future migration)
    redis_url: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse les origines autorisées"""
        return [origin.strip() for origin in self.allowed_origins.split(',')]


# Instance globale
settings = Settings()
