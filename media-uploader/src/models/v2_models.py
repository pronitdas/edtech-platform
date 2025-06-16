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
