from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import UserResponse, User, UserContext
from app.config.database import get_db
from app.middleware.auth import get_current_user_ctx

router = APIRouter()


@router.get("/current-user", response_model=UserResponse)
async def get_current_user_info(ctx: UserContext = Depends(get_current_user_ctx)):
    """
    Get current authenticated user info.
    Returns role and org_id so the frontend can render the appropriate dashboard.
    """
    return UserResponse(
        id=ctx.user_id,
        name=ctx.name,
        email=ctx.email,
        credits=0,   # Will be filled by DB query below if needed
        role=ctx.role if isinstance(ctx.role, str) else ctx.role.value,
        org_id=ctx.org_id,
        is_active=ctx.is_active,
    )


@router.get("/current-user/full", response_model=UserResponse)
async def get_current_user_full(
    ctx: UserContext = Depends(get_current_user_ctx),
    db: AsyncSession = Depends(get_db),
):
    """Full user info including credits (DB hit)."""
    result = await db.execute(select(User).where(User.id == ctx.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
