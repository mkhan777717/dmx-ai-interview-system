from sqlalchemy import (
    Column, Integer, String, Float, DateTime,
    ForeignKey, Text, JSON, Boolean,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from pydantic import BaseModel
from typing import Optional, List, Any
from app.config.database import Base


# ── SQLAlchemy ORM Models ─────────────────────────────────────────────────────

class V2Interview(Base):
    __tablename__ = "v2_interviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    predicted_role: Mapped[str] = mapped_column(String, nullable=False)
    candidate_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    candidate_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    candidate_skills: Mapped[Any] = mapped_column(JSON, default=list)
    questions: Mapped[Any] = mapped_column(JSON, default=list)          # Full question list with metadata
    status: Mapped[str] = mapped_column(String, default="in_progress")  # in_progress | completed
    consecutive_good: Mapped[int] = mapped_column(Integer, default=0)
    current_question_index: Mapped[int] = mapped_column(Integer, default=0)
    final_score: Mapped[float] = mapped_column(Float, default=0.0)
    report: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # ── New fields (Phase 2 additions) ────────────────────────────────────────
    interview_mode: Mapped[str] = mapped_column(String, default="Technical")   # Technical | HR
    jd_skills: Mapped[Any] = mapped_column(JSON, default=list)                 # Skills extracted from JD
    jd_role: Mapped[Optional[str]] = mapped_column(String, nullable=True)                # Role extracted from JD
    rubric_id: Mapped[str] = mapped_column(String, default="technical_standard")  # Rubric identifier used
    rubric_version: Mapped[int] = mapped_column(Integer, default=1)            # Rubric version at time of interview
    integrity_flags: Mapped[Any] = mapped_column(JSON, default=list)           # Advisory integrity flags
    percentile: Mapped[Optional[float]] = mapped_column(Float, nullable=True)              # Peer percentile at finish

    # ── Phase 3 additions ─────────────────────────────────────────────────────
    improvement_plan: Mapped[Any] = mapped_column(JSON, default=list)          # Post-interview coaching plan
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)              # Recruiter notes
    admin_overrides: Mapped[Any] = mapped_column(JSON, default=list)           # Human override records

    answers: Mapped[List["V2Answer"]] = relationship(
        "V2Answer", back_populates="interview", cascade="all, delete-orphan"
    )


class V2Answer(Base):
    __tablename__ = "v2_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    interview_id: Mapped[int] = mapped_column(Integer, ForeignKey("v2_interviews.id"), nullable=False, index=True)
    question_index: Mapped[int] = mapped_column(Integer, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, default="")
    skill: Mapped[str] = mapped_column(String, default="")
    topic: Mapped[str] = mapped_column(String, default="")
    difficulty: Mapped[str] = mapped_column(String, default="")
    candidate_answer: Mapped[str] = mapped_column(Text, default="")
    semantic_score: Mapped[float] = mapped_column(Float, default=0.0)
    concept_score: Mapped[float] = mapped_column(Float, default=0.0)
    keyword_score: Mapped[float] = mapped_column(Float, default=0.0)
    final_score: Mapped[float] = mapped_column(Float, default=0.0)
    covered_concepts: Mapped[Any] = mapped_column(JSON, default=list)
    missing_concepts: Mapped[Any] = mapped_column(JSON, default=list)
    feedback: Mapped[str] = mapped_column(Text, default="")
    had_followup: Mapped[bool] = mapped_column(Boolean, default=False)
    followup_question: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    followup_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    followup_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # ── Phase 2 fields ────────────────────────────────────────────────────────
    confidence: Mapped[float] = mapped_column(Float, default=0.0)       # 0.0–1.0 evaluation confidence
    justification: Mapped[Optional[str]] = mapped_column(Text, nullable=True)    # Quoted fragment justifying score

    # ── Phase 3 fields ────────────────────────────────────────────────────────
    communication_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)       # 0.0–1.0
    communication_breakdown: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)    # {length, structure, vocabulary, filler}
    ai_detection_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)        # 0.0–1.0 AI probability
    ai_detection_flags: Mapped[Any] = mapped_column(JSON, default=list)          # List of flag descriptions

    interview: Mapped[V2Interview] = relationship("V2Interview", back_populates="answers")


class AuditLog(Base):
    """Append-only audit trail for all interview events."""
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)   # user_id who triggered action
    action: Mapped[str] = mapped_column(String, nullable=False)                  # e.g. "interview.started"
    entity_type: Mapped[str] = mapped_column(String, nullable=False)             # e.g. "V2Interview"
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # e.g. interview_id
    details: Mapped[Any] = mapped_column(JSON, default=dict)                     # Additional context
    created_at: Mapped[Any] = mapped_column(DateTime(timezone=True), server_default=func.now())


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


class ParseJDResponse(BaseModel):
    role: str
    skills: List[str]
    seniority: Optional[str] = None
    key_requirements: List[str] = []


from pydantic import BaseModel, model_validator

class StartInterviewRequest(BaseModel):
    predicted_role: Optional[str] = None
    role: Optional[str] = None
    skills: List[str] = []
    name: Optional[str] = None
    email: Optional[str] = None
    interview_mode: str = "Technical"   # "Technical" or "HR"
    jd_skills: List[str] = []          # Optional skills from JD
    jd_role: Optional[str] = None      # Optional role from JD
    rubric_id: str = "auto"            # Rubric to use; "auto" = resolved from mode

    @model_validator(mode="before")
    @classmethod
    def reconcile_role(cls, data: Any) -> Any:
        if isinstance(data, dict):
            role_val = data.get("predicted_role") or data.get("role") or "Software Engineer"
            data["predicted_role"] = str(role_val)
            data["role"] = str(role_val)
            if not data.get("skills"):
                data["skills"] = []
        return data


class StartInterviewResponse(BaseModel):
    interview_id: int
    predicted_role: str
    candidate_name: Optional[str]
    questions: List[dict]
    rubric_id: str


class SubmitAnswerRequest(BaseModel):
    interview_id: int
    question_index: int
    answer: str
    is_follow_up: bool = False
    time_taken: int = 0
    integrity_flags: List[dict] = []   # Tab-switch events from client


class SubmitAnswerResponse(BaseModel):
    question_index: int
    final_score: float
    semantic_score: float
    concept_score: float
    keyword_score: float
    covered_concepts: List[str]
    missing_concepts: List[str]
    feedback: str
    confidence: float
    justification: Optional[str]
    next_action: str          # "follow_up" | "next_question" | "finish"
    follow_up_question: Optional[str] = None
    questions_remaining: int
    # Adaptive difficulty: new question if swapped
    swapped_question: Optional[dict] = None


class FinishInterviewRequest(BaseModel):
    interview_id: int
    integrity_flags: List[dict] = []   # Final batch of integrity events


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
    confidence: float
    justification: Optional[str]
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
    percentile: Optional[float] = None
    integrity_flags: List[dict] = []


class HintRequest(BaseModel):
    interview_id: int
    question_index: int


class HintResponse(BaseModel):
    hint: str


class RubricCriteria(BaseModel):
    name: str
    weight: float
    description: str


class RubricResponse(BaseModel):
    id: str
    name: str
    version: int
    description: str
    criteria: List[RubricCriteria]
    weights: dict    # Maps evaluator components to weights
