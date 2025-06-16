from datetime import datetime
from typing import Dict, Any
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, ForeignKey, DateTime, Float
from sqlalchemy.orm import declarative_base

Base = declarative_base()

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
    """Model for storing knowledge entries."""
    __tablename__ = "knowledge"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String)
    content_type = Column(String)
    difficulty_level = Column(String)
    target_audience = Column(JSON)
    prerequisites = Column(JSON)
    summary = Column(Text)
    video_url = Column(String)
    has_transcript = Column(Boolean, default=False)
    meta_data = Column(JSON)
    retry_count = Column(Integer, default=0)
    seeded = Column(Boolean, default=False)

class Chapter(Base):
    """Model for storing chapter content."""
    __tablename__ = "chapters_v1"

    id = Column(String, primary_key=True)
    knowledge_id = Column(Integer, ForeignKey("knowledge.id"))
    content = Column(Text)
    meta_data = Column(JSON)

class RetryHistory(Base):
    """Model for tracking retry attempts."""
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
