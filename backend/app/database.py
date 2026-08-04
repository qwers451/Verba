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

def _add_payment_provider_id_column(sync_conn):
    """Small backwards-compatible migration for installations before YooKassa."""
    inspector = inspect(sync_conn)
    if "payments" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("payments")}
    if "provider_payment_id" not in columns:
        sync_conn.execute(text("ALTER TABLE payments ADD COLUMN provider_payment_id VARCHAR(64)"))
