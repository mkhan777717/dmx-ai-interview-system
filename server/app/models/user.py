"""
User model — updated with RBAC fields.

Role Hierarchy:
  SUPER_ADMIN > RECRUITER > USER

  - SUPER_ADMIN: org_id = NULL (cross-tenant access)
  - RECRUITER:   org_id = FK to organizations (scoped to one org)
  - USER:        org_id = NULL (self-signup) or set (org-invited candidate)

Soft delete: is_active = False instead of deleting rows.
"""

import enum
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean,
    ForeignKey, Enum as SAEnum,
)
from sqlalchemy.sql import func
from app.config.database import Base


# ── Role Enum ─────────────────────────────────────────────────────────────────

class Role(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    RECRUITER   = "RECRUITER"
    USER        = "USER"


# ── SQLAlchemy ORM Model ──────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name       = Column(String, nullable=False)
    email      = Column(String, unique=True, nullable=False, index=True)
    credits    = Column(Integer, default=100, nullable=False)

    # ── RBAC additions ────────────────────────────────────────────────────────
    role       = Column(
        SAEnum(Role, name="userrole", create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        default=Role.USER,
        nullable=False,
        index=True
    )
    org_id     = Column(Integer, ForeignKey("organizations.id"), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active  = Column(Boolean, default=True, nullable=False, index=True)
    # ─────────────────────────────────────────────────────────────────────────

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


# ── Pydantic Models ───────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    credits: int
    role: str
    org_id: Optional[int] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    token: Optional[str] = None

    class Config:
        from_attributes = True


class UserContext(BaseModel):
    """Resolved from JWT + DB; passed to route handlers via Depends()."""
    user_id: int
    role: Role
    org_id: Optional[int]
    email: str
    name: str
    is_active: bool = True

    class Config:
        use_enum_values = True
