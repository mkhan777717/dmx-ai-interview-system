from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
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
    Difficulty
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
    db: AsyncSession = Depends(get_db)
):
    """Analyze resume PDF and extract structured data"""
    try:
        if not resume.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Extract text from PDF
        resume_text = extract_text_from_pdf(resume.file)
        
        if not resume_text:
            raise HTTPException(status_code=400, detail="Failed to extract text from PDF")
        
        # Ask AI to extract structured data
        messages = [
            {
                "role": "system",
                "content": """
Extract structured data from resume.

Return strictly JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}
"""
            },
            {
                "role": "user",
                "content": resume_text
            }
        ]
        
        ai_response = await ask_ai(messages)
        parsed = json.loads(ai_response)
        
        return {
            "role": parsed.get("role", ""),
            "experience": parsed.get("experience", ""),
            "projects": parsed.get("projects", []),
            "skills": parsed.get("skills", []),
            "resumeText": resume_text
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-questions")
async def generate_questions(
    request: GenerateQuestionsRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate interview questions"""
    try:
        # Validate input
        role = request.role.strip()
        experience = request.experience.strip()
        mode = request.mode.strip()
        
        if not role or not experience or not mode:
            raise HTTPException(status_code=400, detail="Role, Experience and Mode are required")
        
        # Get user
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.credits < 50:
            raise HTTPException(status_code=400, detail="Not enough credits. Minimum 50 required")
        
        # Prepare prompt
        projects_text = ", ".join(request.projects) if request.projects else "None"
        skills_text = ", ".join(request.skills) if request.skills else "None"
        safe_resume = request.resumeText.strip() if request.resumeText else "None"
        
        user_prompt = f"""
Role: {role}
Experience: {experience}
InterviewMode: {mode}
Projects: {projects_text}
Skills: {skills_text}
Resume: {safe_resume}
"""
        
        messages = [
            {
                "role": "system",
                "content": """
You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are directly talking to the candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:
Question 1 → easy  
Question 2 → easy  
Question 3 → medium  
Question 4 → medium  
Question 5 → hard  

Make questions based on the candidate's role, experience, interviewMode, projects, skills, and resume details.
"""
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ]
        
        # Get AI response
        ai_response = await ask_ai(messages)
        
        if not ai_response:
            raise HTTPException(status_code=500, detail="AI returned empty response")
        
        # Parse questions
        questions_array = [q.strip() for q in ai_response.split("\n") if q.strip()][:5]
        
        if len(questions_array) == 0:
            raise HTTPException(status_code=500, detail="AI failed to generate questions")
        
        # Deduct credits
        user.credits -= 50
        
        # Create interview
        difficulties = [Difficulty.EASY, Difficulty.EASY, Difficulty.MEDIUM, Difficulty.MEDIUM, Difficulty.HARD]
        time_limits = [60, 60, 90, 90, 120]
        
        interview = Interview(
            user_id=int(user_id),
            role=role,
            experience=experience,
            mode=InterviewMode.HR if mode == "HR" else InterviewMode.TECHNICAL,
            resume_text=safe_resume,
            final_score=0.0,
            status=InterviewStatus.INCOMPLETED
        )
        
        db.add(interview)
        await db.flush()
        
        # Add questions
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
                correctness=0.0
            )
            db.add(question)
        
        await db.commit()
        await db.refresh(interview)
        
        # Load questions for response
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
                    "timeLimit": q.time_limit
                }
                for q in interview.questions
            ]
        }
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create interview: {str(e)}")


@router.post("/submit-answer")
async def submit_answer(
    request: SubmitAnswerRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit answer for a question"""
    try:
        # Get interview with questions
        result = await db.execute(
            select(Interview)
            .options(selectinload(Interview.questions))
            .where(Interview.id == request.interviewId)
        )
        interview = result.scalar_one_or_none()
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        if request.questionIndex < 0 or request.questionIndex >= len(interview.questions):
            raise HTTPException(status_code=400, detail="Invalid question index")
        
        question = interview.questions[request.questionIndex]
        
        # If no answer
        if not request.answer:
            question.score = 0
            question.feedback = "You did not submit an answer."
            question.answer = ""
            await db.commit()
            return {"feedback": question.feedback}
        
        # If time exceeded
        if request.timeTaken > question.time_limit:
            question.score = 0
            question.feedback = "Time limit exceeded. Answer not evaluated."
            question.answer = request.answer
            await db.commit()
            return {"feedback": question.feedback}
        
        # Evaluate answer with AI
        messages = [
            {
                "role": "system",
                "content": """
You are a professional human interviewer evaluating a candidate's answer in a real interview.

Evaluate naturally and fairly, like a real person would.

Score the answer in these areas (0 to 10):

1. Confidence – Does the answer sound clear, confident, and well-presented?
2. Communication – Is the language simple, clear, and easy to understand?
3. Correctness – Is the answer accurate, relevant, and complete?

Rules:
- Be realistic and unbiased.
- Do not give random high scores.
- If the answer is weak, score low.
- If the answer is strong and detailed, score high.
- Consider clarity, structure, and relevance.

Calculate:
finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

Feedback Rules:
- Write natural human feedback.
- 10 to 15 words only.
- Sound like real interview feedback.
- Can suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.
- Keep tone professional and honest.

Return ONLY valid JSON in this format:

{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short human feedback"
}
"""
            },
            {
                "role": "user",
                "content": f"""
Question: {question.question}
Answer: {request.answer}
"""
            }
        ]
        
        ai_response = await ask_ai(messages)
        parsed = json.loads(ai_response)
        
        # Update question
        question.answer = request.answer
        question.confidence = parsed["confidence"]
        question.communication = parsed["communication"]
        question.correctness = parsed["correctness"]
        question.score = parsed["finalScore"]
        question.feedback = parsed["feedback"]
        
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
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")


@router.post("/finish")
async def finish_interview(
    request: FinishInterviewRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Finish interview and calculate final scores"""
    try:
        # Get interview with questions
        result = await db.execute(
            select(Interview)
            .options(selectinload(Interview.questions))
            .where(Interview.id == request.interviewId)
        )
        interview = result.scalar_one_or_none()
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        questions = interview.questions
        total_questions = len(questions)
        
        if total_questions == 0:
            raise HTTPException(status_code=400, detail="No questions in interview")
        
        # Calculate averages
        total_score = sum(q.score for q in questions)
        total_confidence = sum(q.confidence for q in questions)
        total_communication = sum(q.communication for q in questions)
        total_correctness = sum(q.correctness for q in questions)
        
        final_score = total_score / total_questions
        avg_confidence = total_confidence / total_questions
        avg_communication = total_communication / total_questions
        avg_correctness = total_correctness / total_questions
        
        # Update interview
        interview.final_score = final_score
        interview.status = InterviewStatus.COMPLETED
        
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
                    "correctness": q.correctness
                }
                for q in questions
            ]
        }
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to finish interview: {str(e)}")


@router.get("/get-interview", response_model=List[InterviewResponse])
async def get_my_interviews(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all interviews for current user"""
    try:
        result = await db.execute(
            select(Interview)
            .where(Interview.user_id == int(user_id))
            .order_by(Interview.created_at.desc())
        )
        interviews = result.scalars().all()
        
        return [
            InterviewResponse(
                id=interview.id,
                role=interview.role,
                experience=interview.experience,
                mode=interview.mode.value,
                finalScore=interview.final_score,
                status=interview.status.value,
                createdAt=interview.created_at
            )
            for interview in interviews
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get interviews: {str(e)}")


@router.get("/report/{interview_id}")
async def get_interview_report(
    interview_id: int,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get interview report"""
    try:
        result = await db.execute(
            select(Interview)
            .options(selectinload(Interview.questions))
            .where(Interview.id == interview_id)
        )
        interview = result.scalar_one_or_none()
        
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        questions = interview.questions
        total_questions = len(questions)
        
        if total_questions == 0:
            raise HTTPException(status_code=400, detail="No questions in interview")
        
        # Calculate averages
        total_confidence = sum(q.confidence for q in questions)
        total_communication = sum(q.communication for q in questions)
        total_correctness = sum(q.correctness for q in questions)
        
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
                    "difficulty": q.difficulty.value,
                    "timeLimit": q.time_limit,
                    "answer": q.answer,
                    "feedback": q.feedback,
                    "score": q.score,
                    "confidence": q.confidence,
                    "communication": q.communication,
                    "correctness": q.correctness
                }
                for q in questions
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get report: {str(e)}")
