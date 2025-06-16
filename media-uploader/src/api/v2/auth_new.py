from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from database import get_db
from src.services.auth_service import AuthService
from src.models.v2_models import RegisterRequest, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user via Kratos"""
    auth_service = AuthService(db)
    result = await auth_service.register(request.email, request.password, request.name)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return TokenResponse(**result)

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user via Kratos"""
    auth_service = AuthService(db)
    result = await auth_service.login(request.email, request.password)
    
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    
    return TokenResponse(**result)

@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)"""
    return {"message": "Logged out successfully"}

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "display_name": current_user["display_name"]
    }

# Dependency to get current user from JWT token
async def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    auth_service = AuthService(db)
    user = auth_service.get_current_user(token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "kratos_id": user.kratos_id
    }
