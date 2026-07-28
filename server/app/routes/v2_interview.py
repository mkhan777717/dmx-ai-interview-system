"""
V2 Interview Routes

All interview session endpoints: resume parse, JD parse, interview start/submit/finish,
hints, history, reports, rubrics, audit log integration.
"""

import asyncio
from typing import cast, List, Optional, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.orm import selectinload

from app.config.database import get_db
from app.middleware.auth import get_current_user
from app.models.v2_interview import (
    V2Interview, V2Answer, AuditLog,
    ParseResumeResponse, ParseJDResponse,
    StartInterviewRequest, StartInterviewResponse,
    SubmitAnswerRequest, SubmitAnswerResponse,
    FinishInterviewRequest, FinishInterviewResponse,
    HintRequest, HintResponse,
    RubricResponse,
)
from app.services.resume_parser import parse_resume
from app.services.jd_parser import parse_jd
from app.services.question_selector import select_questions, get_harder_question, get_easier_question
from app.services.evaluator import evaluate_answer, generate_llm_feedback
from app.services.rubric_service import resolve_rubric, list_rubrics
from app.services.interview_agent import (
    decide_next_action, get_hiring_recommendation,
    build_skill_breakdown, get_strengths_weaknesses,
    generate_improvement_plan,
)
from app.services.followup_generator import generate_follow_up
from app.services.ai_detection_service import detect_ai_answer

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _write_audit(
    db: AsyncSession,
    actor_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    details: dict,
) -> None:
    """Append an audit log entry. Swallows errors silently — never block the main flow."""
    try:
        log = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
        db.add(log)
        await db.flush()
    except Exception as e:
        print(f"Audit log write failed (non-fatal): {e}")


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/v2/rubrics
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/rubrics")
async def get_rubrics():
    """Return all available rubric definitions."""
    return list_rubrics()


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/v2/interview/history
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/interview/history")
async def get_interview_history(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get interview history for the current user."""
    try:
        result = await db.execute(
            select(V2Interview)
            .where(V2Interview.user_id == int(user_id))
            .order_by(V2Interview.created_at.desc())
        )
        interviews = result.scalars().all()

        return [
            {
                "_id": str(i.id),
                "role": i.predicted_role,
                "mode": i.interview_mode or "Technical",
                "experience": "N/A",
                "finalScore": i.final_score,
                "status": i.status,
                "createdAt": i.created_at,
                "rubric_id": i.rubric_id,
                "percentile": i.percentile,
                "integrity_flags": i.integrity_flags or [],
            }
            for i in interviews
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/v2/resume/parse
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/resume/parse", response_model=ParseResumeResponse)
async def parse_resume_endpoint(
    resume: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    """Upload a PDF resume and get structured data + predicted role."""
    if not resume.filename or not resume.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await resume.read()
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = await parse_resume(pdf_bytes)
        return ParseResumeResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/v2/jd/parse
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/jd/parse", response_model=ParseJDResponse)
async def parse_jd_endpoint(
    jd_text: str = Body(..., embed=True),
    user_id: str = Depends(get_current_user),
):
    """Parse a job description text and extract skills, role, and requirements."""
    if not jd_text or not jd_text.strip():
        raise HTTPException(status_code=400, detail="Job description text is required.")

    try:
        result = await parse_jd(jd_text)
        return ParseJDResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD parsing failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/v2/interview/start
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/interview/start", response_model=StartInterviewResponse)
async def start_interview(
    body: StartInterviewRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Select personalized questions and create an interview session."""
    try:
        # ── Merge resume skills + JD skills ──────────────────────────────────
        merged_skills = list(set(body.skills + body.jd_skills))

        # ── Resolve rubric ────────────────────────────────────────────────────
        rubric = resolve_rubric(
            interview_mode=body.interview_mode,
            predicted_role=body.jd_role or body.predicted_role,
            rubric_id=body.rubric_id,
        )

        # ── Select questions ──────────────────────────────────────────────────
        questions = select_questions(
            predicted_role=body.jd_role or body.predicted_role,
            skills=merged_skills,
            interview_mode=body.interview_mode,
        )

        if not questions:
            raise HTTPException(
                status_code=500, detail="Could not select questions from the bank."
            )

        interview = V2Interview(
            user_id=int(user_id),
            predicted_role=body.predicted_role,
            candidate_name=body.name,
            candidate_email=body.email,
            candidate_skills=merged_skills,
            questions=questions,
            status="in_progress",
            consecutive_good=0,
            current_question_index=0,
            interview_mode=body.interview_mode,
            jd_skills=body.jd_skills,
            jd_role=body.jd_role,
            rubric_id=rubric["id"],
            rubric_version=rubric["version"],
            integrity_flags=[],
        )
        db.add(interview)
        await db.flush()

        await _write_audit(
            db, int(user_id), "interview.started",
            "V2Interview", cast(int, interview.id),
            {"role": body.predicted_role, "mode": body.interview_mode, "rubric": rubric["id"]},
        )

        await db.commit()
        await db.refresh(interview)

        # Strip reference_answer before sending to client
        safe_questions = [
            {k: v for k, v in q.items() if k != "reference_answer"}
            for q in questions
        ]

        return StartInterviewResponse(
            interview_id=cast(int, interview.id),
            predicted_role=cast(str, interview.predicted_role),
            candidate_name=cast(Optional[str], interview.candidate_name),
            questions=safe_questions,
            rubric_id=rubric["id"],
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/v2/interview/hint
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/interview/hint", response_model=HintResponse)
async def get_question_hint(
    body: HintRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a helpful hint tailored to the current question."""
    try:
        result = await db.execute(
            select(V2Interview).where(V2Interview.id == body.interview_id)
        )
        interview = result.scalar_one_or_none()

        if not interview:
            raise HTTPException(status_code=404, detail="Interview session not found.")

        questions = cast(list, interview.questions or [])
        q_index = body.question_index

        if q_index < 0 or q_index >= len(questions):
            raise HTTPException(status_code=400, detail="Invalid question index.")

        current_q = questions[q_index]
        eval_points = current_q.get("evaluation_points", [])
        keywords = current_q.get("keywords", [])
        topic = current_q.get("topic", "General")

        if eval_points:
            hint = f"Focus your answer on explaining key concepts like '{eval_points[0]}'"
            if len(eval_points) > 1:
                hint += f" and '{eval_points[1]}'."
            else:
                hint += "."
        elif keywords:
            hint = f"Consider including terms such as {', '.join(keywords[:3])} in your explanation."
        else:
            hint = f"Structure your response clearly around standard {topic} principles with a real-world example."

        return HintResponse(hint=hint)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate hint: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/v2/interview/submit
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/interview/submit", response_model=SubmitAnswerResponse)
async def submit_answer(
    body: SubmitAnswerRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit an answer (main or follow-up).
    - Evaluates using Sentence Transformers with rubric-defined weights
    - Computes confidence and justification
    - Calls LLM for personalized feedback (with timeout fallback to template)
    - Decides next action (follow_up / next_question / finish)
    - If consecutive_good >= 2: swaps next question to harder difficulty (adaptive)
    - Accumulates integrity flags from client
    """
    try:
        # ── Fetch interview ───────────────────────────────────────────────────
        result = await db.execute(
            select(V2Interview).where(V2Interview.id == body.interview_id)
        )
        interview = result.scalar_one_or_none()

        if not interview:
            raise HTTPException(status_code=404, detail="Interview session not found.")
        if interview.status == "completed":
            raise HTTPException(status_code=400, detail="Interview already completed.")

        questions = list(cast(list, interview.questions or []))  # mutable copy
        q_index = body.question_index

        if q_index < 0 or q_index >= len(questions):
            raise HTTPException(status_code=400, detail="Invalid question index.")

        current_q = questions[q_index]

        # ── Resolve rubric weights ────────────────────────────────────────────
        rubric = resolve_rubric(
            interview_mode=cast(str, interview.interview_mode or "Technical"),
            predicted_role=cast(str, interview.predicted_role or ""),
            rubric_id=cast(str, interview.rubric_id or "auto"),
        )
        weights = rubric.get("weights", {"semantic": 0.50, "concept": 0.35, "keyword": 0.15})

        # ── Evaluate answer ───────────────────────────────────────────────────
        eval_result = evaluate_answer(
            candidate_answer=body.answer,
            reference_answer=current_q["reference_answer"],
            evaluation_points=current_q.get("evaluation_points", []),
            keywords=current_q.get("keywords", []),
            weights=weights,
        )

        # ── LLM feedback (attempt with timeout, fall back to template) ────────
        try:
            llm_fb = await asyncio.wait_for(
                generate_llm_feedback(
                    question=current_q["question"],
                    candidate_answer=body.answer,
                    score=eval_result["final_score"],
                    missing_concepts=eval_result["missing_concepts"],
                ),
                timeout=8.0,
            )
            if llm_fb:
                eval_result["feedback"] = llm_fb
        except (asyncio.TimeoutError, Exception):
            pass  # Keep template feedback

        # ── Accumulate integrity flags ────────────────────────────────────────
        existing_flags = list(cast(list, interview.integrity_flags or []))
        if body.integrity_flags:
            existing_flags.extend(body.integrity_flags)
            interview.integrity_flags = existing_flags

        # ── Handle follow-up submission ───────────────────────────────────────
        if body.is_follow_up:
            ans_result = await db.execute(
                select(V2Answer).where(
                    V2Answer.interview_id == body.interview_id,
                    V2Answer.question_index == q_index,
                )
            )
            existing_ans = ans_result.scalar_one_or_none()
            if existing_ans:
                existing_ans.followup_answer = body.answer
                existing_ans.followup_score = eval_result["final_score"]
                await db.commit()

            next_q_index = q_index + 1
            is_last = next_q_index >= len(questions)
            next_action = "finish" if is_last else "next_question"

            return SubmitAnswerResponse(
                question_index=q_index,
                final_score=eval_result["final_score"],
                semantic_score=eval_result["semantic_score"],
                concept_score=eval_result["concept_score"],
                keyword_score=eval_result["keyword_score"],
                covered_concepts=eval_result["covered_concepts"],
                missing_concepts=eval_result["missing_concepts"],
                feedback=eval_result["feedback"],
                confidence=eval_result["confidence"],
                justification=eval_result.get("justification"),
                next_action=next_action,
                follow_up_question=None,
                questions_remaining=max(0, len(questions) - next_q_index),
            )

        # Run AI detection (pure heuristic, no external calls)
        ai_result = detect_ai_answer(
            answer=body.answer,
            question_category=current_q.get("category", "Technical"),
            expected_time_seconds=current_q.get("estimated_time_seconds", 90),
        )

        # Save main answer
        answer_row = V2Answer(
            interview_id=interview.id,
            question_index=q_index,
            question_text=current_q["question"],
            skill=current_q.get("skill", ""),
            topic=current_q.get("topic", ""),
            difficulty=current_q.get("difficulty", ""),
            candidate_answer=body.answer,
            semantic_score=eval_result["semantic_score"],
            concept_score=eval_result["concept_score"],
            keyword_score=eval_result["keyword_score"],
            final_score=eval_result["final_score"],
            covered_concepts=eval_result["covered_concepts"],
            missing_concepts=eval_result["missing_concepts"],
            feedback=eval_result["feedback"],
            confidence=eval_result["confidence"],
            justification=eval_result.get("justification"),
            communication_score=eval_result.get("communication_score"),
            communication_breakdown=eval_result.get("communication_breakdown"),
            ai_detection_score=ai_result["ai_probability"],
            ai_detection_flags=ai_result["flags"],
        )
        db.add(answer_row)
        await db.flush()


        # ── Interview agent decision ───────────────────────────────────────────
        agent = decide_next_action(
            current_score=eval_result["final_score"],
            question_index=q_index,
            total_planned=len(questions),
            consecutive_good=cast(int, interview.consecutive_good or 0),
            has_follow_up_been_asked=False,
            missing_concepts=eval_result["missing_concepts"],
        )

        # ── Generate follow-up if needed ──────────────────────────────────────
        follow_up_question = None
        if agent["trigger_follow_up"]:
            follow_up_question = await generate_follow_up(
                question=current_q["question"],
                candidate_answer=body.answer,
                missing_concepts=eval_result["missing_concepts"],
            )
            answer_row.had_followup = True
            answer_row.followup_question = follow_up_question

        # ── Adaptive difficulty swap ──────────────────────────────────────────
        swapped_question = None
        new_consecutive_good = agent["new_consecutive_good"]

        if not agent["trigger_follow_up"] and not agent["action"] == "finish":
            next_q_idx = q_index + 1
            if next_q_idx < len(questions):
                next_q = questions[next_q_idx]
                next_category = next_q.get("category", "Technical")
                next_difficulty = next_q.get("difficulty", "Medium")

                # Only swap technical questions (not behavioral)
                if next_category != "Behavioral":
                    excluded_ids = [q.get("id", 0) for q in questions]
                    current_skills = interview.candidate_skills or []

                    if new_consecutive_good >= 2:
                        # Upgrade: try to provide a harder question
                        harder = get_harder_question(
                            predicted_role=cast(str, interview.predicted_role or ""),
                            skills=cast(List[str], current_skills or []),
                            current_difficulty=next_difficulty,
                            excluded_ids=excluded_ids,
                            current_topic=next_q.get("topic", ""),
                        )
                        if harder:
                            questions[next_q_idx] = harder
                            swapped_question = {k: v for k, v in harder.items() if k != "reference_answer"}
                            swapped_question["swap_reason"] = "difficulty_increased"
                            interview.questions = questions
                            interview.consecutive_good = 0  # reset after swap

                    elif eval_result["final_score"] < 4.0 and new_consecutive_good == 0:
                        # Downgrade: candidate struggling — try easier
                        easier = get_easier_question(
                            predicted_role=cast(str, interview.predicted_role or ""),
                            skills=cast(List[str], current_skills or []),
                            current_difficulty=next_difficulty,
                            excluded_ids=excluded_ids,
                            current_topic=next_q.get("topic", ""),
                        )
                        if easier:
                            questions[next_q_idx] = easier
                            swapped_question = {k: v for k, v in easier.items() if k != "reference_answer"}
                            swapped_question["swap_reason"] = "difficulty_decreased"
                            interview.questions = questions

        # ── Update interview state ────────────────────────────────────────────
        interview.consecutive_good = new_consecutive_good
        if not agent["trigger_follow_up"]:
            interview.current_question_index = q_index + 1

        await _write_audit(
            db, int(user_id), "answer.submitted",
            "V2Answer", answer_row.id,
            {
                "interview_id": cast(int, interview.id),
                "question_index": q_index,
                "score": eval_result["final_score"],
                "confidence": eval_result["confidence"],
                "next_action": agent["action"],
            },
        )

        await db.commit()

        questions_remaining = max(0, len(questions) - (q_index + 1))

        return SubmitAnswerResponse(
            question_index=q_index,
            final_score=eval_result["final_score"],
            semantic_score=eval_result["semantic_score"],
            concept_score=eval_result["concept_score"],
            keyword_score=eval_result["keyword_score"],
            covered_concepts=eval_result["covered_concepts"],
            missing_concepts=eval_result["missing_concepts"],
            feedback=eval_result["feedback"],
            confidence=eval_result["confidence"],
            justification=eval_result.get("justification"),
            next_action=agent["action"],
            follow_up_question=follow_up_question,
            questions_remaining=questions_remaining,
            swapped_question=swapped_question,
        )

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/v2/interview/finish
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/interview/finish", response_model=FinishInterviewResponse)
async def finish_interview(
    body: FinishInterviewRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate scores, compute percentile, generate report, mark interview completed."""
    try:
        result = await db.execute(
            select(V2Interview)
            .options(selectinload(V2Interview.answers))
            .where(V2Interview.id == body.interview_id)
        )
        interview = result.scalar_one_or_none()

        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found.")

        # Accumulate final integrity flags
        existing_flags = list(cast(list, interview.integrity_flags or []))
        if body.integrity_flags:
            existing_flags.extend(body.integrity_flags)
            interview.integrity_flags = existing_flags

        # If already completed, return saved report
        if interview.status == "completed" and interview.report:
            await db.commit()
            rep = cast(dict, interview.report)
            return FinishInterviewResponse(
                interview_id=cast(int, interview.id),
                overall_score=rep.get("overall_score", 0.0),
                hiring_recommendation=rep.get("hiring_recommendation", "Borderline"),
                recommendation_color=rep.get("recommendation_color", "yellow"),
                skill_breakdown=rep.get("skill_breakdown", {}),
                strengths=rep.get("strengths", []),
                weaknesses=rep.get("weaknesses", []),
                questions=rep.get("questions", []),
                percentile=rep.get("percentile"),
                integrity_flags=existing_flags,
            )

        answers = cast(list, interview.answers or [])

        # ── Aggregate scores ──────────────────────────────────────────────────
        answers_data = [
            {
                "question": a.question_text,
                "topic": a.topic,
                "difficulty": a.difficulty,
                "skill": a.skill,
                "score": a.final_score,
                "final_score": a.final_score,
                "semantic_score": a.semantic_score,
                "concept_score": a.concept_score,
                "covered_concepts": a.covered_concepts or [],
                "missing_concepts": a.missing_concepts or [],
                "feedback": a.feedback,
                "confidence": a.confidence or 0.0,
                "justification": a.justification,
                "candidate_answer": a.candidate_answer,
                "had_followup": a.had_followup,
                "followup_question": a.followup_question,
                "followup_score": a.followup_score,
            }
            for a in sorted(answers, key=lambda x: getattr(x, "question_index", 0))
        ]

        if answers_data:
            overall_score = round(
                sum(float(a["final_score"]) for a in answers_data) / len(answers_data), 1
            )
        else:
            overall_score = 0.0

        hiring = get_hiring_recommendation(overall_score)
        skill_breakdown = build_skill_breakdown(answers_data)
        sw = get_strengths_weaknesses(answers_data)

        # ── Compute peer percentile ────────────────────────────────────────────
        percentile = None
        try:
            peer_result = await db.execute(
                select(V2Interview.final_score)
                .where(
                    V2Interview.status == "completed",
                    V2Interview.predicted_role == interview.predicted_role,
                    V2Interview.id != interview.id,
                )
            )
            peer_scores = [row[0] for row in peer_result.fetchall() if row[0] is not None]

            if peer_scores:
                below = sum(1 for s in peer_scores if s < overall_score)
                percentile = round((below / len(peer_scores)) * 100, 1)
            else:
                percentile = None  # Not enough peers yet
        except Exception as pe:
            print(f"Percentile computation failed (non-fatal): {pe}")

        # Generate personalized improvement plan
        improvement_plan = generate_improvement_plan(answers_data)

        # Compute average communication score
        comm_scores = [
            float(a.get("communication_score", 0) or 0)
            for a in answers_data
            if a.get("communication_score") is not None
        ]
        avg_communication = round(sum(comm_scores) / len(comm_scores), 3) if comm_scores else None

        # AI detection summary
        ai_flagged_count = sum(
            1 for a in answers_data
            if float(a.get("ai_detection_score") or 0) > 0.5
        )

        report = {
            "overall_score": overall_score,
            "hiring_recommendation": hiring["recommendation"],
            "recommendation_color": hiring["color"],
            "skill_breakdown": skill_breakdown,
            "strengths": sw["strengths"],
            "weaknesses": sw["weaknesses"],
            "questions": answers_data,
            "percentile": percentile,
            "integrity_flags": existing_flags,
            "improvement_plan": improvement_plan,
            "avg_communication_score": avg_communication,
            "ai_flagged_count": ai_flagged_count,
        }

        # Persist report
        interview.final_score = overall_score
        interview.status = "completed"
        interview.report = report
        interview.percentile = percentile
        interview.improvement_plan = improvement_plan

        await _write_audit(
            db, int(user_id), "interview.completed",
            "V2Interview", cast(int, interview.id),
            {
                "overall_score": overall_score,
                "recommendation": hiring["recommendation"],
                "percentile": percentile,
                "integrity_flag_count": len(existing_flags),
                "rubric_id": interview.rubric_id,
                "ai_flagged_count": ai_flagged_count,
            },
        )

        await db.commit()

        return FinishInterviewResponse(
            interview_id=cast(int, interview.id),
            overall_score=overall_score,
            hiring_recommendation=hiring["recommendation"],
            recommendation_color=hiring["color"],
            skill_breakdown=skill_breakdown,
            strengths=sw["strengths"],
            weaknesses=sw["weaknesses"],
            questions=answers_data,
            percentile=percentile,
            integrity_flags=existing_flags,
        )


    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to finish interview: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/v2/interview/report/{interview_id}
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/interview/report/{interview_id}")
async def get_report(
    interview_id: int,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch a previously completed interview report."""
    result = await db.execute(
        select(V2Interview).where(V2Interview.id == interview_id)
    )
    interview = result.scalar_one_or_none()

    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")
    if not interview.report:
        raise HTTPException(status_code=400, detail="Report not generated yet.")

    report_data = cast(dict, interview.report)
    return {
        "interview_id": interview_id,
        "predicted_role": interview.predicted_role,
        "candidate_name": interview.candidate_name,
        "rubric_id": interview.rubric_id,
        "percentile": interview.percentile,
        "integrity_flags": interview.integrity_flags or [],
        **report_data,
    }
