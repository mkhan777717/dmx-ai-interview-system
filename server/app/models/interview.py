from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.config.database import Base


# Enums
class InterviewMode(str, enum.Enum):
    HR = "HR"
    TECHNICAL = "Technical"


class InterviewStatus(str, enum.Enum):
    INCOMPLETED = "Incompleted"
    COMPLETED = "completed"


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


# SQLAlchemy Models
class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String, nullable=False)
    experience = Column(String, nullable=False)
    mode = Column(SQLEnum(InterviewMode), nullable=False)
    resume_text = Column(Text, default="")
    final_score = Column(Float, default=0.0)
    status = Column(SQLEnum(InterviewStatus), default=InterviewStatus.INCOMPLETED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Relationship
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan")


class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    difficulty = Column(SQLEnum(Difficulty), nullable=False)
    time_limit = Column(Integer, nullable=False)
    answer = Column(Text, default="")
    feedback = Column(Text, default="")
    score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    communication = Column(Float, default=0.0)
    correctness = Column(Float, default=0.0)
    
    # Relationship
    interview = relationship("Interview", back_populates="questions")


# Pydantic Models
class QuestionBase(BaseModel):
    question: str
    difficulty: str
    timeLimit: int
    answer: Optional[str] = ""
    feedback: Optional[str] = ""
    score: float = 0
    confidence: float = 0
    communication: float = 0
    correctness: float = 0


class QuestionResponse(BaseModel):
    question: str
    difficulty: str
    timeLimit: int

    class Config:
        from_attributes = True


class InterviewCreate(BaseModel):
    role: str
    experience: str
    mode: str
    resumeText: Optional[str] = ""


class InterviewResponse(BaseModel):
    id: int
    role: str
    experience: str
    mode: str
    final_score: float = Field(alias="finalScore")
    status: str
    created_at: Optional[datetime] = Field(alias="createdAt")

    class Config:
        from_attributes = True
        populate_by_name = True


class GenerateQuestionsRequest(BaseModel):
    role: str
    experience: str
    mode: str
    resumeText: Optional[str] = ""
    projects: Optional[List[str]] = []
    skills: Optional[List[str]] = []


class SubmitAnswerRequest(BaseModel):
    interviewId: int
    questionIndex: int
    answer: Optional[str] = ""
    timeTaken: int


class FinishInterviewRequest(BaseModel):
    interviewId: int
