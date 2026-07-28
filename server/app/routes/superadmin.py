"""
Super Admin Routes — Platform-level operations across all tenants.

All endpoints require SUPER_ADMIN role (DB-checked).

Endpoints:
  GET  /api/superadmin/orgs                   — list all organizations
  POST /api/superadmin/orgs                   — create organization
  DELETE /api/superadmin/orgs/{id}            — soft-delete org (cascade)
  GET  /api/superadmin/users                  — all users across all orgs
  POST /api/superadmin/users/{id}/impersonate — time-boxed impersonation
  GET  /api/superadmin/platform-analytics     — cross-org platform stats
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from app.config.database import get_db
from app.config.jwt_handler import create_access_token, IMPERSONATION_TOKEN_MINS
from app.middleware.auth import require_db_role
from app.models.user import Role, UserContext, User
from app.models.organization import Organization, BillingPlan
from app.models.v2_interview import V2Interview, AuditLog

router = APIRouter()


# ── Request Models ────────────────────────────────────────────────────────────

class CreateOrgRequest(BaseModel):
    name: str
    slug: Optional[str] = None
    plan: BillingPlan = BillingPlan.FREE


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize_org(o: Organization) -> dict:
    return {
        "id": o.id,
        "name": o.name,
        "slug": o.slug,
        "plan": o.plan.value if hasattr(o.plan, 'value') else o.plan,
        "is_deleted": o.is_deleted,
        "created_at": o.created_at,
    }


def _serialize_user(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role.value if hasattr(u.role, 'value') else u.role,
        "org_id": u.org_id,
        "is_active": u.is_active,
        "credits": u.credits,
        "created_at": u.created_at,
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/superadmin/orgs
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/orgs")
async def list_organizations(
    include_deleted: bool = Query(False),
    ctx: UserContext = Depends(require_db_role(Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """List all organizations across the platform."""
    q = select(Organization)
    if not include_deleted:
        q = q.where(Organization.is_deleted == False)
    q = q.order_by(Organization.created_at.desc())

    result = await db.execute(q)
    orgs = result.scalars().all()

    # Attach member counts
    org_data = []
    for o in orgs:
        count_result = await db.execute(
            select(func.count()).select_from(User).where(User.org_id == o.id, User.is_active == True)
        )
        member_count = count_result.scalar()
        org_data.append({**_serialize_org(o), "member_count": member_count})

    return {"orgs": org_data, "total": len(org_data)}


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/superadmin/orgs
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/orgs", status_code=201)
async def create_organization(
    body: CreateOrgRequest,
    ctx: UserContext = Depends(require_db_role(Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Create a new organization."""
    org = Organization(
        name=body.name,
        slug=body.slug or body.name.lower().replace(" ", "-"),
        plan=body.plan,
    )
    db.add(org)

    audit = AuditLog(
        actor_id=ctx.user_id,
        action="org.create",
        entity_type="Organization",
        entity_id=None,
        details={"name": body.name, "plan": body.plan.value if hasattr(body.plan, 'value') else body.plan},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(org)

    return _serialize_org(org)


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /api/superadmin/orgs/{org_id}  — soft-delete with cascade
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/orgs/{org_id}")
async def delete_organization(
    org_id: int,
    ctx: UserContext = Depends(require_db_role(Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Soft-delete an organization.
    Cascades to:
      - All Users in org → is_active = False
      - All V2Interviews in org → status = 'archived' (data retained for audit)
    Hard deletes are NOT performed (data retention policy).
    """
    result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")
    if org.is_deleted:
        raise HTTPException(status_code=400, detail="Organization already deleted.")

    now = datetime.now(timezone.utc)

    # Soft-delete org
    org.is_deleted = True
    org.deleted_at = now

    # Cascade: deactivate all users
    await db.execute(
        update(User)
        .where(User.org_id == org_id, User.is_active == True)
        .values(is_active=False)
    )

    # Cascade: archive interviews (if org_id column exists on interviews)
    if hasattr(V2Interview, 'org_id'):
        await db.execute(
            update(V2Interview)
            .where(V2Interview.org_id == org_id, V2Interview.status == "in_progress")
            .values(status="archived")
        )

    # Audit log
    audit = AuditLog(
        actor_id=ctx.user_id,
        action="org.delete",
        entity_type="Organization",
        entity_id=org_id,
        details={"org_name": org.name, "deleted_at": now.isoformat()},
    )
    db.add(audit)
    await db.commit()

    return {"message": f"Organization '{org.name}' soft-deleted. All members deactivated."}


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/superadmin/users
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/users")
async def list_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    role: Optional[str] = Query(None),
    org_id: Optional[int] = Query(None),
    ctx: UserContext = Depends(require_db_role(Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """List all users across all orgs."""
    q = select(User)
    if role:
        q = q.where(User.role == role)
    if org_id is not None:
        q = q.where(User.org_id == org_id)
    q = q.order_by(User.created_at.desc())

    count_result = await db.execute(select(func.count()).select_from(User))
    total = count_result.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(q.offset(offset).limit(page_size))
    users = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "users": [_serialize_user(u) for u in users],
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/superadmin/users/{target_id}/impersonate
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/users/{target_id}/impersonate")
async def impersonate_user(
    target_id: int,
    response: Response,
    ctx: UserContext = Depends(require_db_role(Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Time-boxed impersonation session (15 minutes).
    Issues a short-lived JWT with `impersonatedAs` claim.
    Every request within an impersonation session is flagged in the audit log.
    """
    if target_id == ctx.user_id:
        raise HTTPException(status_code=400, detail="Cannot impersonate yourself.")

    result = await db.execute(select(User).where(User.id == target_id))
    target = result.scalar_one_or_none()
    if not target or not target.is_active:
        raise HTTPException(status_code=404, detail="Target user not found or inactive.")

    # Cannot impersonate another Super Admin
    target_role = target.role.value if hasattr(target.role, 'value') else target.role
    if target_role == "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Cannot impersonate another Super Admin.")

    # Issue time-boxed impersonation token
    token = create_access_token(
        user_id=ctx.user_id,          # Actor's real ID
        role=target_role,              # Impersonated role
        org_id=target.org_id,
        impersonated_as=target_id,
    )

    # Replace the cookie with the impersonation token
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=IMPERSONATION_TOKEN_MINS * 60,
    )

    # Mandatory audit log
    audit = AuditLog(
        actor_id=ctx.user_id,
        action="superadmin.impersonate",
        entity_type="User",
        entity_id=target_id,
        details={
            "impersonated_email": target.email,
            "impersonated_role": target_role,
            "duration_minutes": IMPERSONATION_TOKEN_MINS,
            "actor_email": ctx.email,
        },
    )
    db.add(audit)
    await db.commit()

    return {
        "message": f"Impersonating {target.email} for {IMPERSONATION_TOKEN_MINS} minutes.",
        "expires_in_minutes": IMPERSONATION_TOKEN_MINS,
        "impersonated_user": {
            "id": target.id,
            "name": target.name,
            "email": target.email,
            "role": target_role,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/superadmin/platform-analytics
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/platform-analytics")
async def get_platform_analytics(
    ctx: UserContext = Depends(require_db_role(Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Cross-org platform analytics."""
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar()
    total_active_users = (
        await db.execute(select(func.count()).select_from(User).where(User.is_active == True))
    ).scalar()
    total_recruiters = (
        await db.execute(select(func.count()).select_from(User).where(User.role == Role.RECRUITER))
    ).scalar()
    total_orgs = (
        await db.execute(
            select(func.count()).select_from(Organization).where(Organization.is_deleted == False)
        )
    ).scalar()

    interviews_result = await db.execute(select(V2Interview))
    interviews = interviews_result.scalars().all()

    total_interviews = len(interviews)
    total_completed = sum(1 for i in interviews if i.status == "completed")
    avg_score = (
        round(sum(i.final_score or 0 for i in interviews if i.status == "completed") / total_completed, 1)
        if total_completed > 0 else 0
    )

    # Mode distribution
    mode_counts: dict = {}
    for i in interviews:
        m = i.interview_mode or "Technical"
        mode_counts[m] = mode_counts.get(m, 0) + 1

    # Recent audit events
    audit_result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).limit(10)
    )
    recent_audits = audit_result.scalars().all()

    return {
        "users": {
            "total": total_users,
            "active": total_active_users,
            "recruiters": total_recruiters,
        },
        "organizations": {"total": total_orgs},
        "interviews": {
            "total": total_interviews,
            "completed": total_completed,
            "completion_rate": round(total_completed / total_interviews * 100, 1) if total_interviews > 0 else 0,
            "avg_score": avg_score,
        },
        "mode_distribution": [{"mode": m, "count": c} for m, c in mode_counts.items()],
        "recent_audit_events": [
            {
                "id": a.id,
                "actor_id": a.actor_id,
                "action": a.action,
                "entity_type": a.entity_type,
                "created_at": a.created_at,
            }
            for a in recent_audits
        ],
    }
