from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.models.v2_models import HealthCheckResponse
from src.services.admin_service import AdminService
from src.services.auth_service import get_current_user
from database import get_db
from models import User

router = APIRouter()

@router.get("/health/full", response_model=HealthCheckResponse)
async def full_health_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive health status of all system components."""
    try:
        # Check if user has admin permissions
        if "admin" not in getattr(current_user, "roles", []):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_service = AdminService(db)
        health_status = await admin_service.get_full_health_check()
        
        return HealthCheckResponse(
            status=health_status["status"],
            timestamp=datetime.utcnow(),
            services=health_status["services"],
            version=health_status.get("version", "unknown")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@router.get("/health/basic")
async def basic_health_check():
    """Basic health check endpoint (no authentication required)."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "service": "media-uploader-api"
    }

@router.get("/metrics")
async def get_system_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system performance metrics."""
    try:
        if "admin" not in getattr(current_user, "roles", []):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_service = AdminService(db)
        metrics = await admin_service.get_system_metrics()
        return {"success": True, "data": metrics}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")

@router.get("/stats")
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system usage statistics."""
    try:
        if "admin" not in getattr(current_user, "roles", []):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_service = AdminService(db)
        stats = await admin_service.get_system_stats()
        return {"success": True, "data": stats}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@router.post("/maintenance/cleanup")
async def cleanup_old_data(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clean up old data (logs, temporary files, etc.)."""
    try:
        if "admin" not in getattr(current_user, "roles", []):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        admin_service = AdminService(db)
        result = await admin_service.cleanup_old_data(days)
        return {"success": True, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")
