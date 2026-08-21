"""
RBAC Middleware — FastAPI dependencies for role enforcement.

Provides:
  get_current_user_ctx()   — resolves JWT to UserContext (id, role, org_id).
  require_roles(*roles)    — dependency factory; raises 403 if role not allowed.
  require_db_role(*roles)  — same but RE-CHECKS role from DB (for high-privilege actions).
  get_current_user()       — backward-compat shim returning user_id string.
"""

from fastapi import HTTPException, Cookie, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.config.jwt_handler import verify_token
from app.config.database import get_db
from app.models.user import User, Role, UserContext


# ─────────────────────────────────────────────────────────────────────────────
# Core JWT resolver
# ─────────────────────────────────────────────────────────────────────────────

async def get_current_user_ctx(
    token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
) -> UserContext:
    """
    Resolve JWT cookie → UserContext.
    Fetches the user row from DB on every request to catch:
      - Deactivated accounts
      - Role demotions (JWT may carry old role — DB is authoritative for identity)

    NOTE: The JWT role is used for fast-path checks on low-privilege routes.
          For high-privilege actions, use require_db_role() which also asserts DB role.
    """
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")

    # Fetch from DB to get fresh is_active status
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user: Optional[User] = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")

    # Use JWT role for fast path (avoids extra load on most requests)
    jwt_role = payload.get("role", user.role)

    return UserContext(
        user_id=user.id,
        role=jwt_role,
        org_id=payload.get("orgId") or user.org_id,
        email=user.email,
        name=user.name,
        is_active=user.is_active,
    )


async def get_optional_user_ctx(
    token: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
) -> Optional[UserContext]:
    """
    Resolve JWT cookie → UserContext if present and valid, otherwise return None.
    Allows public routes like session check to avoid raising 401.
    """
    if not token:
        return None
    payload = verify_token(token)
    if not payload:
        return None
    user_id = payload.get("userId")
    if not user_id:
        return None
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user: Optional[User] = result.scalar_one_or_none()
    if not user or not user.is_active:
        return None
    jwt_role = payload.get("role", user.role)
    return UserContext(
        user_id=user.id,
        role=jwt_role,
        org_id=payload.get("orgId") or user.org_id,
        email=user.email,
        name=user.name,
        is_active=user.is_active,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Backward-compat shim (existing routes use get_current_user returning str)
# ─────────────────────────────────────────────────────────────────────────────

async def get_current_user(token: Optional[str] = Cookie(None)) -> str:
    """
    Backward-compatible dependency. Returns user_id as string.
    Routes that need role checks should migrate to get_current_user_ctx().
    """
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User does not have a token")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return str(user_id)


# ─────────────────────────────────────────────────────────────────────────────
# Role guard — fast path (JWT claim, no extra DB hit)
# ─────────────────────────────────────────────────────────────────────────────

def require_roles(*roles: Role):
    """
    FastAPI dependency factory.

    Usage:
        @router.get("/endpoint")
        async def endpoint(ctx: UserContext = Depends(require_roles(Role.RECRUITER, Role.SUPER_ADMIN))):
            ...
    """
    async def _guard(ctx: UserContext = Depends(get_current_user_ctx)) -> UserContext:
        if ctx.role not in [r.value if hasattr(r, 'value') else r for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r if isinstance(r, str) else r.value for r in roles]}",
            )
        return ctx
    return _guard


# ─────────────────────────────────────────────────────────────────────────────
# DB Role guard — re-checks role from DB (for high-privilege actions)
# ─────────────────────────────────────────────────────────────────────────────

def require_db_role(*roles: Role):
    """
    Like require_roles() but RE-FETCHES the user's role from the DB.
    Use for high-privilege actions (score override, export, impersonation)
    to prevent stale-JWT privilege escalation after a role demotion.
    """
    async def _guard(
        token: Optional[str] = Cookie(None),
        db: AsyncSession = Depends(get_db),
    ) -> UserContext:
        if not token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")

        payload = verify_token(token)
        if not payload:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token.")

        user_id = payload.get("userId")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")

        # ── Authoritative DB check ────────────────────────────────────────────
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user: Optional[User] = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account not found or deactivated.")

        db_role = user.role  # Authoritative — not JWT claim
        allowed = [r.value if hasattr(r, 'value') else r for r in roles]

        if db_role not in allowed and db_role.value not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied (DB role check). Required: {allowed}, Your role: {db_role}",
            )

        return UserContext(
            user_id=user.id,
            role=db_role,
            org_id=user.org_id,
            email=user.email,
            name=user.name,
            is_active=user.is_active,
        )
    return _guard


# ─────────────────────────────────────────────────────────────────────────────
# Org scope checker — ensures recruiter only touches their own org's data
# ─────────────────────────────────────────────────────────────────────────────

def assert_org_scope(ctx: UserContext, target_org_id: Optional[int]) -> None:
    """
    Raises 403 if a RECRUITER tries to access data outside their org.
    SUPER_ADMIN bypasses this check.

    Usage (inside route handler):
        assert_org_scope(ctx, interview.org_id)
    """
    if ctx.role in (Role.SUPER_ADMIN, Role.SUPER_ADMIN.value):
        return  # Super admins cross all org boundaries

    if ctx.org_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not associated with an organization.",
        )

    if target_org_id is not None and ctx.org_id != target_org_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this organization's data.",
        )
