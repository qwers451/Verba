import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Verba AI - Oral Exam Prep SaaS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database
    # Support both PostgreSQL with pgvector and SQLite for easy zero-config local dev
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./verba.db")
    
    # LLM Settings
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "mock") # "openai", "gemini", or "mock"
    
    # Quotas & Pricing
    MONTHLY_SUBSCRIPTION_PRICE_RUB: int = 690
    MONTHLY_SESSION_LIMIT: int = 15
    MAX_FILE_SIZE_MB: int = 50

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
