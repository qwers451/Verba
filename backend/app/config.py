import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Verba AI - Oral Exam Prep SaaS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database - Temporary SQLite for local testing without Docker
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./verba.db")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-development-secret")
    
    # LLM Settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    LLAMA_CLOUD_API_KEY: Optional[str] = os.getenv("LLAMA_CLOUD_API_KEY", None)
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "mock") # "openai", "gemini", or "mock"
    
    # Quotas & Pricing
    MONTHLY_SUBSCRIPTION_PRICE_RUB: int = 690
    MONTHLY_SESSION_LIMIT: int = 15
    MAX_FILE_SIZE_MB: int = 50

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
