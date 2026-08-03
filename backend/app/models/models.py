import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=True) # temporarily nullable for existing DB
    name: Mapped[str] = mapped_column(String(255), default="Студент")
    subscription_status: Mapped[str] = mapped_column(String(50), default="active_tier") # active_tier / free
    monthly_sessions_limit: Mapped[int] = mapped_column(Integer, default=15)
    sessions_used_this_month: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    materials: Mapped[List["Material"]] = relationship("Material", back_populates="user", cascade="all, delete-orphan")
    interviews: Mapped[List["InterviewSession"]] = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")

class Material(Base):
    __tablename__ = "materials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    chunks_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), default="processing") # processing, ready, error
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped["User"] = relationship("User", back_populates="materials")
    chunks: Mapped[List["DocumentChunk"]] = relationship("DocumentChunk", back_populates="material", cascade="all, delete-orphan")
    interviews: Mapped[List["InterviewSession"]] = relationship("InterviewSession", back_populates="material", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    material_id: Mapped[str] = mapped_column(String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    keywords: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # key terminology extracted
    embedding_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # array of floats stored as JSON for portable RAG

    material: Mapped["Material"] = relationship("Material", back_populates="chunks")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    material_id: Mapped[str] = mapped_column(String(36), ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="in_progress") # in_progress, completed
    total_questions: Mapped[int] = mapped_column(Integer, default=5)
    current_question_index: Mapped[int] = mapped_column(Integer, default=0)
    overall_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # 0-100%
    summary_report: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="interviews")
    material: Mapped["Material"] = relationship("Material", back_populates="interviews")
    dialogs: Mapped[List["InterviewDialog"]] = relationship("InterviewDialog", back_populates="session", cascade="all, delete-orphan")

class InterviewDialog(Base):
    __tablename__ = "interview_dialogs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_number: Mapped[int] = mapped_column(Integer, nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    expected_key_points: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # list of key ideas expected
    user_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # 0 to 100
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    missed_concepts: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # list of missed points
    referenced_pages: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True) # [1, 3, 5]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="dialogs")
