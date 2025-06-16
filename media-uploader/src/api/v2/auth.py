from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from src.models.v2_models import LoginRequest, RegisterRequest, UserProfile, TokenResponse
from src.services.auth_service import AuthService
from models import User

router = APIRouter()
security = HTTPBearer()

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    token = await auth_service.authenticate(request.email, request.password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    return TokenResponse(access_token=token)

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        token = await auth_service.register(request.email, request.password, request.name)
        return TokenResponse(access_token=token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    # Token invalidation logic here
    return {"message": "Logged out successfully"}

@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        name=getattr(current_user, 'display_name', None),
        created_at=getattr(current_user, 'created_at', None)
    )
