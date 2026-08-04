from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import List, Optional, Any, Literal
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
    subscription_title: str

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class SubscriptionPlanResponse(BaseModel):
    code: str
    title: str
    price_rub: int
    monthly_session_limit: int
    features: List[str]
    is_current: bool = False

class MockCheckoutRequest(BaseModel):
    plan_code: str

class PaymentResponse(BaseModel):
    id: str
    plan_code: str
    amount_rub: int
    status: str
    provider: str
    provider_payment_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CheckoutResponse(BaseModel):
    payment: PaymentResponse
    confirmation_url: str

class DashboardSummaryResponse(BaseModel):
    material_count: int
    completed_sessions: int
    active_sessions: int
    average_score: Optional[float] = None
    sessions_remaining: int
    monthly_sessions_limit: int
    sessions_used_this_month: int

class InterviewHistoryItemResponse(BaseModel):
    id: str
    material_id: str
    material_title: str
    status: str
    overall_score: Optional[float] = None
    total_questions: int
    created_at: datetime
    completed_at: Optional[datetime] = None

# Material Schemas
class MaterialResponse(BaseModel):
    id: str
    title: str
    page_count: int
    chunks_count: int
    status: str
    file_size_bytes: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentChunkResponse(BaseModel):
    id: str
    material_id: str
    page_number: int
    page_end: Optional[int] = None
    chunk_index: int
    section_title: Optional[str] = None
    token_count: int = 0
    content: str
    keywords: List[str]

    model_config = ConfigDict(from_attributes=True)

# Interview Dialog Schemas
class DialogItem(BaseModel):
    id: str
    question_number: int
    question_text: str
    topic: Optional[str] = None
    difficulty: str = "medium"
    user_answer: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    missed_concepts: Optional[List[str]] = None
    strengths: Optional[List[str]] = None
    referenced_pages: Optional[List[int]] = None

    model_config = ConfigDict(from_attributes=True)

# Interview Session Schemas
class InterviewStartRequest(BaseModel):
    material_id: str
    total_questions: int = Field(default=5, ge=3, le=15)
    difficulty: Literal["easy", "medium", "hard"] = "medium"

class InterviewSessionResponse(BaseModel):
    id: str
    material_id: str
    material_title: str
    status: str
    current_question_index: int
    total_questions: int
    overall_score: Optional[float] = None
    dialogs: List[DialogItem] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SubmitAnswerRequest(BaseModel):
    session_id: str
    question_number: int
    user_answer: str = Field(min_length=3, max_length=12000)

class AnswerEvaluationResponse(BaseModel):
    question_number: int
    score: int # 0 to 100
    feedback: str
    strengths: List[str]
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
