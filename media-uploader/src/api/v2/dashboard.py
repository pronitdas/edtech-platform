"""
V2 Dashboard API endpoints
Provides real dashboard data for user analytics and progress tracking
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging

from src.middleware.kratos_auth import get_current_user
from database import get_db
from models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v2/dashboard", tags=["dashboard"])

@router.get("/user/{user_id}/dashboard-stats")
async def get_dashboard_stats(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive dashboard statistics for a user"""
    
    try:
        # Verify user access
        if current_user["user_id"] != user_id:
            # Allow teachers to view any student's stats, students can only view their own
            user = db.query(User).filter(User.id == current_user["user_id"]).first()
            if not user or "teacher" not in (user.roles or []):
                raise HTTPException(status_code=403, detail="Access denied")
        
        # Calculate dashboard statistics
        stats = {
            "total_courses": 0,
            "completed_lessons": 0,
            "study_time_this_week": 0,
            "achievements_earned": 0,
            "total_time_spent": 0,
            "completion_rate": 0,
            "average_score": 0,
            "streak_days": 0,
            "total_activities": 0,
            "current_level": 1
        }
        
        # Try to get real statistics from various tables
        try:
            # Get course/knowledge progress
            progress_query = db.execute("""
                SELECT 
                    COUNT(DISTINCT knowledge_id) as total_courses,
                    AVG(progress_percentage) as avg_progress,
                    SUM(CASE WHEN progress_percentage >= 100 THEN 1 ELSE 0 END) as completed_courses
                FROM user_progress 
                WHERE user_id = :user_id
            """, {"user_id": user_id})
            progress_result = progress_query.fetchone()
            
            if progress_result:
                stats["total_courses"] = progress_result[0] or 0
                stats["completion_rate"] = round(progress_result[1] or 0, 1)
                stats["completed_lessons"] = progress_result[2] or 0
        
        except Exception as e:
            logger.warning(f"Could not fetch progress data: {e}")
        
        try:
            # Get session/time data for this week
            week_ago = datetime.now() - timedelta(days=7)
            session_query = db.execute("""
                SELECT 
                    COALESCE(SUM(total_time_seconds), 0) / 60 as study_time_minutes,
                    COUNT(*) as session_count
                FROM session_info 
                WHERE user_id = :user_id AND session_start >= :week_ago
            """, {"user_id": user_id, "week_ago": week_ago})
            session_result = session_query.fetchone()
            
            if session_result:
                stats["study_time_this_week"] = int(session_result[0] or 0)
                stats["total_activities"] = session_result[1] or 0
        
        except Exception as e:
            logger.warning(f"Could not fetch session data: {e}")
        
        try:
            # Get analytics events for achievements and scores
            events_query = db.execute("""
                SELECT 
                    event_type,
                    COUNT(*) as count,
                    AVG(CAST(event_data->>'score' AS INTEGER)) as avg_score
                FROM analytics_events 
                WHERE user_id = :user_id 
                    AND event_data->>'score' IS NOT NULL
                    AND event_data->>'score' != 'null'
                GROUP BY event_type
            """, {"user_id": user_id})
            events_results = events_query.fetchall()
            
            total_score_events = 0
            total_score_sum = 0
            
            for event_type, count, avg_score in events_results:
                total_score_events += count
                if avg_score:
                    total_score_sum += avg_score * count
                    
                # Count achievements
                if event_type in ['achievement_earned', 'badge_earned', 'milestone_reached']:
                    stats["achievements_earned"] += count
            
            if total_score_events > 0:
                stats["average_score"] = round(total_score_sum / total_score_events, 1)
        
        except Exception as e:
            logger.warning(f"Could not fetch analytics events: {e}")
        
        # Calculate level based on total time and activities
        total_minutes = stats["study_time_this_week"] + (stats["total_activities"] * 10)
        stats["current_level"] = max(1, min(10, (total_minutes // 60) + 1))
        
        # Calculate streak (simplified - days with activity)
        try:
            streak_query = db.execute("""
                SELECT COUNT(DISTINCT DATE(session_start)) as active_days
                FROM session_info 
                WHERE user_id = :user_id 
                    AND session_start >= :week_ago
            """, {"user_id": user_id, "week_ago": week_ago})
            streak_result = streak_query.fetchone()
            
            if streak_result:
                stats["streak_days"] = streak_result[0] or 0
        
        except Exception as e:
            logger.warning(f"Could not calculate streak: {e}")
        
        return {
            "success": True,
            "data": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/user/{user_id}/recent-activity")
async def get_recent_activity(
    user_id: int,
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent learning activity for a user"""
    
    try:
        # Verify user access
        if current_user["user_id"] != user_id:
            user = db.query(User).filter(User.id == current_user["user_id"]).first()
            if not user or "teacher" not in (user.roles or []):
                raise HTTPException(status_code=403, detail="Access denied")
        
        activities = []
        
        try:
            # Get recent analytics events
            events_query = db.execute("""
                SELECT 
                    event_type,
                    event_data,
                    created_at
                FROM analytics_events 
                WHERE user_id = :user_id 
                ORDER BY created_at DESC 
                LIMIT :limit
            """, {"user_id": user_id, "limit": limit})
            events_results = events_query.fetchall()
            
            for event_type, event_data, created_at in events_results:
                activity = {
                    "id": f"event_{created_at.timestamp()}",
                    "type": map_event_type_to_activity_type(event_type),
                    "title": format_activity_title(event_type, event_data),
                    "timestamp": format_timestamp(created_at),
                }
                
                # Add score if available
                if event_data and isinstance(event_data, dict) and event_data.get('score'):
                    try:
                        activity["progress"] = int(event_data['score'])
                    except (ValueError, TypeError):
                        pass
                
                activities.append(activity)
        
        except Exception as e:
            logger.warning(f"Could not fetch recent events: {e}")
        
        # If no activities from events, try to get from sessions
        if not activities:
            try:
                session_query = db.execute("""
                    SELECT 
                        session_start,
                        session_end,
                        total_time_seconds,
                        pages_visited
                    FROM session_info 
                    WHERE user_id = :user_id 
                    ORDER BY session_start DESC 
                    LIMIT :limit
                """, {"user_id": user_id, "limit": limit})
                session_results = session_query.fetchall()
                
                for session_start, session_end, total_time, pages_visited in session_results:
                    activities.append({
                        "id": f"session_{session_start.timestamp()}",
                        "type": "lesson",
                        "title": f"Learning Session ({pages_visited} pages)",
                        "timestamp": format_timestamp(session_start),
                        "timeSpent": round(total_time / 60) if total_time else None
                    })
            
            except Exception as e:
                logger.warning(f"Could not fetch session data: {e}")
        
        return {
            "success": True,
            "data": activities
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recent activity: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def map_event_type_to_activity_type(event_type: str) -> str:
    """Map analytics event types to activity types"""
    mapping = {
        "chapter_completed": "lesson",
        "quiz_attempt": "quiz",
        "quiz_completed": "quiz",
        "video_watched": "lesson",
        "content_uploaded": "upload",
        "file_uploaded": "upload",
        "practice_completed": "lesson",
        "achievement_earned": "lesson"
    }
    return mapping.get(event_type, "lesson")

def format_activity_title(event_type: str, event_data: dict) -> str:
    """Format activity title based on event type and data"""
    if not event_data:
        return f"Completed {event_type.replace('_', ' ').title()}"
    
    titles = {
        "chapter_completed": f"Completed Chapter: {event_data.get('chapter_id', 'Unknown')}",
        "quiz_attempt": f"Attempted Quiz: {event_data.get('quiz_id', 'Unknown')}",
        "quiz_completed": f"Completed Quiz: {event_data.get('quiz_id', 'Unknown')}",
        "video_watched": f"Watched Video: {event_data.get('video_title', 'Unknown')}",
        "content_uploaded": f"Uploaded {event_data.get('content_type', 'Content')}",
        "file_uploaded": f"Uploaded File: {event_data.get('filename', 'Unknown')}",
        "practice_completed": f"Completed Practice: {event_data.get('practice_type', 'Exercise')}",
        "achievement_earned": f"Earned Achievement: {event_data.get('achievement_name', 'Unknown')}"
    }
    
    return titles.get(event_type, f"Completed {event_type.replace('_', ' ').title()}")

def format_timestamp(dt: datetime) -> str:
    """Format timestamp for display"""
    now = datetime.now()
    diff = now - dt
    
    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "Just now"