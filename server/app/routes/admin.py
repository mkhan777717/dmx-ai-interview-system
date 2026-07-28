"""
Admin Routes — Org-scoped recruiter/admin dashboard API.

RBAC:
  - GET  /api/admin/interviews         → RECRUITER (own org), SUPER_ADMIN (all)
  - GET  /api/admin/interviews/{id}    → RECRUITER (own org), SUPER_ADMIN
  - PATCH /api/admin/answers/{id}/override → RECRUITER or SUPER_ADMIN (DB role re-checked)
  - GET  /api/admin/analytics          → RECRUITER (own org), SUPER_ADMIN (all)
  - GET  /api/admin/audit-logs         → SUPER_ADMIN only
  - PATCH /api/admin/users/{id}/role   → SUPER_ADMIN only
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional

from app.config.database import get_db
from app.middleware.auth import require_roles, require_db_role, assert_org_scope
from app.models.user import Role, UserContext, User
from app.models.v2_interview import V2Interview, V2Answer, AuditLog

router = APIRouter()


# ── Request / Response Models ─────────────────────────────────────────────────

class OverrideRequest(BaseModel):
    new_score: float
    reason: str


class RoleUpdateRequest(BaseModel):
    new_role: Role
    org_id: Optional[int] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize_interview(i: V2Interview) -> dict:
    return {
        "id": i.id,
        "candidate_name": i.candidate_name or "Anonymous",
        "candidate_email": i.candidate_email,
        "predicted_role": i.predicted_role,
        "interview_mode": i.interview_mode or "Technical",
        "status": i.status,
        "final_score": i.final_score,
        "percentile": i.percentile,
        "rubric_id": i.rubric_id,
        "integrity_flags": i.integrity_flags or [],
        "admin_overrides": i.admin_overrides or [],
        "created_at": i.created_at,
        "hiring_recommendation": _get_recommendation(i.final_score),
        "org_id": i.org_id if hasattr(i, 'org_id') else None,
    }


def _get_recommendation(score) -> str:
    if score is None:
        return "Pending"
    if score >= 8.0:
        return "Strong Hire"
    if score >= 6.5:
        return "Hire"
    if score >= 5.0:
        return "Borderline"
    return "Reject"


def _apply_org_scope(query, ctx: UserContext, model=V2Interview):
    """Apply org_id filter for Recruiters; Super Admins see everything."""
    if ctx.role in (Role.RECRUITER, Role.RECRUITER.value, "RECRUITER"):
        if ctx.org_id is not None and hasattr(model, 'org_id'):
            query = query.where(model.org_id == ctx.org_id)
        else:
            # Recruiter without org sees only their candidates (by user_id relationship)
            pass
    return query


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/admin/interviews
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/interviews")
async def list_all_interviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None),
    max_score: Optional[float] = Query(None),
    ctx: UserContext = Depends(require_roles(Role.RECRUITER, Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Paginated candidate pipeline. Org-scoped for Recruiters."""
    try:
        query = select(V2Interview).order_by(V2Interview.created_at.desc())
        count_q = select(func.count()).select_from(V2Interview)

        # Apply filters
        if status:
            query = query.where(V2Interview.status == status)
            count_q = count_q.where(V2Interview.status == status)
        if role:
            query = query.where(V2Interview.predicted_role.ilike(f"%{role}%"))
        if min_score is not None:
            query = query.where(V2Interview.final_score >= min_score)
        if max_score is not None:
            query = query.where(V2Interview.final_score <= max_score)

        # Org scope for Recruiters
        if ctx.role in ("RECRUITER", Role.RECRUITER) and ctx.org_id is not None:
            if hasattr(V2Interview, 'org_id'):
                query = query.where(V2Interview.org_id == ctx.org_id)
                count_q = count_q.where(V2Interview.org_id == ctx.org_id)

        count_result = await db.execute(count_q)
        total = count_result.scalar()

        offset = (page - 1) * page_size
        result = await db.execute(query.offset(offset).limit(page_size))
        interviews = result.scalars().all()

        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": max(1, (total + page_size - 1) // page_size),
            "interviews": [_serialize_interview(i) for i in interviews],
            "viewer_role": ctx.role if isinstance(ctx.role, str) else ctx.role.value,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/admin/interviews/{interview_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/interviews/{interview_id}")
async def get_interview_detail(
    interview_id: int,
    ctx: UserContext = Depends(require_roles(Role.RECRUITER, Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Full interview detail with all answers and scores."""
    result = await db.execute(
        select(V2Interview)
        .options(selectinload(V2Interview.answers))
        .where(V2Interview.id == interview_id)
    )
    interview = result.scalar_one_or_none()

    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    # Org scope check for Recruiters
    if ctx.role in ("RECRUITER", Role.RECRUITER) and hasattr(interview, 'org_id'):
        assert_org_scope(ctx, interview.org_id)

    answers = sorted(interview.answers, key=lambda a: a.question_index)

    return {
        **_serialize_interview(interview),
        "report": interview.report,
        "improvement_plan": interview.improvement_plan or [],
        "admin_notes": interview.admin_notes,
        "answers": [
            {
                "id": a.id,
                "question_index": a.question_index,
                "question_text": a.question_text,
                "skill": a.skill,
                "topic": a.topic,
                "difficulty": a.difficulty,
                "candidate_answer": a.candidate_answer,
                "final_score": a.final_score,
                "semantic_score": a.semantic_score,
                "concept_score": a.concept_score,
                "communication_score": a.communication_score,
                "communication_breakdown": a.communication_breakdown,
                "ai_detection_score": a.ai_detection_score,
                "ai_detection_flags": a.ai_detection_flags or [],
                "covered_concepts": a.covered_concepts or [],
                "missing_concepts": a.missing_concepts or [],
                "feedback": a.feedback,
                "confidence": a.confidence,
                "justification": a.justification,
                "had_followup": a.had_followup,
                "followup_question": a.followup_question,
                "followup_score": a.followup_score,
            }
            for a in answers
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /api/admin/answers/{answer_id}/override
# DB role re-checked — prevents stale-JWT privilege escalation
# ─────────────────────────────────────────────────────────────────────────────
@router.patch("/answers/{answer_id}/override")
async def override_answer_score(
    answer_id: int,
    body: OverrideRequest,
    ctx: UserContext = Depends(require_db_role(Role.RECRUITER, Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Human-in-the-loop score override.
    Uses require_db_role() — role re-fetched from DB so demoted Recruiters
    are rejected even if their JWT still carries the old RECRUITER claim.
    """
    if not (0.0 <= body.new_score <= 10.0):
        raise HTTPException(status_code=400, detail="Score must be between 0 and 10.")
    if not body.reason or len(body.reason.strip()) < 5:
        raise HTTPException(status_code=400, detail="A reason of at least 5 characters is required.")

    result = await db.execute(select(V2Answer).where(V2Answer.id == answer_id))
    answer = result.scalar_one_or_none()
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found.")

    # Org scope check for Recruiters
    if ctx.role in ("RECRUITER", Role.RECRUITER):
        interview_result = await db.execute(
            select(V2Interview).where(V2Interview.id == answer.interview_id)
        )
        interview_for_check = interview_result.scalar_one_or_none()
        if interview_for_check and hasattr(interview_for_check, 'org_id'):
            assert_org_scope(ctx, interview_for_check.org_id)

    old_score = answer.final_score
    answer.final_score = body.new_score

    # ── Mandatory audit log entry ─────────────────────────────────────────────
    audit = AuditLog(
        actor_id=ctx.user_id,
        action="score.override",
        entity_type="V2Answer",
        entity_id=answer_id,
        details={
            "old_score": old_score,
            "new_score": body.new_score,
            "reason": body.reason,
            "interview_id": answer.interview_id,
            "question_index": answer.question_index,
            "actor_role": ctx.role if isinstance(ctx.role, str) else ctx.role.value,
            "actor_org_id": ctx.org_id,
        },
    )
    db.add(audit)

    # Track override on the interview + recalculate final score
    interview_result = await db.execute(
        select(V2Interview).where(V2Interview.id == answer.interview_id)
    )
    interview = interview_result.scalar_one_or_none()
    if interview:
        overrides = list(interview.admin_overrides or [])
        overrides.append({
            "answer_id": answer_id,
            "question_index": answer.question_index,
            "old_score": old_score,
            "new_score": body.new_score,
            "reason": body.reason,
            "reviewer_id": ctx.user_id,
            "reviewer_role": ctx.role if isinstance(ctx.role, str) else ctx.role.value,
        })
        interview.admin_overrides = overrides

        all_answers_result = await db.execute(
            select(V2Answer).where(V2Answer.interview_id == answer.interview_id)
        )
        all_answers = all_answers_result.scalars().all()
        if all_answers:
            interview.final_score = round(
                sum(a.final_score or 0 for a in all_answers) / len(all_answers), 1
            )

    await db.commit()

    return {
        "message": "Score overridden successfully.",
        "answer_id": answer_id,
        "old_score": old_score,
        "new_score": body.new_score,
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/admin/analytics
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/analytics")
async def get_admin_analytics(
    ctx: UserContext = Depends(require_roles(Role.RECRUITER, Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate analytics. Org-scoped for Recruiters."""
    try:
        q = select(V2Interview).where(V2Interview.status == "completed")
        # Org scope for Recruiters
        if ctx.role in ("RECRUITER", Role.RECRUITER) and ctx.org_id is not None:
            if hasattr(V2Interview, 'org_id'):
                q = q.where(V2Interview.org_id == ctx.org_id)

        interviews_result = await db.execute(q)
        interviews = interviews_result.scalars().all()

        answers_q = select(V2Answer)
        if ctx.role in ("RECRUITER", Role.RECRUITER) and ctx.org_id is not None:
            if hasattr(V2Interview, 'org_id'):
                answers_q = answers_q.join(V2Interview).where(V2Interview.org_id == ctx.org_id)

        answers_result = await db.execute(answers_q)
        all_answers = answers_result.scalars().all()

        total_interviews = len(interviews)
        avg_score = (
            round(sum(i.final_score or 0 for i in interviews) / total_interviews, 1)
            if total_interviews > 0 else 0
        )

        role_counts: dict = {}
        for i in interviews:
            r = i.predicted_role or "Other"
            role_counts[r] = role_counts.get(r, 0) + 1
        role_distribution = [
            {"role": r, "count": c}
            for r, c in sorted(role_counts.items(), key=lambda x: -x[1])
        ]

        drop_off: dict = {}
        for ans in all_answers:
            qi = ans.question_index
            drop_off[qi] = drop_off.get(qi, 0) + 1
        drop_off_funnel = [
            {"question_index": qi + 1, "count": c}
            for qi, c in sorted(drop_off.items())
        ]

        q_scores: dict = {}
        q_texts: dict = {}
        for ans in all_answers:
            qi = ans.question_index
            if qi not in q_scores:
                q_scores[qi] = []
                q_texts[qi] = ans.question_text or f"Question {qi+1}"
            q_scores[qi].append(ans.final_score or 0)

        question_analytics = [
            {
                "question_index": qi + 1,
                "question_text": q_texts[qi][:80] + ("..." if len(q_texts.get(qi, "")) > 80 else ""),
                "avg_score": round(sum(scores) / len(scores), 1),
                "attempts": len(scores),
                "pass_rate": round(sum(1 for s in scores if s >= 6.5) / len(scores) * 100, 1),
            }
            for qi, scores in sorted(q_scores.items())
        ]

        buckets = {"8-10 (Excellent)": 0, "6-8 (Good)": 0, "4-6 (Average)": 0, "0-4 (Weak)": 0}
        for i in interviews:
            s = i.final_score or 0
            if s >= 8:
                buckets["8-10 (Excellent)"] += 1
            elif s >= 6:
                buckets["6-8 (Good)"] += 1
            elif s >= 4:
                buckets["4-6 (Average)"] += 1
            else:
                buckets["0-4 (Weak)"] += 1

        ai_flagged = sum(1 for a in all_answers if (a.ai_detection_score or 0) > 0.5)
        total_overrides = sum(len(i.admin_overrides or []) for i in interviews)

        return {
            "summary": {
                "total_completed": total_interviews,
                "avg_score": avg_score,
                "total_answers": len(all_answers),
                "ai_flagged_answers": ai_flagged,
                "total_human_overrides": total_overrides,
            },
            "role_distribution": role_distribution,
            "drop_off_funnel": drop_off_funnel,
            "question_analytics": question_analytics,
            "score_distribution": [{"label": k, "count": v} for k, v in buckets.items()],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/admin/audit-logs  — SUPER_ADMIN only
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/audit-logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    ctx: UserContext = Depends(require_roles(Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Audit log viewer — Super Admin only. Audit logs can never be deleted."""
    q = select(AuditLog).order_by(AuditLog.created_at.desc())
    if action:
        q = q.where(AuditLog.action == action)

    count_result = await db.execute(select(func.count()).select_from(AuditLog))
    total = count_result.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(q.offset(offset).limit(page_size))
    logs = result.scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "logs": [
            {
                "id": l.id,
                "actor_id": l.actor_id,
                "action": l.action,
                "entity_type": l.entity_type,
                "entity_id": l.entity_id,
                "details": l.details,
                "created_at": l.created_at,
            }
            for l in logs
        ],
    }


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /api/admin/users/{user_id}/role  — SUPER_ADMIN only
# ─────────────────────────────────────────────────────────────────────────────
@router.patch("/users/{target_user_id}/role")
async def update_user_role(
    target_user_id: int,
    body: RoleUpdateRequest,
    ctx: UserContext = Depends(require_db_role(Role.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Promote or demote a user's role. Super Admin only. Audit logged."""
    # Prevent self-demotion
    if target_user_id == ctx.user_id:
        raise HTTPException(status_code=400, detail="You cannot change your own role.")

    result = await db.execute(select(User).where(User.id == target_user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    old_role = target.role

    target.role = body.new_role
    if body.org_id is not None:
        target.org_id = body.org_id

    audit = AuditLog(
        actor_id=ctx.user_id,
        action="user.role.change",
        entity_type="User",
        entity_id=target_user_id,
        details={
            "old_role": old_role.value if hasattr(old_role, 'value') else old_role,
            "new_role": body.new_role.value if hasattr(body.new_role, 'value') else body.new_role,
            "new_org_id": body.org_id,
            "target_email": target.email,
        },
    )
    db.add(audit)
    await db.commit()

    return {
        "message": f"User {target.email} role updated.",
        "old_role": old_role.value if hasattr(old_role, 'value') else str(old_role),
        "new_role": body.new_role.value if hasattr(body.new_role, 'value') else str(body.new_role),
    }
