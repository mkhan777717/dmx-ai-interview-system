from fastapi import HTTPException, Cookie, Depends
from typing import Optional
from app.config.jwt_handler import verify_token


async def get_current_user(token: Optional[str] = Cookie(None)) -> str:
    """Middleware to verify JWT token from cookies"""
    if not token:
        raise HTTPException(status_code=401, detail="User does not have a token")
    
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("userId")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return user_id
