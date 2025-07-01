import json
import logging
from datetime import datetime
from typing import Dict, Optional, List, Any
import os
import dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Knowledge, Chapter, RetryHistory, Media, EdTechContent

dotenv.load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SQLAlchemy setup
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5433/development')

# Initialize SQLAlchemy
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency function for FastAPI
def get_db():
    """Dependency function to get database session for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class DatabaseManager:
    """Manager for database operations."""
    
    def __init__(self, db_url: str = DATABASE_URL):
        """Initialize the database manager with SQLAlchemy."""
        self.engine = create_engine(db_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            
    def get_knowledge(self, knowledge_id: int) -> Knowledge:
        """Get a knowledge entry by ID."""
        try:
            with SessionLocal() as db:
                knowledge = db.query(Knowledge).filter(Knowledge.id == knowledge_id).first()
                if not knowledge:
                    raise ValueError(f"Knowledge entry {knowledge_id} not found")
                return knowledge
        except Exception as e:
            logger.error(f"Error getting knowledge {knowledge_id}: {str(e)}")
            raise
            
    def get_unseeded_knowledge(self, knowledge_id: int) -> Knowledge:
        """Get an unseeded knowledge entry by ID."""
        try:
            with SessionLocal() as db:
                knowledge = db.query(Knowledge).filter(
                    Knowledge.id == knowledge_id,
                    Knowledge.seeded == False
                ).first()
                if not knowledge:
                    raise ValueError(f"Unseeded knowledge entry {knowledge_id} not found")
                return knowledge
        except Exception as e:
            logger.error(f"Error getting unseeded knowledge {knowledge_id}: {str(e)}")
            raise
            
    def update_knowledge_status(self, knowledge_id: int, status: str, metadata: Optional[Dict] = None) -> None:
        """Update knowledge status and metadata."""
        try:
            with SessionLocal() as db:
                knowledge = db.query(Knowledge).filter(Knowledge.id == knowledge_id).first()
                if not knowledge:
                    raise ValueError(f"Knowledge entry {knowledge_id} not found")
                knowledge.status = status
                if metadata:
                    knowledge.meta_data = metadata
                db.commit()
        except Exception as e:
            logger.error(f"Error updating knowledge status: {str(e)}")
            raise
            
    def insert_chapters(self, knowledge_id: int, chapters: List[Dict]) -> None:
        """Insert chapters into the database."""
        try:
            with SessionLocal() as db:
                chapter_objects = [
                    Chapter(
                        knowledge_id=knowledge_id,
                        id=chapter.get("id"),
                        content=chapter.get("content"),
                        meta_data=chapter.get("meta_data", {})
                    ) for chapter in chapters
                ]
                db.bulk_save_objects(chapter_objects)
                db.commit()
        except Exception as e:
            logger.error(f"Error inserting chapters: {str(e)}")
            raise

    def update_retry_info(self, knowledge_id: int, retry_count: int) -> None:
        """Update retry information for a knowledge entry."""
        try:
            with SessionLocal() as db:
                knowledge = db.query(Knowledge).filter(Knowledge.id == knowledge_id).first()
                if not knowledge:
                    raise ValueError(f"Knowledge entry {knowledge_id} not found")
                knowledge.retry_count = retry_count
                db.commit()
        except Exception as e:
            logger.error(f"Error updating retry info: {str(e)}")
            raise
            
    def get_retry_history(self, knowledge_id: int) -> List[RetryHistory]:
        """Get retry history for a knowledge entry."""
        try:
            with SessionLocal() as db:
                history = db.query(RetryHistory).filter(RetryHistory.knowledge_id == knowledge_id).order_by(RetryHistory.created_at.desc()).all()
                return history
        except Exception as e:
            logger.error(f"Error getting retry history: {str(e)}")
            raise
            
    def add_retry_history(self, knowledge_id: int, status: str, error: Optional[str] = None) -> None:
        """Add a retry history entry."""
        try:
            with SessionLocal() as db:
                retry_entry = RetryHistory(
                    knowledge_id=knowledge_id,
                    status=status,
                    error=error,
                    created_at=datetime.utcnow()
                )
                db.add(retry_entry)
                db.commit()
        except Exception as e:
            logger.error(f"Error adding retry history: {str(e)}")
            # Don't raise here to avoid breaking the main process
            
    def get_chapter_data(self, knowledge_id: int, chapter_id: Optional[str] = None) -> List[Chapter]:
        """Get chapter data from the chapters_v1 table."""
        try:
            with SessionLocal() as db:
                query = db.query(Chapter).filter(Chapter.knowledge_id == knowledge_id)
                if chapter_id:
                    query = query.filter(Chapter.id == chapter_id)
                chapters = query.all()
                return chapters
        except Exception as e:
            logger.error(f"Error getting chapter data: {str(e)}")
            raise

    def update_knowledge_metadata(self, knowledge_id: int, metadata: Dict[str, Any]) -> None:
        """Update knowledge metadata fields directly."""
        try:
            with SessionLocal() as db:
                knowledge = db.query(Knowledge).filter(Knowledge.id == knowledge_id).first()
                if not knowledge:
                    raise ValueError(f"Knowledge entry {knowledge_id} not found")
                for key, value in metadata.items():
                    if hasattr(knowledge, key):
                        setattr(knowledge, key, value)
                db.commit()
        except Exception as e:
            logger.error(f"Error updating knowledge metadata: {str(e)}")
            raise

    def update_knowledge_type(self, knowledge_id: int, content_type: str) -> None:
        """Update the content type of a knowledge entry."""
        try:
            with SessionLocal() as db:
                knowledge = db.query(Knowledge).filter(Knowledge.id == knowledge_id).first()
                if not knowledge:
                    raise ValueError(f"Knowledge entry {knowledge_id} not found")
                knowledge.content_type = content_type
                db.commit()
        except Exception as e:
            logger.error(f"Error updating knowledge type: {str(e)}")
            raise

    # File operations can be handled by a separate FileStorage class in the future
    def download_file(self, file_path: str) -> bytes:
        """Download a file from local storage."""
        try:
            raise NotImplementedError("File operations need to be implemented separately")
        except Exception as e:
            logger.error(f"Error downloading file {file_path}: {str(e)}")
            raise

    def upload_image(self, knowledge_id: int, img_filename: str, image_buffer: bytes, content_type: str) -> Dict:
        """Upload an image to local storage."""
        try:
            raise NotImplementedError("File operations need to be implemented separately")
        except Exception as e:
            logger.error(f"Error uploading image {img_filename}: {str(e)}")
            raise
            
    def get_edtech_content(self, chapter_id: str, language: str) -> Optional[EdTechContent]:
        """Get educational content for a specific chapter and language."""
        try:
            with SessionLocal() as db:
                content = db.query(EdTechContent).filter(
                    EdTechContent.chapter_id == chapter_id,
                    EdTechContent.language == language
                ).first()
                
                if not content:
                    return None
                    
                return content
        except Exception as e:
            logger.error(f"Error getting edtech content: {str(e)}")
            raise
            
    def update_edtech_content(self, chapter_id: str, language: str, content_data: Dict[str, Any]) -> None:
        """Update or create educational content for a specific chapter and language."""
        try:
            with SessionLocal() as db:
                content = db.query(EdTechContent).filter(
                    EdTechContent.chapter_id == chapter_id,
                    EdTechContent.language == language
                ).first()
                
                if content:
                    # Update existing content
                    for key, value in content_data.items():
                        if hasattr(content, key):
                            setattr(content, key, value)
                else:
                    # Create new content
                    content = EdTechContent(
                        chapter_id=chapter_id,
                        language=language,
                        **content_data
                    )
                    db.add(content)
                    
                db.commit()
        except Exception as e:
            logger.error(f"Error updating edtech content: {str(e)}")
            raise
            
    def get_edtech_content_by_knowledge(self, knowledge_id: int, language: str) -> List[EdTechContent]:
        """Get all educational content for a knowledge entry in a specific language."""
        try:
            with SessionLocal() as db:
                contents = db.query(EdTechContent).filter(
                    EdTechContent.knowledge_id == knowledge_id,
                    EdTechContent.language == language
                ).all()
                
                return contents
        except Exception as e:
            logger.error(f"Error getting edtech content by knowledge: {str(e)}")
            raise

    def create_knowledge(self, name: str, **kwargs) -> Knowledge:
        """Create a new knowledge entry and return its ID."""
        try:
            with SessionLocal() as db:
                knowledge = Knowledge(
                    name=name,
                    status=kwargs.get('status', 'pending'),
                    content_type=kwargs.get('content_type', 'mixed'),
                    difficulty_level=kwargs.get('difficulty_level'),
                    target_audience=kwargs.get('target_audience', []),
                    prerequisites=kwargs.get('prerequisites', []),
                    summary=kwargs.get('summary'),
                    video_url=kwargs.get('video_url'),
                    has_transcript=kwargs.get('has_transcript', False),
                    meta_data=kwargs.get('meta_data', {}),
                    retry_count=0,
                    seeded=False
                )
                db.add(knowledge)
                db.commit()
                db.refresh(knowledge)
                return knowledge
        except Exception as e:
            logger.error(f"Error creating knowledge: {str(e)}")
            raise

    def add_media_file(self, knowledge_id: int, filename: str, original_filename: str, 
                      content_type: str, file_size: int, file_path: str, 
                      bucket_name: str, uploaded_by: Optional[int] = None, 
                      meta_data: Optional[Dict] = None) -> Media:
        """Add a media file record and return its ID."""
        try:
            with SessionLocal() as db:
                media = Media(
                    knowledge_id=knowledge_id,
                    filename=filename,
                    original_filename=original_filename,
                    content_type=content_type,
                    file_size=file_size,
                    file_path=file_path,
                    bucket_name=bucket_name,
                    upload_status="completed",
                    uploaded_by=uploaded_by,
                    meta_data=meta_data or {}
                )
                db.add(media)
                db.commit()
                db.refresh(media)
                return media
        except Exception as e:
            logger.error(f"Error adding media file: {str(e)}")
            raise

    def get_knowledge_media_files(self, knowledge_id: int) -> List[Media]:
        """Get all media files for a knowledge entry."""
        try:
            with SessionLocal() as db:
                media_files = db.query(Media).filter(Media.knowledge_id == knowledge_id).all()
                return media_files
        except Exception as e:
            logger.error(f"Error getting media files for knowledge {knowledge_id}: {str(e)}")
            raise

    def update_media_status(self, media_id: int, status: str, error_message: Optional[str] = None) -> None:
        """Update media file upload status."""
        try:
            with SessionLocal() as db:
                media = db.query(Media).filter(Media.id == media_id).first()
                if not media:
                    raise ValueError(f"Media file {media_id} not found")
                media.upload_status = status
                if error_message:
                    media.error_message = error_message
                db.commit()
        except Exception as e:
            logger.error(f"Error updating media status: {str(e)}")
            raise
