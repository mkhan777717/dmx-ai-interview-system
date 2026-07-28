#!/usr/bin/env python3
"""
RBAC Database Migration
========================
Adds RBAC columns to the `users` table and creates the `organizations` table.

Run from the server/ directory:
    python migrate_rbac.py

This is an additive migration — existing data is preserved.
Existing users are assigned the default USER role.
"""

import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
# asyncpg URL → psycopg2 URL for synchronous migration
SYNC_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")


async def run_migration():
    import asyncpg

    # Parse URL manually for asyncpg
    url = DATABASE_URL.replace("postgresql+asyncpg://", "")
    if "@" in url:
        userinfo, hostdb = url.split("@", 1)
        user = userinfo.split(":")[0]
        password = userinfo.split(":")[1] if ":" in userinfo else None
        if "/" in hostdb:
            host_port, dbname = hostdb.rsplit("/", 1)
        else:
            host_port, dbname = hostdb, "postgres"
        host = host_port.split(":")[0]
        port = int(host_port.split(":")[1]) if ":" in host_port else 5432
    else:
        user, password, host, port, dbname = "postgres", None, "localhost", 5432, "postgres"

    conn = await asyncpg.connect(
        user=user,
        password=password,
        host=host,
        port=port,
        database=dbname,
    )

    print("✅ Connected to database")

    try:
        # ── 1. Create role enum type if not exists ────────────────────────────
        await conn.execute("""
            DO $$ BEGIN
                CREATE TYPE userrole AS ENUM ('SUPER_ADMIN', 'RECRUITER', 'USER');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;
        """)
        print("✅ Role enum created (or already exists)")

        # ── 2. Create organizations table ─────────────────────────────────────
        await conn.execute("""
            DO $$ BEGIN
                CREATE TYPE billingplan AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;
        """)

        await conn.execute("""
            CREATE TABLE IF NOT EXISTS organizations (
                id           SERIAL PRIMARY KEY,
                name         VARCHAR(255) NOT NULL,
                slug         VARCHAR(100) UNIQUE,
                plan         billingplan NOT NULL DEFAULT 'FREE',
                feature_flags TEXT,
                is_deleted   BOOLEAN NOT NULL DEFAULT FALSE,
                deleted_at   TIMESTAMPTZ,
                created_at   TIMESTAMPTZ DEFAULT NOW(),
                updated_at   TIMESTAMPTZ DEFAULT NOW()
            );
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_orgs_is_deleted ON organizations(is_deleted);")
        print("✅ Organizations table created (or already exists)")

        # ── 3. Add RBAC columns to users table ────────────────────────────────
        cols = await conn.fetch("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users';
        """)
        existing_cols = {r['column_name'] for r in cols}

        if 'role' not in existing_cols:
            await conn.execute("""
                ALTER TABLE users ADD COLUMN role userrole NOT NULL DEFAULT 'USER';
            """)
            print("✅ Added users.role column")
        else:
            print("⏭️  users.role already exists")

        if 'org_id' not in existing_cols:
            await conn.execute("""
                ALTER TABLE users ADD COLUMN org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;
            """)
            await conn.execute("CREATE INDEX IF NOT EXISTS ix_users_org_id ON users(org_id);")
            print("✅ Added users.org_id column")
        else:
            print("⏭️  users.org_id already exists")

        if 'created_by' not in existing_cols:
            await conn.execute("""
                ALTER TABLE users ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
            """)
            print("✅ Added users.created_by column")
        else:
            print("⏭️  users.created_by already exists")

        if 'is_active' not in existing_cols:
            await conn.execute("""
                ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
            """)
            await conn.execute("CREATE INDEX IF NOT EXISTS ix_users_is_active ON users(is_active);")
            print("✅ Added users.is_active column")
        else:
            print("⏭️  users.is_active already exists")

        # ── 4. Add impersonation_session_id to audit_logs if missing ─────────
        audit_cols = await conn.fetch("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'audit_logs';
        """)
        if audit_cols:
            audit_existing = {r['column_name'] for r in audit_cols}
            if 'impersonation_session_id' not in audit_existing:
                await conn.execute("""
                    ALTER TABLE audit_logs ADD COLUMN impersonation_session_id VARCHAR(64);
                """)
                print("✅ Added audit_logs.impersonation_session_id column")
            else:
                print("⏭️  audit_logs.impersonation_session_id already exists")
        else:
            print("⚠️  audit_logs table not found — run the main app first to create it via SQLAlchemy")

        # ── 5. Add org_id to v2_interviews if missing ─────────────────────────
        interview_cols = await conn.fetch("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'v2_interviews';
        """)
        if interview_cols:
            interview_existing = {r['column_name'] for r in interview_cols}
            if 'org_id' not in interview_existing:
                await conn.execute("""
                    ALTER TABLE v2_interviews ADD COLUMN org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL;
                """)
                await conn.execute("CREATE INDEX IF NOT EXISTS ix_interviews_org_id ON v2_interviews(org_id);")
                print("✅ Added v2_interviews.org_id column")
            else:
                print("⏭️  v2_interviews.org_id already exists")

        print("\n🎉 Migration complete!")
        print("\nNext steps:")
        print("  1. Run:  python seed_superadmin.py  — to create the first Super Admin")
        print("  2. Restart the backend server")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(run_migration())
