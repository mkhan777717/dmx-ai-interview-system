#!/usr/bin/env python3
"""
Database setup + migration script.
Run this ONCE to:
  1. Create all tables (if they don't exist)
  2. Add any new columns (safe, idempotent)

Usage:
    /Library/Developer/CommandLineTools/usr/bin/python3.9 migrate.py
"""
import asyncio
import os
import sys


def get_db_url():
    """Get DATABASE_URL from env or .env file."""
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        return db_url
    env_file = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    print("❌ DATABASE_URL not found in environment or .env file.")
    sys.exit(1)


# New columns to add (idempotent — skipped if already exist)
ALTER_STATEMENTS = [
    ("v2_interviews", "interview_mode", "VARCHAR DEFAULT 'Technical'"),
    ("v2_answers",    "category",       "VARCHAR DEFAULT 'Technical'"),
    ("v2_answers",    "spoken_feedback","TEXT DEFAULT ''"),
]


async def run():
    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        from sqlalchemy import text, inspect
    except ImportError:
        print("❌ sqlalchemy not found.")
        sys.exit(1)

    # Import models to register them with Base metadata
    sys.path.insert(0, os.path.dirname(__file__))
    try:
        from app.config.database import Base
        # Import all models so they register with Base.metadata
        import app.models.user          # noqa
        import app.models.v2_interview  # noqa
        import app.models.interview     # noqa
    except ImportError as e:
        print(f"❌ Could not import models: {e}")
        sys.exit(1)

    db_url = get_db_url()
    print(f"📡 Connecting to database...")
    engine = create_async_engine(db_url, echo=False)

    try:
        # Step 1: Create all tables
        print("🏗  Creating tables (if not exist)...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("  ✅ Tables created / verified")

        # Step 2: Add new columns (safe ALTER TABLE)
        print("🔧 Applying column migrations...")
        async with engine.begin() as conn:
            for table, column, col_def in ALTER_STATEMENTS:
                stmt = f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name='{table}' AND column_name='{column}'
                    ) THEN
                        ALTER TABLE {table} ADD COLUMN {column} {col_def};
                        RAISE NOTICE 'Added {column} to {table}';
                    END IF;
                END$$;
                """
                await conn.execute(text(stmt))
                print(f"  ✅ {table}.{column} — OK")

        print("\n✅ Setup complete! You can now start the server.")
        print("   Run: ./start.sh  or  uvicorn main:app --reload")

    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        sys.exit(1)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run())
