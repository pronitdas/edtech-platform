from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.models.v2_models import RoleplayRequest, RoleplayResponse
from src.services.roleplay_service import RoleplayService
from src.services.auth_service import get_current_user
from database import get_db
from models import User

router = APIRouter()

@router.post("/generate", response_model=RoleplayResponse)
async def generate_roleplay(
    request: RoleplayRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a new roleplay scenario based on knowledge content."""
    try:
        roleplay_service = RoleplayService(db)
        scenario = await roleplay_service.generate_scenario(
            knowledge_id=request.knowledge_id,
            topic=request.topic,
            content=request.content,
            language=request.language,
            user_id=current_user.id
        )
        return scenario
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate roleplay: {str(e)}")

@router.get("/{knowledge_id}", response_model=List[RoleplayResponse])
async def get_roleplay_scenarios(
    knowledge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all roleplay scenarios for a knowledge entry."""
    try:
        roleplay_service = RoleplayService(db)
        scenarios = await roleplay_service.get_scenarios(knowledge_id, current_user.id)
        return scenarios
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch roleplay scenarios: {str(e)}")

@router.get("/scenario/{scenario_id}", response_model=RoleplayResponse)
async def get_roleplay_scenario(
    scenario_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific roleplay scenario by ID."""
    try:
        roleplay_service = RoleplayService(db)
        scenario = await roleplay_service.get_scenario(scenario_id, current_user.id)
        return scenario
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch roleplay scenario: {str(e)}")
