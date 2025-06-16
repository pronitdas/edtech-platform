from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from uuid import UUID

# Auth Models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class UserProfile(BaseModel):
    id: int
    email: str
    name: Optional[str]
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: Optional[int] = None
    email: Optional[str] = None

# Knowledge Models
class KnowledgeUploadRequest(BaseModel):
    auto_process: bool = True
    generate_content: bool = True
    content_types: List[str] = ["summary", "notes", "quiz", "mindmap"]
    content_language: str = "English"

class KnowledgeResponse(BaseModel):
    id: int
    name: str
    content_type: str
    status: str
    created_at: datetime
    user_id: int

class KnowledgeListResponse(BaseModel):
    items: List[KnowledgeResponse]
    total: int

# Chapter Models
class ChapterUpdate(BaseModel):
    notes: Optional[str] = None
    summary: Optional[str] = None
    quiz: Optional[Dict[str, Any]] = None
    mindmap: Optional[Dict[str, Any]] = None

# Roleplay Models
class RoleplayRequest(BaseModel):
    knowledge_id: int
    topic: str
    content: str
    language: str = "English"

class RoleplayResponse(BaseModel):
    id: int
    knowledge_id: int
    chapter_id: Optional[str]
    language: str
    topic: str
    prompt: str
    response: str
    created_at: datetime

# Analytics Models
class EventTrackingRequest(BaseModel):
    event_type: str
    knowledge_id: Optional[int] = None
    chapter_id: Optional[str] = None
    content_id: Optional[str] = None
    session_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class UserProgressResponse(BaseModel):
    user_id: int
    knowledge_id: int
    chapters_viewed: int
    last_access: datetime
    progress_percent: float

class AnalyticsResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Content Generation Models
class ContentGenerationRequest(BaseModel):
    knowledge_id: int
    content_types: List[str] = ["notes", "summary", "quiz", "mindmap"]
    language: str = "English"

# Search Models
class SearchRequest(BaseModel):
    query: str
    filters: Optional[Dict[str, Any]] = None
    limit: int = 10
    offset: int = 0

class SearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    total: int
    query: str

# Admin Models
class HealthCheckResponse(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, Dict[str, Any]]
    version: str

class ChapterResponse(BaseModel):
    id: str
    knowledge_id: int
    title: str
    content: str
    notes: Optional[str]
    summary: Optional[str]
    quiz: Optional[Dict[str, Any]]
    mindmap: Optional[Dict[str, Any]]
    language: str

# Roleplay Models
class RoleplayGenerateRequest(BaseModel):
    knowledge_id: int
    topic: str
    content: str
    language: str = "English"

class RoleplayScenario(BaseModel):
    id: int
    knowledge_id: int
    chapter_id: Optional[str]
    language: str
    topic: str
    prompt: str
    response: str
    created_at: datetime

# Analytics Models
class EventTrackRequest(BaseModel):
    event_type: str
    knowledge_id: Optional[int] = None
    chapter_id: Optional[str] = None
    content_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class ProgressResponse(BaseModel):
    user_id: int
    knowledge_id: int
    chapters_viewed: int
    last_access: datetime
    progress_percent: float

class HealthResponse(BaseModel):
    status: str
    services: Dict[str, str]
    timestamp: datetime
