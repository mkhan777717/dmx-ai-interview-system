#!/usr/bin/env python3
"""
Super Admin Seed Script
=======================
Creates (or promotes) the first Super Admin account.
Cannot be done via self-signup — must be run from the server.

Usage:
    python seed_superadmin.py --email admin@example.com --name "Super Admin"

The user is created if they don't exist, or their role is promoted to
SUPER_ADMIN if they already have an account.
"""

import asyncio
import argparse
import os
import sys
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    print("❌ DATABASE_URL is missing or empty. Please set DATABASE_URL environment variable.")
    sys.exit(1)


async def seed(email: str, name: str):
    import asyncpg
    from sqlalchemy.engine.url import make_url

    parsed = make_url(DATABASE_URL)
    user = parsed.username or "postgres"
    password = parsed.password
    host = parsed.host or "localhost"
    port = parsed.port or 5432
    dbname = parsed.database or "postgres"

    conn = await asyncpg.connect(user=user, password=password, host=host, port=port, database=dbname)

    try:
        existing = await conn.fetchrow("SELECT id, email, role FROM users WHERE email = $1", email)

        if existing:
            await conn.execute(
                "UPDATE users SET role = 'SUPER_ADMIN', is_active = TRUE, org_id = NULL WHERE email = $1",
                email,
            )
            print(f"✅ Promoted existing user '{email}' to SUPER_ADMIN")
            print(f"   User ID: {existing['id']}")
        else:
            row = await conn.fetchrow(
                """
                INSERT INTO users (name, email, credits, role, is_active)
                VALUES ($1, $2, 9999, 'SUPER_ADMIN', TRUE)
                RETURNING id
                """,
                name,
                email,
            )
            print(f"✅ Created new SUPER_ADMIN: '{email}'")
            print(f"   User ID: {row['id']}")

        print("\n⚠️  IMPORTANT:")
        print("   This user authenticates via Google OAuth with this email address.")
        print("   Make sure they sign in with this exact email.")
        print("\n   They will have full platform access — treat this account carefully.")

    finally:
        await conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the first Super Admin account")
    parser.add_argument("--email", required=True, help="Email address of the Super Admin")
    parser.add_argument("--name", default="Super Admin", help="Display name")
    args = parser.parse_args()

    asyncio.run(seed(args.email, args.name))
