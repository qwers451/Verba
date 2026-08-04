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
    PDF_PARSER: str = os.getenv("PDF_PARSER", "auto")  # auto, llama_parse, local
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "mock") # "openai", "gemini", or "mock"
    INTERVIEW_LLM_PROVIDER: str = os.getenv("INTERVIEW_LLM_PROVIDER", "codex_cli")
    CODEX_CLI_PATH: str = os.getenv("CODEX_CLI_PATH", "codex")
    CODEX_INTERVIEW_MODEL: str = os.getenv("CODEX_INTERVIEW_MODEL", "gpt-5.4-mini")
    CODEX_MAX_CONCURRENCY: int = int(os.getenv("CODEX_MAX_CONCURRENCY", "2"))
    CODEX_RETRY_COUNT: int = int(os.getenv("CODEX_RETRY_COUNT", "1"))
    CODEX_MAX_PROMPT_CHARS: int = int(os.getenv("CODEX_MAX_PROMPT_CHARS", "90000"))
    CODEX_GENERATION_TIMEOUT_SECONDS: int = int(os.getenv("CODEX_GENERATION_TIMEOUT_SECONDS", "120"))
    CODEX_EVALUATION_TIMEOUT_SECONDS: int = int(os.getenv("CODEX_EVALUATION_TIMEOUT_SECONDS", "60"))
    CODEX_REPORT_TIMEOUT_SECONDS: int = int(os.getenv("CODEX_REPORT_TIMEOUT_SECONDS", "60"))
    RAG_COLLECTION_NAME: str = os.getenv("RAG_COLLECTION_NAME", "verba_materials_v2_cosine")
    RAG_CHUNK_TOKENS: int = int(os.getenv("RAG_CHUNK_TOKENS", "420"))
    RAG_CHUNK_OVERLAP_TOKENS: int = int(os.getenv("RAG_CHUNK_OVERLAP_TOKENS", "70"))
    RAG_MIN_RELEVANCE: float = float(os.getenv("RAG_MIN_RELEVANCE", "0.40"))
    RAG_DENSE_CANDIDATES: int = int(os.getenv("RAG_DENSE_CANDIDATES", "12"))
    
    # Quotas & Pricing
    MONTHLY_SUBSCRIPTION_PRICE_RUB: int = 690
    MONTHLY_SESSION_LIMIT: int = 15
    MAX_FILE_SIZE_MB: int = 50
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

    # YooKassa test/production credentials. Keep the secret only in .env.
    YOOKASSA_SHOP_ID: Optional[str] = os.getenv("YOOKASSA_SHOP_ID", None)
    YOOKASSA_SECRET_KEY: Optional[str] = os.getenv("YOOKASSA_SECRET_KEY", None)
    PAYMENT_RETURN_URL: str = os.getenv("PAYMENT_RETURN_URL", "http://localhost:3000/settings?payment=return")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
