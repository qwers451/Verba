from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserProfileResponse(UserBase):
    id: str
    subscription_status: str
    monthly_sessions_limit: int
    sessions_used_this_month: int
    sessions_remaining: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Material Schemas
class MaterialResponse(BaseModel):
    id: str
    title: str
    page_count: int
    chunks_count: int
    status: str
    file_size_bytes: int
    created_at: datetime

    class Config:
        from_attributes = True

# Interview Dialog Schemas
class DialogItem(BaseModel):
    id: str
    question_number: int
    question_text: str
    user_answer: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    missed_concepts: Optional[List[str]] = None
    referenced_pages: Optional[List[int]] = None

    class Config:
        from_attributes = True

# Interview Session Schemas
class InterviewStartRequest(BaseModel):
    material_id: str
    total_questions: int = Field(default=5, ge=3, le=15)

class InterviewSessionResponse(BaseModel):
    id: str
    material_id: str
    material_title: str
    status: str
    current_question_index: int
    total_questions: int
    overall_score: Optional[float] = None
    dialogs: List[DialogItem] = []
    created_at: datetime

    class Config:
        from_attributes = True

class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_number: int
    user_answer: str

class AnswerEvaluationResponse(BaseModel):
    question_number: int
    score: int # 0 to 100
    feedback: str
    missed_concepts: List[str]
    referenced_pages: List[int]
    is_last_question: bool

class RecommendationTopic(BaseModel):
    topic: str
    status: str # "weak", "medium", "strong"
    pages: List[int]
    advice: str

class FinalReportResponse(BaseModel):
    session_id: str
    material_title: str
    overall_score: float
    grade_label: str # e.g. "Отлично (A)", "Хорошо (B)", "Требует повторения"
    total_questions: int
    topics_breakdown: List[RecommendationTopic]
    key_recommendations: List[str]
    dialogs: List[DialogItem]
