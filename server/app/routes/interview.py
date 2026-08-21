from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List
import json

from app.models.interview import (
    GenerateQuestionsRequest,
    SubmitAnswerRequest,
    FinishInterviewRequest,
    InterviewResponse,
    Interview,
    Question,
    InterviewMode,
    InterviewStatus,
    Difficulty,
)
from app.models.user import User
from app.config.database import get_db
from app.middleware.auth import get_current_user
from app.services.openrouter_service import ask_ai
from app.services.pdf_service import extract_text_from_pdf

router = APIRouter()


@router.post("/resume")
async def analyze_resume(
    resume: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Analyze resume PDF and extract structured data."""
    try:
        filename: str = resume.filename or ""
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        resume_text = extract_text_from_pdf(resume.file)  # type: ignore[arg-type]

        if not resume_text:
            raise HTTPException(status_code=400, detail="Failed to extract text from PDF")

        messages = [
            {
                "role": "system",
                "content": (
                    "Extract structured data from resume.\n\n"
                    "Return strictly JSON:\n\n"
                    '{\n  "role": "string",\n  "experience": "string",\n'
                    '  "projects": ["project1"],\n  "skills": ["skill1"]\n}'
                ),
            },
            {"role": "user", "content": resume_text},
        ]

        ai_response = await ask_ai(messages)
        parsed = json.loads(ai_response)

        return {
            "role": parsed.get("role", ""),
            "experience": parsed.get("experience", ""),
            "projects": parsed.get("projects", []),
            "skills": parsed.get("skills", []),
            "resumeText": resume_text,
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-questions")
async def generate_questions(
    request: GenerateQuestionsRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate interview questions and create an interview session."""
    try:
        role = request.role.strip()
        experience = request.experience.strip()
        mode = request.mode.strip()

        if not role or not experience or not mode:
            raise HTTPException(status_code=400, detail="Role, Experience and Mode are required")

        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if int(user.credits) < 50:  # type: ignore[arg-type]
            raise HTTPException(status_code=400, detail="Not enough credits. Minimum 50 required")

        projects_text = ", ".join(request.projects) if request.projects else "None"
        skills_text = ", ".join(request.skills) if request.skills else "None"
        safe_resume = request.resumeText.strip() if request.resumeText else "None"

        user_prompt = (
            f"Role: {role}\nExperience: {experience}\nInterviewMode: {mode}\n"
            f"Projects: {projects_text}\nSkills: {skills_text}\nResume: {safe_resume}"
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a real human interviewer conducting a professional interview.\n\n"
                    "Generate exactly 5 interview questions.\n\n"
                    "Strict Rules:\n"
                    "- Each question must contain between 15 and 25 words.\n"
                    "- Each question must be a single complete sentence.\n"
                    "- Do NOT number them. Do NOT add explanations.\n"
                    "- One question per line only.\n"
                    "- Difficulty: Q1=easy, Q2=easy, Q3=medium, Q4=medium, Q5=hard."
                ),
            },
            {"role": "user", "content": user_prompt},
        ]

        ai_response = await ask_ai(messages)

        if not ai_response:
            raise HTTPException(status_code=500, detail="AI returned empty response")

        questions_array = [q.strip() for q in ai_response.split("\n") if q.strip()][:5]

        if not questions_array:
            raise HTTPException(status_code=500, detail="AI failed to generate questions")

        # Deduct credits (use direct field assignment pattern for SQLAlchemy)
        current_credits = int(user.credits)  # type: ignore[arg-type]
        user.credits = current_credits - 50  # type: ignore[assignment]

        difficulties = [Difficulty.EASY, Difficulty.EASY, Difficulty.MEDIUM, Difficulty.MEDIUM, Difficulty.HARD]
        time_limits = [60, 60, 90, 90, 120]

        interview = Interview(
            user_id=int(user_id),
            role=role,
            experience=experience,
            mode=InterviewMode.HR if mode == "HR" else InterviewMode.TECHNICAL,
            resume_text=safe_resume,
            final_score=0.0,
            status=InterviewStatus.INCOMPLETED,
        )

        db.add(interview)
        await db.flush()

        for i, q_text in enumerate(questions_array):
            question = Question(
                interview_id=interview.id,
                question=q_text,
                difficulty=difficulties[i],
                time_limit=time_limits[i],
                answer="",
                feedback="",
                score=0.0,
                confidence=0.0,
                communication=0.0,
                correctness=0.0,
            )
            db.add(question)

        await db.commit()
        await db.refresh(interview)

        result = await db.execute(
            select(Interview)
            .options(selectinload(Interview.questions))
            .where(Interview.id == interview.id)
        )
        interview = result.scalar_one()

        return {
            "interviewId": interview.id,
            "creditsLeft": user.credits,
            "userName": user.name,
            "questions": [
                {
                    "question": q.question,
                    "difficulty": q.difficulty.value,
                    "timeLimit": q.time_limit,
                }
                for q in interview.questions
            ],
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create interview: {e}")


@router.post("/submit-answer")
async def submit_answer(
    request: SubmitAnswerRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Evaluate and store a candidate's answer for a single question."""
    try:
        result = await db.execute(
            select(Interview)
            .options(selectinload(Interview.questions))
            .where(Interview.id == request.interviewId)
        )
        interview = result.scalar_one_or_none()

        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        qs = list(interview.questions)  # materialise to plain list for len/index

        if request.questionIndex < 0 or request.questionIndex >= len(qs):
            raise HTTPException(status_code=400, detail="Invalid question index")

        question = qs[request.questionIndex]

        if not request.answer:
            question.score = 0  # type: ignore[assignment]
            question.feedback = "You did not submit an answer."  # type: ignore[assignment]
            question.answer = ""  # type: ignore[assignment]
            await db.commit()
            return {"feedback": question.feedback}

        if request.timeTaken > question.time_limit:  # type: ignore[operator]
            question.score = 0  # type: ignore[assignment]
            question.feedback = "Time limit exceeded. Answer not evaluated."  # type: ignore[assignment]
            question.answer = request.answer  # type: ignore[assignment]
            await db.commit()
            return {"feedback": question.feedback}

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a professional human interviewer evaluating a candidate's answer.\n\n"
                    "Score the answer in three areas (0–10):\n"
                    "1. confidence – clarity and confidence\n"
                    "2. communication – simplicity and structure\n"
                    "3. correctness – accuracy and completeness\n\n"
                    "finalScore = average of the three (rounded to nearest whole number).\n"
                    "feedback = 10–15 words of honest human interview feedback.\n\n"
                    "Return ONLY valid JSON:\n"
                    '{"confidence": n, "communication": n, "correctness": n, '
                    '"finalScore": n, "feedback": "..."}'
                ),
            },
            {
                "role": "user",
                "content": f"Question: {question.question}\nAnswer: {request.answer}",
            },
        ]

        ai_response = await ask_ai(messages)
        parsed = json.loads(ai_response)

        question.answer = request.answer  # type: ignore[assignment]
        question.confidence = parsed["confidence"]  # type: ignore[assignment]
        question.communication = parsed["communication"]  # type: ignore[assignment]
        question.correctness = parsed["correctness"]  # type: ignore[assignment]
        question.score = parsed["finalScore"]  # type: ignore[assignment]
        question.feedback = parsed["feedback"]  # type: ignore[assignment]

        await db.commit()

        return {"feedback": parsed["feedback"]}

    except json.JSONDecodeError:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {e}")


@router.post("/finish")
async def finish_interview(
    request: FinishInterviewRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Finish interview, calculate final scores, and persist results."""
    try:
        result = await db.execute(
            select(Interview)
            .options(selectinload(Interview.questions))
            .where(Interview.id == request.interviewId)
        )
        interview = result.scalar_one_or_none()

        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        questions = list(interview.questions)
        total_questions = len(questions)

        if total_questions == 0:
            raise HTTPException(status_code=400, detail="No questions in interview")

        total_score = sum(float(q.score) for q in questions)  # type: ignore[arg-type]
        total_confidence = sum(float(q.confidence) for q in questions)  # type: ignore[arg-type]
        total_communication = sum(float(q.communication) for q in questions)  # type: ignore[arg-type]
        total_correctness = sum(float(q.correctness) for q in questions)  # type: ignore[arg-type]

        final_score = total_score / total_questions
        avg_confidence = total_confidence / total_questions
        avg_communication = total_communication / total_questions
        avg_correctness = total_correctness / total_questions

        interview.final_score = final_score  # type: ignore[assignment]
        interview.status = InterviewStatus.COMPLETED  # type: ignore[assignment]

        await db.commit()

        return {
            "finalScore": round(final_score, 1),
            "confidence": round(avg_confidence, 1),
            "communication": round(avg_communication, 1),
            "correctness": round(avg_correctness, 1),
            "questionWiseScore": [
                {
                    "question": q.question,
                    "score": q.score,
                    "feedback": q.feedback,
                    "confidence": q.confidence,
                    "communication": q.communication,
                    "correctness": q.correctness,
                }
                for q in questions
            ],
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to finish interview: {e}")


@router.get("/get-interview", response_model=List[InterviewResponse])
async def get_my_interviews(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all interviews for the current user."""
    try:
        result = await db.execute(
            select(Interview)
            .where(Interview.user_id == int(user_id))
            .order_by(Interview.created_at.desc())
        )
        interviews = result.scalars().all()

        return [
            InterviewResponse(
                id=int(interview.id),  # type: ignore[arg-type]
                role=str(interview.role),  # type: ignore[arg-type]
                experience=str(interview.experience),  # type: ignore[arg-type]
                mode=str(interview.mode.value),  # type: ignore[union-attr]
                finalScore=float(interview.final_score),  # type: ignore[arg-type]
                status=str(interview.status.value),  # type: ignore[union-attr]
                createdAt=interview.created_at,  # type: ignore[arg-type]
            )
            for interview in interviews
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get interviews: {e}")


@router.get("/report/{interview_id}")
async def get_interview_report(
    interview_id: int,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full interview report with per-question breakdown."""
    try:
        result = await db.execute(
            select(Interview)
            .options(selectinload(Interview.questions))
            .where(Interview.id == interview_id)
        )
        interview = result.scalar_one_or_none()

        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        questions = list(interview.questions)
        total_questions = len(questions)

        if total_questions == 0:
            raise HTTPException(status_code=400, detail="No questions in interview")

        total_confidence = sum(float(q.confidence) for q in questions)  # type: ignore[arg-type]
        total_communication = sum(float(q.communication) for q in questions)  # type: ignore[arg-type]
        total_correctness = sum(float(q.correctness) for q in questions)  # type: ignore[arg-type]

        avg_confidence = total_confidence / total_questions
        avg_communication = total_communication / total_questions
        avg_correctness = total_correctness / total_questions

        return {
            "finalScore": interview.final_score,
            "confidence": round(avg_confidence, 1),
            "communication": round(avg_communication, 1),
            "correctness": round(avg_correctness, 1),
            "questionWiseScore": [
                {
                    "question": q.question,
                    "difficulty": q.difficulty.value,  # type: ignore[union-attr]
                    "timeLimit": q.time_limit,
                    "answer": q.answer,
                    "feedback": q.feedback,
                    "score": q.score,
                    "confidence": q.confidence,
                    "communication": q.communication,
                    "correctness": q.correctness,
                }
                for q in questions
            ],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get report: {e}")
