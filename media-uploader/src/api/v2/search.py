from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.models.v2_models import SearchRequest, SearchResponse
from src.services.search_service import SearchService
from src.services.auth_service import get_current_user
from database import get_db
from models import User

router = APIRouter()

@router.get("/", response_model=SearchResponse)
async def search(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=100, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    filters: str = Query(None, description="JSON string of filters"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Search across knowledge entries and chapters using full-text search."""
    import json
    
    try:
        search_service = SearchService(db)
        
        # Parse filters if provided
        parsed_filters = None
        if filters:
            parsed_filters = json.loads(filters)
        
        results = await search_service.search(
            query=q,
            user_id=current_user.id,
            filters=parsed_filters,
            limit=limit,
            offset=offset
        )
        
        return SearchResponse(
            results=results["items"],
            total=results["total"],
            query=q
        )
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid filters JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.post("/", response_model=SearchResponse)
async def advanced_search(
    request: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Advanced search with complex filters and options."""
    try:
        search_service = SearchService(db)
        
        results = await search_service.search(
            query=request.query,
            user_id=current_user.id,
            filters=request.filters,
            limit=request.limit,
            offset=request.offset
        )
        
        return SearchResponse(
            results=results["items"],
            total=results["total"],
            query=request.query
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advanced search failed: {str(e)}")

@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Partial search query"),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get search suggestions based on partial query."""
    try:
        search_service = SearchService(db)
        suggestions = await search_service.get_suggestions(q, current_user.id, limit)
        return {"success": True, "suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")
