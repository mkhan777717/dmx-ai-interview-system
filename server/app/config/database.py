from sqlalchemy.engine.url import make_url
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from .settings import settings

Base = declarative_base()
engine = None
async_session_maker = None


async def connect_db():
    global engine, async_session_maker
    try:
        db_url = settings.DATABASE_URL  # already validated + normalized by Settings
        parsed_url = make_url(db_url)
        safe_host = parsed_url.host or "unknown"
        safe_port = parsed_url.port or 5432
        safe_database = parsed_url.database or "unknown"
        print(f"📡 Connecting to database at {safe_host}:{safe_port}/{safe_database} (driver: {parsed_url.drivername})...")

        engine = create_async_engine(
            db_url,
            echo=False,
            future=True,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )

        async_session_maker = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

        # TODO: In production, database schema migrations should be handled via
        # Alembic (e.g. during deployment/release phase) rather than running
        # Base.metadata.create_all directly on every application startup.
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        print(f"✅ Database connected successfully to {safe_host}:{safe_port}/{safe_database}")
    except Exception as e:
        print(f"❌ Database Connection Error: {e}")
        raise


async def close_db():
    global engine
    if engine:
        await engine.dispose()
        print("🔌 Database Connection Closed")


async def get_db():
    """Dependency to get database session"""
    if async_session_maker is None:
        raise RuntimeError("Database is not initialized. async_session_maker is None.")
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
