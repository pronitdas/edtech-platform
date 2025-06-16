from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Path, Query
from sqlalchemy.orm import Session
from database import DatabaseManager, get_db as get_database_session
from models import ContentAnalytics, EngagementMetrics, PerformanceStats, User
from routes.auth import get_current_user

router = APIRouter(
    prefix="/analytics", 
    tags=["Analytics"],
    dependencies=[Depends(get_current_user)]  # Require authentication for all analytics routes
)

def get_db():
    return get_database_session()

@router.get(
    "/dashboard",
    summary="📊 Analytics Dashboard",
    description="""
    Get comprehensive analytics dashboard with system overview.
    
    **Includes:**
    - Total knowledge entries processed
    - Content generation statistics
    - System performance metrics
    - Recent activity summary
    
    **Perfect for:**
    - System monitoring
    - Performance tracking
    - Usage analytics
    """,
    response_description="Complete analytics dashboard data",
    responses={
        200: {
            "description": "Dashboard data retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "overview": {
                            "total_knowledge_entries": 150,
                            "total_content_generated": 450,
                            "success_rate": 95.2,
                            "avg_processing_time": "2.3 minutes"
                        },
                        "recent_activity": {
                            "last_24h": {
                                "uploads": 12,
                                "processing_completed": 10,
                                "content_generated": 35
                            }
                        },
                        "performance": {
                            "avg_response_time": "1.2s",
                            "error_rate": 0.8,
                            "uptime": "99.9%"
                        }
                    }
                }
            }
        }
    }
)
async def get_analytics_dashboard(
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics dashboard."""
    # This would be implemented with actual dashboard logic
    return {
        "message": "Analytics dashboard endpoint - implementation needed",
        "status": "placeholder"
    }

@router.get(
    "/content/{knowledge_id}",
    summary="📈 Content Analytics",
    description="""
    Get detailed content generation analytics for a specific knowledge entry.
    
    **Analytics Include:**
    - Content generation success rates
    - Processing times by content type
    - Error tracking and debugging info
    - Language-specific performance
    
    **Content Types Tracked:**
    - Notes generation
    - Summary creation
    - Quiz generation
    - Mind map creation
    """,
    response_description="Content generation analytics and metrics",
    responses={
        200: {
            "description": "Content analytics retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "knowledge_id": 123,
                        "analytics": [
                            {
                                "content_type": "notes",
                                "language": "English",
                                "generation_time": 45.2,
                                "success": True,
                                "error_message": None,
                                "created_at": "2024-12-16T15:00:00Z"
                            }
                        ]
                    }
                }
            }
        },
        404: {
            "description": "No analytics found for this knowledge entry",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "No analytics found for this knowledge ID"
                    }
                }
            }
        }
    }
)
async def get_content_analytics(
    knowledge_id: int = Path(
        ..., 
        description="ID of the knowledge entry to analyze",
        example=123
    ),
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

@router.get(
    "/engagement/{knowledge_id}",
    summary="👥 Engagement Metrics",
    description="""
    Get user engagement metrics for a specific knowledge entry.
    
    **Metrics Include:**
    - Chapter view counts
    - Completion rates
    - Time spent per chapter
    - User interaction patterns
    
    **Use Cases:**
    - Content effectiveness analysis
    - User behavior insights
    - Learning path optimization
    """,
    response_description="User engagement metrics and statistics",
    responses={
        200: {
            "description": "Engagement metrics retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "knowledge_id": 123,
                        "metrics": [
                            {
                                "chapter_id": "ch_001",
                                "views": 45,
                                "completions": 38,
                                "avg_time_spent": 12.5,
                                "created_at": "2024-12-16T15:00:00Z"
                            }
                        ]
                    }
                }
            }
        },
        404: {
            "description": "No engagement metrics found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "No engagement metrics found for this knowledge ID"
                    }
                }
            }
        }
    }
)
async def get_engagement_metrics(
    knowledge_id: int = Path(
        ..., 
        description="ID of the knowledge entry to analyze",
        example=123
    ),
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

@router.get(
    "/performance",
    summary="⚡ Performance Statistics",
    description="""
    Get system performance statistics and operational metrics.
    
    **Performance Metrics:**
    - Operation duration tracking
    - Success/failure rates
    - Error frequency analysis
    - System resource utilization
    
    **Operation Types:**
    - `upload`: File upload operations
    - `processing`: Content processing
    - `generation`: Content generation
    - `storage`: File storage operations
    
    **Filtering Options:**
    - Filter by operation type
    - Limit number of results
    - Time-based filtering (future enhancement)
    """,
    response_description="System performance statistics and summary",
    responses={
        200: {
            "description": "Performance statistics retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "stats": [
                            {
                                "operation_type": "processing",
                                "duration": 125.5,
                                "success": True,
                                "error_count": 0,
                                "timestamp": "2024-12-16T15:00:00Z"
                            }
                        ],
                        "summary": {
                            "total_operations": 100,
                            "success_rate": 95.0,
                            "avg_duration": 98.7
                        }
                    }
                }
            }
        },
        404: {
            "description": "No performance statistics found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "No performance statistics found"
                    }
                }
            }
        }
    }
)
async def get_performance_stats(
    operation_type: Optional[str] = Query(
        None, 
        description="Filter by operation type (upload, processing, generation, storage)",
        example="processing"
    ),
    limit: int = Query(
        100, 
        description="Maximum number of records to return",
        ge=1,
        le=1000
    ),
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