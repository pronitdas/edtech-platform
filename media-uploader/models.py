from datetime import datetime
from typing import Dict, Optional, List, Any, Union
from pydantic import BaseModel, Field
from enum import Enum


class ProcessingStatus(BaseModel):
    """Status of a knowledge processing job."""
    knowledge_id: int
    status: Optional[str] = ""
    message: Optional[str] = ""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    result: Optional[Dict] = None
    retry_count: Optional[int] = 0
    last_retry: Optional[datetime] = None


class PDFResponse(BaseModel):
    """Response model for PDF processing."""
    markdown: str
    images: Dict[str, Any]  # filename -> image data
    metadata: Dict


class RetryRequest(BaseModel):
    """Request model for retrying a failed processing job."""
    max_retries: Optional[int] = 3
    force: Optional[bool] = False


class RetryEntry(BaseModel):
    timestamp: str
    type: str
    message: str


class RetryHistory(BaseModel):
    """Model for retry history."""
    knowledge_id: int
    retries: List[Dict[str, Any]]


class ImageUploadStatus(BaseModel):
    """Status of image uploads for a knowledge entry."""
    knowledge_id: int
    total_images: int
    uploaded_images: int
    failed_images: List[str] = []


# New models for content generation

class ContentGenerationRequest(BaseModel):
    """Request model for content generation."""
    edtech_id: str
    chapter: Dict[str, Any]
    knowledge_id: int
    types: List[str]
    language: str = "English"
    chapter_id: Optional[str] = None


class ContentGenerationResponse(BaseModel):
    """Response model for content generation."""
    success: bool
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ChapterDataRequest(BaseModel):
    """Request model for chapter data."""
    knowledge_id: int
    chapter_id: Optional[str] = None
    types: List[str] = []
    language: str = "English"


class ChapterDataResponse(BaseModel):
    """Response model for chapter data."""
    success: bool
    data: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None


class FileResponse(BaseModel):
    """Response model for PDF processing."""
    markdown: str
    metadata: Dict
    analysis: Dict
    image_urls: Dict
    failed_images: List[str]
    processed_at: str
    retry_count: int
    file_type: str = "document"  # Can be "pdf", "docx", "pptx", "document" (generic) or "video"


# Knowledge Graph Models

class NodeLabel(str, Enum):
    KNOWLEDGE = "Knowledge"
    CHAPTER = "Chapter"
    CONCEPT = "Concept"
    SKILL = "Skill"
    STUDENT = "Student"


class RelationshipType(str, Enum):
    HAS_CHAPTER = "HAS_CHAPTER"
    TEACHES_CONCEPT = "TEACHES_CONCEPT"
    CONTAINS_CONCEPT = "CONTAINS_CONCEPT"
    RELATED_TO = "RELATED_TO"
    REQUIRES = "REQUIRES"
    LEARNED = "LEARNED"


class GraphNode(BaseModel):
    id: Optional[str] = None
    labels: List[str]
    properties: Dict[str, Any]


class GraphRelationship(BaseModel):
    id: Optional[str] = None
    start_node_id: str
    end_node_id: str
    type: str
    properties: Optional[Dict[str, Any]] = None


class GraphQueryResult(BaseModel):
    nodes: List[GraphNode]
    relationships: List[GraphRelationship]
    summary: Optional[Dict[str, Any]] = None


class GraphSyncRequest(BaseModel):
    knowledge_id: int
    force: bool = False
    include_chapters: bool = True
    include_concepts: bool = True


class GraphSyncResponse(BaseModel):
    success: bool
    knowledge_id: int
    message: str
    nodes_created: Optional[int] = None
    relationships_created: Optional[int] = None
    error: Optional[str] = None


class GraphDeleteRequest(BaseModel):
    knowledge_id: int
    cascade: bool = True


class GraphDeleteResponse(BaseModel):
    success: bool
    knowledge_id: int
    message: str
    nodes_deleted: Optional[int] = None
    error: Optional[str] = None


class GraphSchemaResponse(BaseModel):
    node_labels: List[str]
    relationship_types: List[str]
    constraints: List[str]
    schema_status: str


class ConceptNode(BaseModel):
    id: str
    name: str
    occurrence_count: int


class ConceptRelationship(BaseModel):
    source: str
    target: str
    weight: float


class ConceptMapResponse(BaseModel):
    knowledge_id: int
    concepts: List[ConceptNode]
    relationships: List[ConceptRelationship]
