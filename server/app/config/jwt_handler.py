from jose import JWTError, jwt
from datetime import datetime, timedelta
from .settings import settings


def create_access_token(user_id: str) -> str:
    """Generate JWT token"""
    expire = datetime.utcnow() + timedelta(days=7)
    payload = {
        "userId": user_id,
        "exp": expire
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
    return token


def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return None
