"""
Organization model — multi-tenant support for RBAC.

Each Organization is a tenant boundary:
  - Recruiters belong to exactly one org.
  - Candidates (Users) may belong to an org (if org-invited) or be self-signed (org_id = NULL).
  - Super Admins have org_id = NULL by design (cross-tenant).

Soft-delete via `is_deleted` flag; we never hard-delete rows.
"""

import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum as SAEnum
from sqlalchemy.sql import func
from app.config.database import Base


class BillingPlan(str, enum.Enum):
    FREE = "FREE"
    STARTER = "STARTER"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=True, index=True)  # URL-friendly name
    plan = Column(
        SAEnum(BillingPlan, name="billingplan", create_type=False, values_callable=lambda obj: [e.value for e in obj]),
        default=BillingPlan.FREE,
        nullable=False
    )

    # Feature flags (JSON stored as Text for simplicity, can upgrade to JSONB)
    feature_flags = Column(Text, nullable=True)   # JSON string

    # Soft delete
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
