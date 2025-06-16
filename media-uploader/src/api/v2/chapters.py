from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.models.v2_models import ChapterUpdate
from src.services.chapter_service import ChapterService
from src.services.auth_service import get_current_user
from database import get_db
from models import User

router = APIRouter()

@router.get("/{knowledge_id}")
async def get_chapters(
    knowledge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all chapters for a knowledge entry."""
    try:
        chapter_service = ChapterService(db)
        chapters = await chapter_service.get_chapters(knowledge_id, current_user.id)
        return {"success": True, "data": chapters}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chapters: {str(e)}")

@router.put("/{knowledge_id}/{chapter_id}")
async def update_chapter(
    knowledge_id: int,
    chapter_id: str,
    chapter_update: ChapterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update chapter content (notes, summary, quiz, mindmap)."""
    try:
        chapter_service = ChapterService(db)
        updated_chapter = await chapter_service.update_chapter(
            knowledge_id, chapter_id, chapter_update, current_user.id
        )
        return {"success": True, "data": updated_chapter}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update chapter: {str(e)}")

@router.get("/{knowledge_id}/{chapter_id}")
async def get_chapter(
    knowledge_id: int,
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific chapter by ID."""
    try:
        chapter_service = ChapterService(db)
        chapter = await chapter_service.get_chapter(knowledge_id, chapter_id, current_user.id)
        return {"success": True, "data": chapter}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chapter: {str(e)}")
