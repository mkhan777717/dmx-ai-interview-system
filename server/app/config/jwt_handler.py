from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from .settings import settings


# ── Token lifetimes ───────────────────────────────────────────────────────────
STANDARD_TOKEN_DAYS      = 7      # Normal user sessions
IMPERSONATION_TOKEN_MINS = 15     # Super Admin impersonation — time-boxed


def create_access_token(
    user_id: int,
    role: str,
    org_id: Optional[int] = None,
    *,
    impersonated_as: Optional[int] = None,
) -> str:
    """
    Generate a JWT access token.

    Args:
        user_id:         Real user's DB id.
        role:            One of SUPER_ADMIN | RECRUITER | USER.
        org_id:          Org the user belongs to (None for Super Admins / self-signup).
        impersonated_as: If set, this is an impersonation token. The token will:
                         - Expire in IMPERSONATION_TOKEN_MINS minutes (not 7 days).
                         - Carry an `impersonated_as` claim for audit logging.
    """
    if impersonated_as is not None:
        expire = datetime.utcnow() + timedelta(minutes=IMPERSONATION_TOKEN_MINS)
    else:
        expire = datetime.utcnow() + timedelta(days=STANDARD_TOKEN_DAYS)

    payload: dict = {
        "userId": user_id,
        "role":   role,
        "orgId":  org_id,
        "exp":    expire,
    }
    if impersonated_as is not None:
        payload["impersonatedAs"] = impersonated_as

    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode JWT token. Returns None on any error."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except JWTError:
        return None
