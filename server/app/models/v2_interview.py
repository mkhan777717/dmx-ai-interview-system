from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    ForeignKey, Text, JSON, Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, List, Any
from app.config.database import Base


# ── SQLAlchemy ORM Models ─────────────────────────────────────────────────────

class V2Interview(Base):
    __tablename__ = "v2_interviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    predicted_role = Column(String, nullable=False)
    candidate_name = Column(String, nullable=True)
    candidate_email = Column(String, nullable=True)
    candidate_skills = Column(JSON, default=list)
    questions = Column(JSON, default=list)          # Full 5-question list with metadata
    status = Column(String, default="in_progress")  # in_progress | completed
    consecutive_good = Column(Integer, default=0)
    current_question_index = Column(Integer, default=0)
    final_score = Column(Float, default=0.0)
    report = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    answers = relationship(
        "V2Answer", back_populates="interview", cascade="all, delete-orphan"
    )


class V2Answer(Base):
    __tablename__ = "v2_answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    interview_id = Column(Integer, ForeignKey("v2_interviews.id"), nullable=False, index=True)
    question_index = Column(Integer, nullable=False)
    question_text = Column(Text, default="")
    skill = Column(String, default="")
    topic = Column(String, default="")
    difficulty = Column(String, default="")
    candidate_answer = Column(Text, default="")
    semantic_score = Column(Float, default=0.0)
    concept_score = Column(Float, default=0.0)
    keyword_score = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)
    covered_concepts = Column(JSON, default=list)
    missing_concepts = Column(JSON, default=list)
    feedback = Column(Text, default="")
    had_followup = Column(Boolean, default=False)
    followup_question = Column(Text, nullable=True)
    followup_answer = Column(Text, nullable=True)
    followup_score = Column(Float, nullable=True)

    interview = relationship("V2Interview", back_populates="answers")


# ── Pydantic Request / Response Models ────────────────────────────────────────

class ParseResumeResponse(BaseModel):
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    skills: List[str]
    education: List[str]
    experience: List[str]
    projects: List[str] = []
    predicted_role: str
    resume_quality_score: int = 85


class StartInterviewRequest(BaseModel):
    predicted_role: str
    skills: List[str]
    name: Optional[str] = None
    email: Optional[str] = None
    interview_mode: str = "Technical"  # "Technical" or "HR"


class StartInterviewResponse(BaseModel):
    interview_id: int
    predicted_role: str
    candidate_name: Optional[str]
    questions: List[dict]


class SubmitAnswerRequest(BaseModel):
    interview_id: int
    question_index: int
    answer: str
    is_follow_up: bool = False
    time_taken: int = 0


class SubmitAnswerResponse(BaseModel):
    question_index: int
    final_score: float
    semantic_score: float
    concept_score: float
    keyword_score: float
    covered_concepts: List[str]
    missing_concepts: List[str]
    feedback: str
    next_action: str          # "follow_up" | "next_question" | "finish"
    follow_up_question: Optional[str] = None
    questions_remaining: int


class FinishInterviewRequest(BaseModel):
    interview_id: int


class QuestionReport(BaseModel):
    question: str
    topic: str
    difficulty: str
    skill: str
    score: float
    semantic_score: float
    concept_score: float
    covered_concepts: List[str]
    missing_concepts: List[str]
    feedback: str
    candidate_answer: str
    had_followup: bool
    followup_question: Optional[str]
    followup_score: Optional[float]


class FinishInterviewResponse(BaseModel):
    interview_id: int
    overall_score: float
    hiring_recommendation: str
    recommendation_color: str
    skill_breakdown: dict
    strengths: List[str]
    weaknesses: List[str]
    questions: List[Any]
