from fastapi import APIRouter, HTTPException, Response, Depends
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import UserCreate, UserResponse, User
from app.config.database import get_db
from app.config.jwt_handler import create_access_token

router = APIRouter()


@router.post("/google", response_model=UserResponse)
async def google_auth(user_data: UserCreate, response: Response, db: AsyncSession = Depends(get_db)):
    """Google OAuth authentication"""
    try:
        # Check if user exists
        result = await db.execute(select(User).where(User.email == user_data.email))
        user = result.scalar_one_or_none()
        
        if not user:
            # Create new user
            user = User(
                name=user_data.name,
                email=user_data.email,
                credits=100
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        # Generate token
        token = create_access_token(str(user.id))
        
        # Set cookie
        response.set_cookie(
            key="token",
            value=token,
            httponly=True,
            secure=False,
            samesite="lax",
            path="/",
            max_age=7 * 24 * 60 * 60  # 7 days
        )
        
        return user
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Google auth error: {str(e)}")


@router.get("/logout")
async def logout(response: Response):
    """Logout user"""
    try:
        response.delete_cookie(key="token", path="/")
        return {"message": "Logout Successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout error: {str(e)}")
