from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from fastapi import UploadFile
import uuid
from datetime import datetime

from models import Knowledge, User, Media
from src.models.v2_models import KnowledgeResponse
from src.services.websocket_manager import websocket_manager
from queue_manager import QueueManager
from database import DatabaseManager
from storage import upload_file_to_storage

class KnowledgeService:
    def __init__(self, db: Session):
        self.db = db
        self.db_manager = DatabaseManager()
        self.queue_manager = QueueManager(self.db_manager)

    async def upload_files(
        self,
        files: List[UploadFile],
        user_id: int,
        auto_process: bool = True,
        generate_content: bool = True,
        content_types: List[str] = None,
        content_language: str = "English"
    ) -> Tuple[int, str]:
        """Upload multiple files and create a knowledge entry."""
        if not files:
            raise ValueError("No files provided")
        
        # Determine content type
        content_type = "mixed" if len(files) > 1 else self._get_content_type(files[0])
        
        # Create knowledge entry
        knowledge_name = files[0].filename.rsplit('.', 1)[0] if files else "Unknown"
        if len(files) > 1:
            knowledge_name = f"Mixed Content - {len(files)} files"
        
        knowledge = Knowledge(
            name=knowledge_name,
            content_type=content_type,
            status="uploading",
            user_id=user_id,
            meta_data={
                "file_count": len(files),
                "auto_process": auto_process,
                "generate_content": generate_content,
                "content_types": content_types or ["summary", "notes"],
                "content_language": content_language
            }
        )
        
        self.db.add(knowledge)
        self.db.commit()
        self.db.refresh(knowledge)
        
        # Create WebSocket channel
        ws_channel = f"knowledge_{knowledge.id}"
        
        try:
            # Upload files to storage and create media records
            media_files = []
            for file in files:
                # Upload to storage
                file_path, bucket_name = await upload_file_to_storage(file)
                
                # Create media record
                media = Media(
                    knowledge_id=knowledge.id,
                    filename=f"{uuid.uuid4()}_{file.filename}",
                    original_filename=file.filename,
                    content_type=file.content_type,
                    file_size=file.size if hasattr(file, 'size') else 0,
                    file_path=file_path,
                    bucket_name=bucket_name,
                    upload_status="completed",
                    uploaded_by=user_id
                )
                
                self.db.add(media)
                media_files.append(media)
            
            self.db.commit()
            
            # Update knowledge status
            knowledge.status = "uploaded"
            self.db.commit()
            
            # Send status update
            await websocket_manager.publish_status(ws_channel, {
                "type": "upload_complete",
                "knowledge_id": knowledge.id,
                "status": "uploaded",
                "file_count": len(files),
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Queue for processing if auto_process is enabled
            if auto_process:
                await self._queue_for_processing(knowledge, content_types, content_language, ws_channel)
            
            return knowledge.id, ws_channel
            
        except Exception as e:
            # Update knowledge status to failed
            knowledge.status = "failed"
            knowledge.meta_data["error"] = str(e)
            self.db.commit()
            
            # Send error status
            await websocket_manager.publish_status(ws_channel, {
                "type": "upload_error",
                "knowledge_id": knowledge.id,
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            })
            
            raise

    async def _queue_for_processing(
        self, 
        knowledge: Knowledge, 
        content_types: List[str], 
        content_language: str,
        ws_channel: str
    ):
        """Queue knowledge for processing."""
        try:
            # Update status
            knowledge.status = "queued"
            self.db.commit()
            
            # Send status update
            await websocket_manager.publish_status(ws_channel, {
                "type": "processing_queued",
                "knowledge_id": knowledge.id,
                "status": "queued",
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Add to processing queue
            self.queue_manager.add_job(knowledge.id)
            
            # Also add content generation job if requested
            if content_types:
                self.queue_manager.add_content_generation_job(
                    knowledge_id=knowledge.id,
                    types=content_types,
                    language=content_language
                )
            
        except Exception as e:
            knowledge.status = "failed"
            knowledge.meta_data["queue_error"] = str(e)
            self.db.commit()
            
            await websocket_manager.publish_status(ws_channel, {
                "type": "queue_error",
                "knowledge_id": knowledge.id,
                "status": "failed",
                "error": f"Failed to queue for processing: {str(e)}",
                "timestamp": datetime.utcnow().isoformat()
            })

    async def list_knowledge(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> Tuple[List[KnowledgeResponse], int]:
        """List knowledge entries for a user."""
        query = self.db.query(Knowledge).filter(Knowledge.user_id == user_id)
        
        if status:
            query = query.filter(Knowledge.status == status)
        
        total = query.count()
        knowledge_entries = query.order_by(desc(Knowledge.created_at)).offset(skip).limit(limit).all()
        
        items = [
            KnowledgeResponse(
                id=k.id,
                name=k.name,
                content_type=k.content_type,
                status=k.status,
                created_at=k.created_at,
                user_id=k.user_id
            )
            for k in knowledge_entries
        ]
        
        return items, total

    async def get_knowledge(self, knowledge_id: int, user_id: int) -> Optional[KnowledgeResponse]:
        """Get a specific knowledge entry."""
        knowledge = self.db.query(Knowledge).filter(
            and_(Knowledge.id == knowledge_id, Knowledge.user_id == user_id)
        ).first()
        
        if not knowledge:
            return None
        
        return KnowledgeResponse(
            id=knowledge.id,
            name=knowledge.name,
            content_type=knowledge.content_type,
            status=knowledge.status,
            created_at=knowledge.created_at,
            user_id=knowledge.user_id
        )

    async def delete_knowledge(self, knowledge_id: int, user_id: int) -> bool:
        """Delete a knowledge entry and associated data."""
        knowledge = self.db.query(Knowledge).filter(
            and_(Knowledge.id == knowledge_id, Knowledge.user_id == user_id)
        ).first()
        
        if not knowledge:
            return False
        
        try:
            # Delete associated media files
            media_files = self.db.query(Media).filter(Media.knowledge_id == knowledge_id).all()
            for media in media_files:
                # TODO: Delete from storage
                self.db.delete(media)
            
            # Delete knowledge entry (cascading will handle chapters, etc.)
            self.db.delete(knowledge)
            self.db.commit()
            
            return True
        except Exception:
            self.db.rollback()
            raise

    def _get_content_type(self, file: UploadFile) -> str:
        """Determine content type based on file."""
        if not file.content_type:
            return "unknown"
        
        if file.content_type.startswith("video/"):
            return "video"
        elif file.content_type == "application/pdf":
            return "pdf"
        elif file.content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"]:
            return "document"
        elif file.content_type in ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-powerpoint"]:
            return "presentation"
        else:
            return "unknown"

    async def get_processing_status(self, knowledge_id: int, user_id: int) -> Dict[str, Any]:
        """Get the current processing status of a knowledge entry."""
        knowledge = self.db.query(Knowledge).filter(
            and_(Knowledge.id == knowledge_id, Knowledge.user_id == user_id)
        ).first()
        
        if not knowledge:
            raise ValueError("Knowledge entry not found")
        
        # Get queue status if available
        queue_status = None
        try:
            queue_status = await self.queue_manager.get_status(knowledge_id)
        except Exception:
            pass
        
        return {
            "knowledge_id": knowledge_id,
            "status": knowledge.status,
            "meta_data": knowledge.meta_data,
            "queue_status": queue_status,
            "last_updated": knowledge.updated_at if hasattr(knowledge, 'updated_at') else knowledge.created_at
        }
