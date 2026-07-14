from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import UserResponse, User
from app.config.database import get_db
from app.middleware.auth import get_current_user

router = APIRouter()


@router.get("/current-user", response_model=UserResponse)
async def get_current_user_info(user_id: str = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user information"""
    try:
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get current user: {str(e)}")
