from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import DatabaseManager
from models import ContentAnalytics, EngagementMetrics, PerformanceStats, User
from routes.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Require authentication for all analytics routes
router.dependencies = [Depends(get_current_user)]

def get_db():
    return DatabaseManager().get_session()

@router.get("/content/{knowledge_id}")
async def get_content_analytics(
    knowledge_id: int,
    db: Session = Depends(get_db)
):
    """Get content generation analytics for a specific knowledge entry."""
    analytics = db.query(ContentAnalytics).filter(
        ContentAnalytics.knowledge_id == knowledge_id
    ).all()
    
    if not analytics:
        raise HTTPException(status_code=404, detail="No analytics found for this knowledge ID")
    
    return {
        "knowledge_id": knowledge_id,
        "analytics": [
            {
                "content_type": entry.content_type,
                "language": entry.language,
                "generation_time": entry.generation_time,
                "success": entry.success,
                "error_message": entry.error_message,
                "created_at": entry.created_at
            }
            for entry in analytics
        ]
    }

@router.get("/engagement/{knowledge_id}")
async def get_engagement_metrics(
    knowledge_id: int,
    db: Session = Depends(get_db)
):
    """Get engagement metrics for a specific knowledge entry."""
    metrics = db.query(EngagementMetrics).filter(
        EngagementMetrics.knowledge_id == knowledge_id
    ).all()
    
    if not metrics:
        raise HTTPException(status_code=404, detail="No engagement metrics found for this knowledge ID")
    
    return {
        "knowledge_id": knowledge_id,
        "metrics": [
            {
                "chapter_id": entry.chapter_id,
                "views": entry.views,
                "completions": entry.completions,
                "avg_time_spent": entry.avg_time_spent,
                "created_at": entry.created_at
            }
            for entry in metrics
        ]
    }

@router.get("/performance")
async def get_performance_stats(
    operation_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get system performance statistics, optionally filtered by operation type."""
    query = db.query(PerformanceStats)
    
    if operation_type:
        query = query.filter(PerformanceStats.operation_type == operation_type)
    
    stats = query.order_by(PerformanceStats.timestamp.desc()).limit(limit).all()
    
    if not stats:
        raise HTTPException(status_code=404, detail="No performance statistics found")
    
    return {
        "stats": [
            {
                "operation_type": stat.operation_type,
                "duration": stat.duration,
                "success": stat.success,
                "error_count": stat.error_count,
                "timestamp": stat.timestamp
            }
            for stat in stats
        ],
        "summary": {
            "total_operations": len(stats),
            "success_rate": sum(1 for s in stats if s.success) / len(stats) * 100,
            "avg_duration": sum(s.duration for s in stats) / len(stats)
        }
    }