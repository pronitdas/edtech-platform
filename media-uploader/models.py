from datetime import datetime
from typing import Dict, Optional, List, Any
from pydantic import BaseModel, Field


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


class ContentGenerationResponse(BaseModel):
    """Response model for content generation."""
    success: bool
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
