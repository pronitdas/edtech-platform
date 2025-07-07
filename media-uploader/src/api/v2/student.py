from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from database import get_db
from src.services.auth_service import get_current_user
from models import User
import datetime

router = APIRouter()

@router.get("/progress")
async def get_student_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student's learning progress."""
    try:
        # Get student progress from database
        progress_query = db.execute("""
            SELECT 
                sp.knowledge_id,
                k.name as knowledge_name,
                sp.progress_percentage,
                sp.study_time_minutes,
                sp.completed_at,
                sp.updated_at
            FROM student_progress sp
            JOIN knowledge k ON sp.knowledge_id = k.id
            WHERE sp.user_id = :user_id
            ORDER BY sp.updated_at DESC
        """, {"user_id": current_user.id}).fetchall()
        
        progress_data = [
            {
                "knowledge_id": row.knowledge_id,
                "knowledge_name": row.knowledge_name,
                "progress_percentage": row.progress_percentage,
                "study_time_minutes": row.study_time_minutes,
                "completed_at": row.completed_at,
                "updated_at": row.updated_at
            }
            for row in progress_query
        ]
        
        return {"success": True, "data": progress_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")

@router.get("/assignments") 
async def get_student_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student's content assignments."""
    try:
        assignments_query = db.execute("""
            SELECT 
                ca.id,
                ca.title,
                ca.description,
                ca.due_date,
                ca.status,
                ca.created_at,
                k.name as knowledge_name,
                u.display_name as teacher_name
            FROM content_assignments ca
            JOIN knowledge k ON ca.knowledge_id = k.id
            JOIN users u ON ca.teacher_id = u.id
            WHERE ca.student_id = :user_id
            ORDER BY ca.due_date ASC
        """, {"user_id": current_user.id}).fetchall()
        
        assignments = [
            {
                "id": row.id,
                "title": row.title,
                "description": row.description,
                "due_date": row.due_date,
                "status": row.status,
                "created_at": row.created_at,
                "knowledge_name": row.knowledge_name,
                "teacher_name": row.teacher_name
            }
            for row in assignments_query
        ]
        
        return {"success": True, "data": assignments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get assignments: {str(e)}")

@router.get("/achievements")
async def get_student_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student's achievements."""
    try:
        achievements_query = db.execute("""
            SELECT 
                id,
                achievement_type,
                title,
                description,
                points,
                unlocked_at
            FROM user_achievements
            WHERE user_id = :user_id
            ORDER BY unlocked_at DESC
        """, {"user_id": current_user.id}).fetchall()
        
        achievements = [
            {
                "id": row.id,
                "achievement_type": row.achievement_type,
                "title": row.title,
                "description": row.description,
                "points": row.points,
                "unlocked_at": row.unlocked_at
            }
            for row in achievements_query
        ]
        
        return {"success": True, "data": achievements}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get achievements: {str(e)}")

@router.get("/dashboard-stats")
async def get_student_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student dashboard statistics."""
    try:
        # Calculate various stats
        stats = {}
        
        # Total study time
        total_study_time = db.execute("""
            SELECT COALESCE(SUM(study_time_minutes), 0) as total_time
            FROM student_progress 
            WHERE user_id = :user_id
        """, {"user_id": current_user.id}).scalar()
        
        # Completed courses
        completed_courses = db.execute("""
            SELECT COUNT(*) as completed
            FROM student_progress 
            WHERE user_id = :user_id AND progress_percentage >= 100
        """, {"user_id": current_user.id}).scalar()
        
        # Active assignments
        active_assignments = db.execute("""
            SELECT COUNT(*) as active
            FROM content_assignments 
            WHERE student_id = :user_id AND status = 'assigned'
        """, {"user_id": current_user.id}).scalar()
        
        # Total achievements
        total_achievements = db.execute("""
            SELECT COUNT(*) as total
            FROM user_achievements 
            WHERE user_id = :user_id
        """, {"user_id": current_user.id}).scalar()
        
        stats = {
            "total_study_time_minutes": total_study_time or 0,
            "completed_courses": completed_courses or 0,
            "active_assignments": active_assignments or 0,
            "total_achievements": total_achievements or 0
        }
        
        return {"success": True, "data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")