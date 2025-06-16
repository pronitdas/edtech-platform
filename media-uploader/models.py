from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, ForeignKey, DateTime, Float
from sqlalchemy.orm import declarative_base, relationship
from pydantic import BaseModel

Base = declarative_base()

# Pydantic models for API responses
class ProcessingStatus(BaseModel):
    """Response model for processing status."""
    knowledge_id: int
    status: str
    message: str
    retry_count: int
    result: Optional[Dict[str, Any]] = None

class RetryRequest(BaseModel):
    """Request model for retry operations."""
    force: bool = False
    max_retries: Optional[int] = None

class RetryHistoryEntry(BaseModel):
    """Model for a single retry history entry."""
    id: int
    knowledge_id: int
    status: str
    error: Optional[str]
    created_at: datetime

class RetryHistory(BaseModel):
    """Response model for retry history."""
    knowledge_id: int
    retries: List[RetryHistoryEntry]

class ImageUploadStatus(BaseModel):
    """Response model for image upload status."""
    knowledge_id: int
    total_images: int
    uploaded_images: int
    failed_images: List[str]

class PDFResponse(BaseModel):
    """Response model for PDF processing."""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

class ContentGenerationResponse(BaseModel):
    """Response model for content generation."""
    success: bool
    error: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None

class ChapterDataResponse(BaseModel):
    """Response model for chapter data."""
    success: bool
    data: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None

class ContentGenerationRequest(BaseModel):
    """Request model for content generation."""
    knowledge_id: int
    chapter_id: Optional[str] = None
    types: List[str]
    language: str = "English"

class ChapterDataRequest(BaseModel):
    """Request model for chapter data."""
    knowledge_id: int
    chapter_id: Optional[str] = None
    types: Optional[List[str]] = None
    language: str = "English"

class User(Base):
    """Model for user accounts integrated with ORY Kratos and JWT sessions."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    kratos_id = Column(String(36), unique=True, nullable=False, index=True)  # UUID from Kratos
    email = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String(100))
    roles = Column(JSON, default=list, nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # JWT session tracking
    current_jwt = Column(String)  # Store current active JWT
    jwt_issued_at = Column(DateTime)  # When the current JWT was issued
    jwt_expires_at = Column(DateTime)  # When the current JWT expires

class ContentAnalytics(Base):
    """Model for tracking content generation analytics."""
    __tablename__ = "content_analytics"

    id = Column(Integer, primary_key=True)
    knowledge_id = Column(Integer, ForeignKey("knowledge.id"))
    content_type = Column(String(50))
    language = Column(String(50))
    generation_time = Column(Float)
    success = Column(Boolean)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class EngagementMetrics(Base):
    """Model for tracking user engagement with content."""
    __tablename__ = "engagement_metrics"

    id = Column(Integer, primary_key=True)
    knowledge_id = Column(Integer, ForeignKey("knowledge.id"))
    chapter_id = Column(String(50))
    views = Column(Integer, default=0)
    completions = Column(Integer, default=0)
    avg_time_spent = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class PerformanceStats(Base):
    """Model for tracking system performance metrics."""
    __tablename__ = "performance_stats"

    id = Column(Integer, primary_key=True)
    operation_type = Column(String(50))
    duration = Column(Float)
    success = Column(Boolean)
    error_count = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Knowledge(Base):
    """Model for storing knowledge entries with multi-file support."""
    __tablename__ = "knowledge"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # ADD: knowledge entry name
    status = Column(String)
    content_type = Column(String)  # Can be "mixed" for multiple file types
    difficulty_level = Column(String)
    target_audience = Column(JSON)
    prerequisites = Column(JSON)
    summary = Column(Text)
    video_url = Column(String)
    has_transcript = Column(Boolean, default=False)
    meta_data = Column(JSON)
    retry_count = Column(Integer, default=0)
    seeded = Column(Boolean, default=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # ADD: user reference
    created_at = Column(DateTime, default=datetime.utcnow)  # ADD: timestamp
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)  # ADD: update timestamp
    
    # ADD: Relationship to media files
    media_files = relationship("Media", back_populates="knowledge", cascade="all, delete-orphan")

class Chapter(Base):
    """Model for storing chapter content."""
    __tablename__ = "chapters_v1"

    id = Column(String, primary_key=True)
    knowledge_id = Column(Integer, ForeignKey("knowledge.id"))
    content = Column(Text)
    meta_data = Column(JSON)

class RetryHistoryDB(Base):
    """SQLAlchemy model for tracking retry attempts."""
    __tablename__ = "retry_history"

    id = Column(Integer, primary_key=True)
    knowledge_id = Column(Integer, ForeignKey("knowledge.id"))
    status = Column(String)
    error = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class EdTechContent(Base):
    """Model for storing generated educational content in different languages."""
    __tablename__ = "edtech_content"

    id = Column(Integer, primary_key=True)
    knowledge_id = Column(Integer, ForeignKey("knowledge.id"), nullable=False)
    chapter_id = Column(String, ForeignKey("chapters_v1.id"), nullable=False)
    language = Column(String, nullable=False)
    notes = Column(Text)
    summary = Column(Text)
    quiz = Column(JSON)  # Store quiz questions/answers as JSON
    mindmap = Column(JSON)  # Store mindmap structure as JSON
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Media(Base):
    """Model for tracking uploaded media files and their metadata."""
    __tablename__ = "media"

    id = Column(Integer, primary_key=True)
    knowledge_id = Column(Integer, ForeignKey("knowledge.id"), nullable=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_path = Column(String, nullable=False)  # Path in storage
    bucket_name = Column(String, nullable=False)
    upload_status = Column(String, default="pending")  # pending, completed, failed
    error_message = Column(Text)
    meta_data = Column(JSON)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # ADD: Back reference to knowledge
    knowledge = relationship("Knowledge", back_populates="media_files")

# V2 Schema Models

class RoleplayScenario(Base):
    """Model for storing roleplay scenarios."""
    __tablename__ = "roleplay_scenarios"

    id = Column(Integer, primary_key=True)
    knowledge_id = Column(Integer, ForeignKey("knowledge.id", ondelete="CASCADE"), nullable=False)
    chapter_id = Column(String(64))
    language = Column(String(48), default="English")
    topic = Column(Text)
    prompt = Column(Text)
    response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class UserSession(Base):
    """Model for tracking user sessions."""
    __tablename__ = "user_sessions"

    id = Column(String, primary_key=True)  # UUID as string
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime)
    duration_sec = Column(Integer)

class UserEvent(Base):
    """Model for tracking user events and analytics."""
    __tablename__ = "user_events"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    knowledge_id = Column(Integer, ForeignKey("knowledge.id", ondelete="SET NULL"))
    chapter_id = Column(String(64))
    session_id = Column(String, ForeignKey("user_sessions.id", ondelete="SET NULL"))
    event_type = Column(String(64), nullable=False)
    content_id = Column(String(64))
    ts = Column(DateTime, default=datetime.utcnow)
    data = Column(JSON)
