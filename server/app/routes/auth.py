from fastapi import APIRouter, HTTPException, Response, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import UserCreate, UserResponse, User, Role
from app.config.database import get_db
from app.config.jwt_handler import create_access_token

router = APIRouter()


@router.post("/google", response_model=UserResponse)
async def google_auth(user_data: UserCreate, response: Response, db: AsyncSession = Depends(get_db)):
    """Google OAuth authentication — creates user if not exists, returns JWT with role + org_id."""
    try:
        result = await db.execute(select(User).where(User.email == user_data.email))
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                name=user_data.name,
                email=user_data.email,
                credits=100,
                role=Role.USER,        # Default role for self-signup
                org_id=None,
                is_active=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        elif not user.is_active:
            raise HTTPException(status_code=403, detail="Your account has been deactivated.")

        # Token now includes role + org_id
        token = create_access_token(
            user_id=user.id,
            role=user.role.value if hasattr(user.role, 'value') else user.role,
            org_id=user.org_id,
        )

        response.set_cookie(
            key="token",
            value=token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7 * 24 * 60 * 60,  # 7 days
        )

        resp = UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            credits=user.credits,
            role=user.role.value if hasattr(user.role, 'value') else str(user.role),
            org_id=user.org_id,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            token=token,
        )
        return resp

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Google auth error: {str(e)}")


@router.get("/logout")
async def logout(response: Response):
    """Logout user"""
    try:
        response.delete_cookie(key="token", path="/", samesite="none", secure=True)
        return {"message": "Logout Successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout error: {str(e)}")
