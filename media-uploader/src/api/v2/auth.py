from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from database import get_db
from src.services.auth_service import AuthService
from src.models.v2_models import RegisterRequest, LoginRequest, TokenResponse, StudentOnboardingRequest, TeacherOnboardingRequest, StudentProfile, TeacherProfile

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with simple auth"""
    auth_service = AuthService(db)
    result = await auth_service.register(request.email, request.password, request.name, request.role)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return TokenResponse(**result)

@router.post("/onboard/student", response_model=TokenResponse)
async def student_onboarding(request: StudentOnboardingRequest, db: Session = Depends(get_db)):
    """Complete student onboarding flow"""
    auth_service = AuthService(db)
    result = await auth_service.student_onboarding(
        email=request.email,
        password=request.password,
        name=request.name,
        grade_level=request.grade_level,
        subjects_of_interest=request.subjects_of_interest,
        learning_goals=request.learning_goals,
        preferred_difficulty=request.preferred_difficulty
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return TokenResponse(**result)

@router.post("/onboard/teacher", response_model=TokenResponse)
async def teacher_onboarding(request: TeacherOnboardingRequest, db: Session = Depends(get_db)):
    """Complete teacher onboarding flow"""
    auth_service = AuthService(db)
    result = await auth_service.teacher_onboarding(
        email=request.email,
        password=request.password,
        name=request.name,
        school_name=request.school_name,
        subjects_taught=request.subjects_taught,
        grade_levels_taught=request.grade_levels_taught,
        years_experience=request.years_experience,
        classroom_size=request.classroom_size
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return TokenResponse(**result)

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user with simple auth"""
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
async def get_profile(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Get current user profile"""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user_from_token(authorization)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Return detailed profile based on role
    profile_data = {
        "id": user.id,
        "email": user.email,
        "name": user.display_name,
        "role": user.roles[0] if user.roles else "student",
        "onboarding_completed": user.onboarding_completed,
        "created_at": user.created_at
    }
    
    # Add role-specific fields
    if "student" in user.roles:
        profile_data.update({
            "grade_level": user.grade_level,
            "subjects_of_interest": user.subjects_of_interest or [],
            "learning_goals": user.learning_goals,
            "preferred_difficulty": user.preferred_difficulty
        })
    elif "teacher" in user.roles:
        profile_data.update({
            "school_name": user.school_name,
            "subjects_taught": user.subjects_taught or [],
            "grade_levels_taught": user.grade_levels_taught or [],
            "years_experience": user.years_experience,
            "classroom_size": user.classroom_size
        })
    
    return profile_data

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
