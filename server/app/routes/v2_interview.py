from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.config.database import get_db
from app.middleware.auth import get_current_user
from app.models.v2_interview import (
    V2Interview, V2Answer,
    ParseResumeResponse, StartInterviewRequest, StartInterviewResponse,
    SubmitAnswerRequest, SubmitAnswerResponse,
    FinishInterviewRequest, FinishInterviewResponse,
)
from app.services.resume_parser import parse_resume
from app.services.question_selector import select_questions
from app.services.evaluator import evaluate_answer
from app.services.interview_agent import (
    decide_next_action, get_hiring_recommendation,
    build_skill_breakdown, get_strengths_weaknesses,
)
from app.services.followup_generator import generate_follow_up

router = APIRouter()

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
                "mode": "Technical", # V2 doesn't store mode explicitly on model yet, default to Technical
                "experience": "N/A",
                "finalScore": i.final_score,
                "status": i.status,
                "createdAt": i.created_at,
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
    if not resume.filename.endswith(".pdf"):
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
# POST /api/v2/interview/start
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/interview/start", response_model=StartInterviewResponse)
async def start_interview(
    body: StartInterviewRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Select 5 personalized questions and create an interview session."""
    try:
        questions = select_questions(
            predicted_role=body.predicted_role,
            skills=body.skills,
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
            candidate_skills=body.skills,
            questions=questions,
            status="in_progress",
            consecutive_good=0,
            current_question_index=0,
        )
        db.add(interview)
        await db.commit()
        await db.refresh(interview)

        # Strip reference_answer from what we send to the client
        safe_questions = [
            {k: v for k, v in q.items() if k != "reference_answer"}
            for q in questions
        ]

        return StartInterviewResponse(
            interview_id=interview.id,
            predicted_role=interview.predicted_role,
            candidate_name=interview.candidate_name,
            questions=safe_questions,
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


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
    Submit an answer (or follow-up answer).
    - Evaluates locally with Sentence Transformers
    - Decides next action (follow_up / next_question / finish)
    - If follow_up needed: calls AI to generate targeted question
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

        questions = interview.questions
        q_index = body.question_index

        if q_index < 0 or q_index >= len(questions):
            raise HTTPException(status_code=400, detail="Invalid question index.")

        current_q = questions[q_index]

        # ── Evaluate answer ───────────────────────────────────────────────────
        eval_result = evaluate_answer(
            candidate_answer=body.answer,
            reference_answer=current_q["reference_answer"],
            evaluation_points=current_q.get("evaluation_points", []),
            keywords=current_q.get("keywords", []),
        )

        # ── Handle follow-up submission ───────────────────────────────────────
        if body.is_follow_up:
            # Update the existing answer row with follow-up data
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

            # After follow-up, always move to next question
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
                next_action=next_action,
                follow_up_question=None,
                questions_remaining=max(0, len(questions) - next_q_index),
            )

        # ── Save main answer ──────────────────────────────────────────────────
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
        )
        db.add(answer_row)
        await db.flush()

        # ── Interview agent decision ───────────────────────────────────────────
        agent = decide_next_action(
            current_score=eval_result["final_score"],
            question_index=q_index,
            total_planned=len(questions),
            consecutive_good=interview.consecutive_good,
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

        # ── Update interview state ────────────────────────────────────────────
        interview.consecutive_good = agent["new_consecutive_good"]
        if not agent["trigger_follow_up"]:
            interview.current_question_index = q_index + 1

        await db.commit()

        next_q_index = q_index + 1 if not agent["trigger_follow_up"] else q_index
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
            next_action=agent["action"],
            follow_up_question=follow_up_question,
            questions_remaining=questions_remaining,
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
    """Aggregate scores, generate report, mark interview completed."""
    try:
        result = await db.execute(
            select(V2Interview)
            .options(selectinload(V2Interview.answers))
            .where(V2Interview.id == body.interview_id)
        )
        interview = result.scalar_one_or_none()

        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found.")

        answers = interview.answers
        if not answers:
            raise HTTPException(status_code=400, detail="No answers submitted yet.")

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
                "candidate_answer": a.candidate_answer,
                "had_followup": a.had_followup,
                "followup_question": a.followup_question,
                "followup_score": a.followup_score,
            }
            for a in sorted(answers, key=lambda x: x.question_index)
        ]

        overall_score = round(
            sum(a["final_score"] for a in answers_data) / len(answers_data), 1
        )
        hiring = get_hiring_recommendation(overall_score)
        skill_breakdown = build_skill_breakdown(answers_data)
        sw = get_strengths_weaknesses(answers_data)

        report = {
            "overall_score": overall_score,
            "hiring_recommendation": hiring["recommendation"],
            "recommendation_color": hiring["color"],
            "skill_breakdown": skill_breakdown,
            "strengths": sw["strengths"],
            "weaknesses": sw["weaknesses"],
            "questions": answers_data,
        }

        # ── Persist report ────────────────────────────────────────────────────
        interview.final_score = overall_score
        interview.status = "completed"
        interview.report = report
        await db.commit()

        return FinishInterviewResponse(
            interview_id=interview.id,
            overall_score=overall_score,
            hiring_recommendation=hiring["recommendation"],
            recommendation_color=hiring["color"],
            skill_breakdown=skill_breakdown,
            strengths=sw["strengths"],
            weaknesses=sw["weaknesses"],
            questions=answers_data,
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

    return {
        "interview_id": interview_id,
        "predicted_role": interview.predicted_role,
        "candidate_name": interview.candidate_name,
        **interview.report,
    }
