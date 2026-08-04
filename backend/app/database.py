from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import inspect, text
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_add_payment_provider_id_column)
        await conn.run_sync(_add_rag_chunk_columns)
        await conn.run_sync(_add_interview_llm_columns)

def _add_payment_provider_id_column(sync_conn):
    """Small backwards-compatible migration for installations before YooKassa."""
    inspector = inspect(sync_conn)
    if "payments" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("payments")}
    if "provider_payment_id" not in columns:
        sync_conn.execute(text("ALTER TABLE payments ADD COLUMN provider_payment_id VARCHAR(64)"))

def _add_rag_chunk_columns(sync_conn):
    """Backwards-compatible migration for structured RAG chunk metadata."""
    inspector = inspect(sync_conn)
    if "document_chunks" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("document_chunks")}
    additions = {
        "page_end": "INTEGER",
        "section_title": "VARCHAR(512)",
        "token_count": "INTEGER DEFAULT 0",
        "content_hash": "VARCHAR(64)",
    }
    for name, sql_type in additions.items():
        if name not in columns:
            sync_conn.execute(text(f"ALTER TABLE document_chunks ADD COLUMN {name} {sql_type}"))
    sync_conn.execute(text(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_document_chunk_position "
        "ON document_chunks (material_id, chunk_index)"
    ))


def _add_interview_llm_columns(sync_conn):
    """Backwards-compatible metadata migration for the interview LLM module."""
    inspector = inspect(sync_conn)
    tables = set(inspector.get_table_names())
    if "interview_sessions" in tables:
        columns = {column["name"] for column in inspector.get_columns("interview_sessions")}
        additions = {
            "difficulty": "VARCHAR(20) DEFAULT 'medium'",
            "llm_provider": "VARCHAR(50)",
            "llm_model": "VARCHAR(100)",
            "last_error": "TEXT",
        }
        for name, sql_type in additions.items():
            if name not in columns:
                sync_conn.execute(text(f"ALTER TABLE interview_sessions ADD COLUMN {name} {sql_type}"))
    if "interview_dialogs" in tables:
        columns = {column["name"] for column in inspector.get_columns("interview_dialogs")}
        additions = {
            "topic": "VARCHAR(250)",
            "difficulty": "VARCHAR(20) DEFAULT 'medium'",
            "strengths": "JSON",
            "llm_audit": "JSON",
        }
        for name, sql_type in additions.items():
            if name not in columns:
                sync_conn.execute(text(f"ALTER TABLE interview_dialogs ADD COLUMN {name} {sql_type}"))
