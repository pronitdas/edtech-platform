from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models import Knowledge, Chapter, EdTechContent
from src.models.v2_models import ChapterUpdate

class ChapterService:
    def __init__(self, db: Session):
        self.db = db

    async def get_chapters(self, knowledge_id: int, user_id: int) -> List[Dict[str, Any]]:
        """Get all chapters for a knowledge entry."""
        # First verify user has access to this knowledge
        knowledge = self.db.query(Knowledge).filter(
            and_(Knowledge.id == knowledge_id, Knowledge.user_id == user_id)
        ).first()
        
        if not knowledge:
            raise ValueError("Knowledge entry not found or access denied")
        
        # Get chapters with their content
        chapters = self.db.query(Chapter).filter(Chapter.knowledge_id == knowledge_id).all()
        
        result = []
        for chapter in chapters:
            # Get edtech content for this chapter
            content = self.db.query(EdTechContent).filter(
                and_(
                    EdTechContent.knowledge_id == knowledge_id,
                    EdTechContent.chapter_id == chapter.id
                )
            ).first()
            
            chapter_data = {
                "id": chapter.id,
                "knowledge_id": chapter.knowledge_id,
                "content": chapter.content,
                "meta_data": chapter.meta_data,
                "notes": content.notes if content else None,
                "summary": content.summary if content else None,
                "quiz": content.quiz if content else None,
                "mindmap": content.mindmap if content else None,
                "language": content.language if content else "English",
                "created_at": content.created_at if content else None,
                "updated_at": content.updated_at if content else None
            }
            result.append(chapter_data)
        
        return result

    async def get_chapter(self, knowledge_id: int, chapter_id: str, user_id: int) -> Dict[str, Any]:
        """Get a specific chapter by ID."""
        # Verify user has access to this knowledge
        knowledge = self.db.query(Knowledge).filter(
            and_(Knowledge.id == knowledge_id, Knowledge.user_id == user_id)
        ).first()
        
        if not knowledge:
            raise ValueError("Knowledge entry not found or access denied")
        
        # Get the chapter
        chapter = self.db.query(Chapter).filter(
            and_(Chapter.id == chapter_id, Chapter.knowledge_id == knowledge_id)
        ).first()
        
        if not chapter:
            raise ValueError("Chapter not found")
        
        # Get edtech content for this chapter
        content = self.db.query(EdTechContent).filter(
            and_(
                EdTechContent.knowledge_id == knowledge_id,
                EdTechContent.chapter_id == chapter_id
            )
        ).first()
        
        return {
            "id": chapter.id,
            "knowledge_id": chapter.knowledge_id,
            "content": chapter.content,
            "meta_data": chapter.meta_data,
            "notes": content.notes if content else None,
            "summary": content.summary if content else None,
            "quiz": content.quiz if content else None,
            "mindmap": content.mindmap if content else None,
            "language": content.language if content else "English",
            "created_at": content.created_at if content else None,
            "updated_at": content.updated_at if content else None
        }

    async def update_chapter(
        self, 
        knowledge_id: int, 
        chapter_id: str, 
        chapter_update: ChapterUpdate, 
        user_id: int
    ) -> Dict[str, Any]:
        """Update chapter content (notes, summary, quiz, mindmap)."""
        # Verify user has access to this knowledge
        knowledge = self.db.query(Knowledge).filter(
            and_(Knowledge.id == knowledge_id, Knowledge.user_id == user_id)
        ).first()
        
        if not knowledge:
            raise PermissionError("Access denied to this knowledge entry")
        
        # Verify chapter exists
        chapter = self.db.query(Chapter).filter(
            and_(Chapter.id == chapter_id, Chapter.knowledge_id == knowledge_id)
        ).first()
        
        if not chapter:
            raise ValueError("Chapter not found")
        
        # Get or create edtech content
        content = self.db.query(EdTechContent).filter(
            and_(
                EdTechContent.knowledge_id == knowledge_id,
                EdTechContent.chapter_id == chapter_id
            )
        ).first()
        
        if not content:
            content = EdTechContent(
                knowledge_id=knowledge_id,
                chapter_id=chapter_id,
                language="English"
            )
            self.db.add(content)
        
        # Update only provided fields
        if chapter_update.notes is not None:
            content.notes = chapter_update.notes
        if chapter_update.summary is not None:
            content.summary = chapter_update.summary
        if chapter_update.quiz is not None:
            content.quiz = chapter_update.quiz
        if chapter_update.mindmap is not None:
            content.mindmap = chapter_update.mindmap
        
        self.db.commit()
        self.db.refresh(content)
        
        return {
            "id": chapter.id,
            "knowledge_id": chapter.knowledge_id,
            "content": chapter.content,
            "meta_data": chapter.meta_data,
            "notes": content.notes,
            "summary": content.summary,
            "quiz": content.quiz,
            "mindmap": content.mindmap,
            "language": content.language,
            "created_at": content.created_at,
            "updated_at": content.updated_at
        }
