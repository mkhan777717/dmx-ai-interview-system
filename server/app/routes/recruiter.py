"""
Recruiter Routes — Org-scoped candidate management.

All endpoints require RECRUITER or SUPER_ADMIN role.

Endpoints:
  POST /api/recruiter/invite          — invite a candidate by email
  GET  /api/recruiter/candidates      — list org's candidates
  GET  /api/recruiter/templates       — list org's interview templates (placeholder)
"""

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr
from typing import Optional, List

from app.config.database import get_db
from app.middleware.auth import require_roles, assert_org_scope
from app.models.user import Role, UserContext, User
from app.models.v2_interview import V2Interview, AuditLog

router = APIRouter()


# ── Request Models ────────────────────────────────────────────────────────────

class InviteRequest(BaseModel):
    emails: List[EmailStr]
    message: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize_candidate(u: User, interview_count: int = 0, avg_score: Optional[float] = None) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role.value if hasattr(u.role, 'value') else u.role,
        "org_id": u.org_id,
        "is_active": u.is_active,
        "created_at": u.created_at,
        "interview_count": interview_count,
        "avg_score": avg_score,
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/recruiter/invite
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/invite")
async def invite_candidates(
    body: InviteRequest,
    ctx: UserContext = Depends(require_roles(Role.RECRUITER, Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Invite one or more candidates by email.
    - Creates User records (role=USER) associated with the recruiter's org.
    - In production: send invitation email here via background task.
    - Returns list of created/existing user IDs.
    """
    if not ctx.org_id and ctx.role not in ("SUPER_ADMIN", Role.SUPER_ADMIN):
        raise HTTPException(
            status_code=400,
            detail="You must belong to an organization to invite candidates."
        )

    results = []
    for email in body.emails:
        existing_result = await db.execute(select(User).where(User.email == email))
        existing = existing_result.scalar_one_or_none()

        if existing:
            # Associate with org if not already
            if existing.org_id is None and ctx.org_id:
                existing.org_id = ctx.org_id
            results.append({
                "email": email,
                "status": "existing",
                "user_id": existing.id,
                "org_id": existing.org_id,
            })
        else:
            # Create placeholder candidate account
            new_user = User(
                name=email.split("@")[0].replace(".", " ").title(),
                email=email,
                credits=100,
                role=Role.USER,
                org_id=ctx.org_id,
                created_by=ctx.user_id,
                is_active=True,
            )
            db.add(new_user)
            await db.flush()  # Get ID without full commit

            audit = AuditLog(
                actor_id=ctx.user_id,
                action="recruiter.invite",
                entity_type="User",
                entity_id=new_user.id,
                details={
                    "invited_email": email,
                    "org_id": ctx.org_id,
                    "actor_role": ctx.role if isinstance(ctx.role, str) else ctx.role.value,
                },
            )
            db.add(audit)

            results.append({
                "email": email,
                "status": "invited",
                "user_id": new_user.id,
                "org_id": ctx.org_id,
            })

    await db.commit()

    return {
        "message": f"{len(body.emails)} candidate(s) processed.",
        "results": results,
        "note": "In production, invitation emails would be dispatched here.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/recruiter/candidates
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/candidates")
async def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    ctx: UserContext = Depends(require_roles(Role.RECRUITER, Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """List candidates scoped to the recruiter's org."""
    q = select(User).where(User.role == Role.USER)

    # Org scope for Recruiters
    if ctx.role in ("RECRUITER", Role.RECRUITER):
        if ctx.org_id is not None:
            q = q.where(User.org_id == ctx.org_id)
        else:
            raise HTTPException(status_code=403, detail="Not associated with an organization.")

    if search:
        q = q.where(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )

    count_result = await db.execute(
        select(func.count()).select_from(User).where(User.role == Role.USER)
    )
    total = count_result.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(q.order_by(User.created_at.desc()).offset(offset).limit(page_size))
    users = result.scalars().all()

    # Enrich with interview stats
    candidates = []
    for u in users:
        interview_q = select(func.count(), func.avg(V2Interview.final_score)).where(
            V2Interview.user_id == u.id,
            V2Interview.status == "completed",
        )
        stats = (await db.execute(interview_q)).one()
        candidates.append(_serialize_candidate(
            u,
            interview_count=stats[0] or 0,
            avg_score=round(stats[1], 1) if stats[1] else None,
        ))

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "candidates": candidates,
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/recruiter/templates  (placeholder — extendable)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/templates")
async def list_templates(
    ctx: UserContext = Depends(require_roles(Role.RECRUITER, Role.SUPER_ADMIN)),
):
    """
    Interview templates for the recruiter's org.
    Currently returns a stub — extend with a Templates table as needed.
    """
    return {
        "templates": [
            {
                "id": 1,
                "name": "Standard Technical Screen",
                "mode": "Technical",
                "question_count": 8,
                "duration_minutes": 45,
            },
            {
                "id": 2,
                "name": "Behavioral + Culture Fit",
                "mode": "HR & Behavioral",
                "question_count": 6,
                "duration_minutes": 30,
            },
        ],
        "note": "Full template CRUD coming in next iteration.",
    }
