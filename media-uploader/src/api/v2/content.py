from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from src.models.v2_models import ContentGenerationRequest
from src.services.content_service import ContentService
from src.services.auth_service import get_current_user
from database import get_db
from models import User

router = APIRouter()

@router.post("/generate/{knowledge_id}")
async def generate_content(
    knowledge_id: int,
    request: ContentGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually trigger content generation for a knowledge entry."""
    try:
        content_service = ContentService(db)
        
        # Validate user has access to this knowledge
        await content_service.validate_user_access(knowledge_id, current_user.id)
        
        # Start background content generation
        task_id = await content_service.generate_content_async(
            knowledge_id, request.content_types, request.language
        )
        
        return {
            "success": True,
            "message": "Content generation started",
            "task_id": task_id,
            "knowledge_id": knowledge_id
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start content generation: {str(e)}")

@router.get("/status/{task_id}")
async def get_generation_status(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the status of a content generation task."""
    try:
        content_service = ContentService(db)
        status = await content_service.get_generation_status(task_id, current_user.id)
        return {"success": True, "data": status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get generation status: {str(e)}")
