"""
Simple auth endpoints that bypass Kratos for demo purposes
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from src.services.auth_service import AuthService
from src.models.v2_models import RegisterRequest, LoginRequest, TokenResponse, StudentOnboardingRequest, TeacherOnboardingRequest

router = APIRouter()

@router.post("/simple-register", response_model=TokenResponse)
async def simple_register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Simple registration bypass for demo"""
    auth_service = AuthService(db)
    result = await auth_service.register(request.email, request.password, request.name, request.role)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return TokenResponse(**result)

@router.post("/simple-login", response_model=TokenResponse)
async def simple_login(request: LoginRequest, db: Session = Depends(get_db)):
    """Simple login bypass for demo"""
    auth_service = AuthService(db)
    result = await auth_service.login(request.email, request.password)
    
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    
    return TokenResponse(**result)

@router.post("/simple-onboard-student", response_model=TokenResponse)
async def simple_student_onboarding(request: StudentOnboardingRequest, db: Session = Depends(get_db)):
    """Simple student onboarding bypass for demo"""
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

@router.post("/simple-onboard-teacher", response_model=TokenResponse)
async def simple_teacher_onboarding(request: TeacherOnboardingRequest, db: Session = Depends(get_db)):
    """Simple teacher onboarding bypass for demo"""
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

@router.post("/demo-login", response_model=TokenResponse)
async def demo_login(db: Session = Depends(get_db)):
    """Demo login with pre-created demo user"""
    auth_service = AuthService(db)

    # Demo user credentials
    demo_email = "demo@edtech.com"
    demo_password = "demo123"
    demo_name = "Demo User"

    # Try to login first
    result = await auth_service.login(demo_email, demo_password)

    # If user doesn't exist, create it
    if "error" in result:
        # Create demo user
        create_result = await auth_service.register(demo_email, demo_password, demo_name, "student")
        if "error" in create_result:
            raise HTTPException(status_code=500, detail="Failed to create demo user")
        return TokenResponse(**create_result)

    return TokenResponse(**result)