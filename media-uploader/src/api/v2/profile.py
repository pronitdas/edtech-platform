"""
Profile management API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import Dict, List, Any, Optional
from database import get_db
from src.services.profile_service import ProfileService
from src.services.auth_service import AuthService

router = APIRouter()

# Request/Response Models
class ProfileUpdateRequest(BaseModel):
    settings: Dict[str, Any]

class ApiKeyRequest(BaseModel):
    provider_name: str
    api_key: str
    
    @validator('provider_name')
    def validate_provider_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Provider name cannot be empty')
        return v.strip().lower()
    
    @validator('api_key')
    def validate_api_key(cls, v):
        if not v or not v.strip():
            raise ValueError('API key cannot be empty')
        return v.strip()

class ApiKeyDeleteRequest(BaseModel):
    provider_name: str

# Helper function to get current user
async def get_current_user_id(authorization: str = Header(None), db: Session = Depends(get_db)) -> int:
    """Get current user ID from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    auth_service = AuthService(db)
    user = await auth_service.get_current_user_from_token(authorization)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user.id

# Profile Endpoints
@router.get("/profile")
async def get_profile(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get user profile including settings and API key info"""
    profile_service = ProfileService(db)
    
    profile = profile_service.get_user_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Add API keys info (masked)
    api_keys = profile_service.get_api_keys(user_id)
    profile["api_keys"] = api_keys
    
    return profile

@router.put("/profile/settings")
async def update_profile_settings(
    request: ProfileUpdateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update user profile settings"""
    profile_service = ProfileService(db)
    
    try:
        result = profile_service.update_profile_settings(user_id, request.settings)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# API Key Management Endpoints
@router.get("/profile/api-keys")
async def get_api_keys(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all API keys for the user (masked for security)"""
    profile_service = ProfileService(db)
    return {"api_keys": profile_service.get_api_keys(user_id)}

@router.post("/profile/api-keys")
async def add_api_key(
    request: ApiKeyRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add or update an API key for a provider"""
    profile_service = ProfileService(db)
    
    try:
        result = profile_service.add_api_key(user_id, request.provider_name, request.api_key)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/profile/api-keys/{provider_name}")
async def delete_api_key(
    provider_name: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete an API key for a provider"""
    profile_service = ProfileService(db)
    
    try:
        result = profile_service.delete_api_key(user_id, provider_name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/profile/api-keys/{provider_name}/test")
async def test_api_key(
    provider_name: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Test an API key by making a simple API call"""
    profile_service = ProfileService(db)
    
    try:
        result = profile_service.test_api_key(user_id, provider_name)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profile/providers")
async def get_supported_providers():
    """Get list of supported API providers"""
    profile_service = ProfileService(None)  # No DB needed for this
    return {"providers": profile_service.get_supported_providers()}

# Security endpoint to check API key access
@router.get("/profile/api-keys/{provider_name}/status")
async def get_api_key_status(
    provider_name: str,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Check if user has an active API key for a provider"""
    profile_service = ProfileService(db)
    
    api_key = profile_service.get_api_key(user_id, provider_name)
    
    return {
        "provider": provider_name,
        "has_key": api_key is not None,
        "status": "active" if api_key else "not_configured"
    }