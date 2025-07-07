from typing import List, Dict, Any, Optional
import asyncio
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models import Knowledge
from queue_manager import QueueManager
from database import DatabaseManager

class ContentService:
    def __init__(self, db: Session):
        self.db = db
        self.db_manager = DatabaseManager()
        self.queue_manager = QueueManager(self.db_manager)
        self._generation_tasks = {}  # In-memory task tracking

    async def validate_user_access(self, knowledge_id: int, user_id: int) -> None:
        """Validate that the user has access to the knowledge entry."""
        knowledge = self.db.query(Knowledge).filter(
            and_(Knowledge.id == knowledge_id, Knowledge.user_id == user_id)
        ).first()
        
        if not knowledge:
            raise ValueError("Knowledge entry not found or access denied")

    async def generate_content_async(
        self, 
        knowledge_id: int, 
        content_types: List[str], 
        language: str = "English"
    ) -> str:
        """Start asynchronous content generation."""
        task_id = str(uuid.uuid4())
        
        # Store task info
        self._generation_tasks[task_id] = {
            "status": "started",
            "knowledge_id": knowledge_id,
            "content_types": content_types,
            "language": language,
            "progress": 0,
            "message": "Content generation started"
        }
        
        try:
            # Add to queue for processing
            await self.queue_manager.add_to_queue(
                knowledge_id=knowledge_id,
                task_type="content_generation",
                task_data={
                    "content_types": content_types,
                    "language": language,
                    "task_id": task_id
                }
            )
            
            self._generation_tasks[task_id]["status"] = "queued"
            self._generation_tasks[task_id]["message"] = "Task queued for processing"
            
        except Exception as e:
            self._generation_tasks[task_id]["status"] = "failed"
            self._generation_tasks[task_id]["message"] = f"Failed to queue task: {str(e)}"
            raise
        
        return task_id

    async def get_generation_status(self, task_id: str, user_id: int) -> Dict[str, Any]:
        """Get the status of a content generation task."""
        if task_id not in self._generation_tasks:
            raise ValueError("Task not found")
        
        task_info = self._generation_tasks[task_id]
        
        # Verify user has access to the knowledge
        await self.validate_user_access(task_info["knowledge_id"], user_id)
        
        # Check queue status if still processing
        if task_info["status"] in ["started", "queued", "processing"]:
            try:
                queue_status = await self.queue_manager.get_status(task_info["knowledge_id"])
                if queue_status:
                    task_info["status"] = queue_status.get("status", task_info["status"])
                    task_info["message"] = queue_status.get("message", task_info["message"])
                    task_info["progress"] = queue_status.get("progress", task_info["progress"])
            except Exception:
                # If we can't get queue status, keep current status
                pass
        
        return task_info

    async def regenerate_content(
        self, 
        knowledge_id: int, 
        chapter_id: Optional[str] = None,
        content_types: List[str] = None,
        language: str = "English",
        user_id: int = None
    ) -> str:
        """Regenerate specific content for a knowledge entry or chapter."""
        await self.validate_user_access(knowledge_id, user_id)
        
        if not content_types:
            content_types = ["notes", "summary", "quiz", "mindmap"]
        
        task_id = str(uuid.uuid4())
        
        self._generation_tasks[task_id] = {
            "status": "started",
            "knowledge_id": knowledge_id,
            "chapter_id": chapter_id,
            "content_types": content_types,
            "language": language,
            "progress": 0,
            "message": "Content regeneration started"
        }
        
        try:
            await self.queue_manager.add_to_queue(
                knowledge_id=knowledge_id,
                task_type="content_regeneration",
                task_data={
                    "chapter_id": chapter_id,
                    "content_types": content_types,
                    "language": language,
                    "task_id": task_id
                }
            )
            
            self._generation_tasks[task_id]["status"] = "queued"
            self._generation_tasks[task_id]["message"] = "Regeneration task queued"
            
        except Exception as e:
            self._generation_tasks[task_id]["status"] = "failed"
            self._generation_tasks[task_id]["message"] = f"Failed to queue regeneration: {str(e)}"
            raise
        
        return task_id

    def cleanup_completed_tasks(self, max_age_hours: int = 24) -> None:
        """Clean up old completed tasks from memory."""
        import time
        from datetime import datetime, timedelta
        
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)
        
        tasks_to_remove = []
        for task_id, task_info in self._generation_tasks.items():
            if (task_info["status"] in ["completed", "failed"] and 
                "created_at" in task_info and 
                task_info["created_at"] < cutoff_time):
                tasks_to_remove.append(task_id)
        
        for task_id in tasks_to_remove:
            del self._generation_tasks[task_id]
