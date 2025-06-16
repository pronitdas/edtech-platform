from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.models.v2_models import EventTrackingRequest, UserProgressResponse, AnalyticsResponse
from src.services.analytics_service import AnalyticsService
from src.services.auth_service import get_current_user
from database import get_db
from models import User

router = APIRouter()

@router.post("/track-event")
async def track_event(
    event: EventTrackingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Track a user event for analytics."""
    try:
        analytics_service = AnalyticsService(db)
        await analytics_service.track_event(
            user_id=current_user.id,
            event_type=event.event_type,
            knowledge_id=event.knowledge_id,
            chapter_id=event.chapter_id,
            content_id=event.content_id,
            session_id=event.session_id,
            data=event.data
        )
        return {"success": True, "message": "Event tracked successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track event: {str(e)}")

@router.get("/user/{user_id}/progress", response_model=List[UserProgressResponse])
async def get_user_progress(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user progress across all knowledge entries."""
    try:
        # Users can only view their own progress, or admins can view any
        if user_id != current_user.id and "admin" not in getattr(current_user, "roles", []):
            raise HTTPException(status_code=403, detail="Access denied")
            
        analytics_service = AnalyticsService(db)
        progress = await analytics_service.get_user_progress(user_id)
        return progress
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user progress: {str(e)}")

@router.get("/user/{user_id}/completion")
async def get_user_completion(
    user_id: int,
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user completion statistics."""
    try:
        if user_id != current_user.id and "admin" not in getattr(current_user, "roles", []):
            raise HTTPException(status_code=403, detail="Access denied")
            
        analytics_service = AnalyticsService(db)
        completion = await analytics_service.get_completion_stats(user_id, course_id)
        return {"success": True, "data": completion}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get completion stats: {str(e)}")

@router.get("/user/{user_id}/sessions")
async def get_user_sessions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user session history."""
    try:
        if user_id != current_user.id and "admin" not in getattr(current_user, "roles", []):
            raise HTTPException(status_code=403, detail="Access denied")
            
        analytics_service = AnalyticsService(db)
        sessions = await analytics_service.get_user_sessions(user_id)
        return {"success": True, "data": sessions}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user sessions: {str(e)}")

@router.get("/user/{user_id}/interactions")
async def get_user_interactions(
    user_id: int,
    content_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user interaction history."""
    try:
        if user_id != current_user.id and "admin" not in getattr(current_user, "roles", []):
            raise HTTPException(status_code=403, detail="Access denied")
            
        analytics_service = AnalyticsService(db)
        interactions = await analytics_service.get_user_interactions(user_id, content_id)
        return {"success": True, "data": interactions}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user interactions: {str(e)}")

@router.get("/user/{user_id}/numeric-summary")
async def get_numeric_summary(
    user_id: int,
    event_type: Optional[str] = Query(None),
    json_key: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get numeric summary of user events."""
    try:
        if user_id != current_user.id and "admin" not in getattr(current_user, "roles", []):
            raise HTTPException(status_code=403, detail="Access denied")
            
        analytics_service = AnalyticsService(db)
        summary = await analytics_service.get_numeric_summary(user_id, event_type, json_key)
        return {"success": True, "data": summary}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get numeric summary: {str(e)}")

@router.get("/knowledge/{knowledge_id}/interactions")
async def get_knowledge_interactions(
    knowledge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get interaction statistics for a knowledge entry."""
    try:
        analytics_service = AnalyticsService(db)
        interactions = await analytics_service.get_knowledge_interactions(knowledge_id, current_user.id)
        return {"success": True, "data": interactions}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get knowledge interactions: {str(e)}")

@router.get("/knowledge/{knowledge_id}/video-stats")
async def get_video_stats(
    knowledge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get video viewing statistics for a knowledge entry."""
    try:
        analytics_service = AnalyticsService(db)
        stats = await analytics_service.get_video_stats(knowledge_id, current_user.id)
        return {"success": True, "data": stats}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get video stats: {str(e)}")

@router.get("/knowledge/{knowledge_id}/quiz-stats")
async def get_quiz_stats(
    knowledge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get quiz completion statistics for a knowledge entry."""
    try:
        analytics_service = AnalyticsService(db)
        stats = await analytics_service.get_quiz_stats(knowledge_id, current_user.id)
        return {"success": True, "data": stats}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quiz stats: {str(e)}")
