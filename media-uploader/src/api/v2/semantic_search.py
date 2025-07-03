"""
Semantic search API endpoints
Provides REST API for semantic search functionality across educational content
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import json
from datetime import datetime

from database import get_db
from models import User
from models import Knowledge, Chapter, EdTechContent
from src.services.auth_service import get_current_user
from src.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Semantic Search"])

# Request/Response Models
class SemanticSearchRequest(BaseModel):
    """Request model for semantic search"""
    query: str = Field(..., description="Search query")
    content_types: List[str] = Field(default=["all"], description="Content types to search")
    limit: int = Field(default=10, description="Maximum results to return")
    filters: Dict[str, Any] = Field(default={}, description="Additional filters")

class SearchResult(BaseModel):
    """Individual search result"""
    id: str
    title: str
    content_type: str
    summary: str
    relevance_score: float
    metadata: Dict[str, Any]
    created_at: str
    user_id: str

class SemanticSearchResponse(BaseModel):
    """Response model for semantic search results"""
    results: List[SearchResult]
    total_count: int
    query: str
    search_time_ms: int
    content_type_counts: Dict[str, int]

class RecommendationRequest(BaseModel):
    """Request for content recommendations"""
    user_id: str
    current_content_id: Optional[str] = None
    content_type: Optional[str] = None
    limit: int = Field(default=5, description="Number of recommendations")

class RecommendationResponse(BaseModel):
    """Response with content recommendations"""
    recommendations: List[Dict[str, Any]]
    recommendation_type: str
    generated_at: str

class FeedRequest(BaseModel):
    """Request for personalized content feed"""
    user_id: str
    content_types: List[str] = Field(default=["all"])
    limit: int = Field(default=20)
    offset: int = Field(default=0)

class FeedResponse(BaseModel):
    """Response for personalized content feed"""
    feed_items: List[Dict[str, Any]]
    total_count: int
    feed_type: str
    updated_at: str

# Dependency injection
def get_search_service(db: Session = Depends(get_db)) -> SearchService:
    """Get search service instance"""
    return SearchService(db)

@router.post("/semantic", response_model=SemanticSearchResponse)
async def semantic_search(
    request: SemanticSearchRequest,
    current_user: User = Depends(get_current_user),
    search_service: SearchService = Depends(get_search_service),
    db: Session = Depends(get_db)
):
    """
    Perform semantic search across educational content
    
    Searches through knowledge base, chapters, and content using semantic similarity
    """
    try:
        start_time = datetime.now()
        
        # Perform semantic search
        search_results = await search_service.search_knowledge(
            query=request.query,
            limit=request.limit,
            content_types=request.content_types,
            filters=request.filters
        )
        
        # Format results
        formatted_results = []
        content_type_counts = {}
        
        for result in search_results:
            content_type = result.content_type or "unknown"
            content_type_counts[content_type] = content_type_counts.get(content_type, 0) + 1
            
            formatted_results.append(SearchResult(
                id=str(result.id),
                title=result.name,
                content_type=content_type,
                summary=result.summary[:200] + "..." if len(result.summary) > 200 else result.summary,
                relevance_score=0.85,  # TODO: Implement actual relevance scoring
                metadata=result.meta_data or {},
                created_at=result.created_at.isoformat(),
                user_id=result.user_id
            ))
        
        search_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return SemanticSearchResponse(
            results=formatted_results,
            total_count=len(formatted_results),
            query=request.query,
            search_time_ms=int(search_time),
            content_type_counts=content_type_counts
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/recommendations")
async def get_recommendations(
    user_id: str,
    current_content_id: Optional[str] = None,
    content_type: Optional[str] = None,
    limit: int = Query(default=5, le=20),
    current_user: User = Depends(get_current_user),
    search_service: SearchService = Depends(get_search_service),
    db: Session = Depends(get_db)
):
    """
    Get personalized content recommendations
    """
    try:
        # TODO: Implement actual recommendation algorithm
        # For now, return mock recommendations based on user's recent activity
        
        # Get user's recent knowledge items
        recent_knowledge = db.query(Knowledge).filter(
            Knowledge.user_id == user_id
        ).order_by(Knowledge.created_at.desc()).limit(10).all()
        
        # Generate recommendations based on content type
        recommendations = []
        
        if current_content_id:
            # Get similar content to current item
            current_item = db.query(Knowledge).filter(Knowledge.id == current_content_id).first()
            if current_item:
                # Find similar content based on metadata or subject
                similar_items = db.query(Knowledge).filter(
                    Knowledge.id != current_content_id,
                    Knowledge.content_type == current_item.content_type
                ).limit(limit).all()
                
                for item in similar_items:
                    recommendations.append({
                        "id": str(item.id),
                        "title": item.name,
                        "content_type": item.content_type,
                        "summary": item.summary[:150] + "..." if len(item.summary) > 150 else item.summary,
                        "recommendation_reason": "Similar to current content",
                        "relevance_score": 0.8,
                        "created_at": item.created_at.isoformat()
                    })
        
        # If no specific recommendations, provide general ones
        if not recommendations:
            popular_content = db.query(Knowledge).filter(
                Knowledge.user_id != user_id  # Content from other users
            ).order_by(Knowledge.created_at.desc()).limit(limit).all()
            
            for item in popular_content:
                recommendations.append({
                    "id": str(item.id),
                    "title": item.name,
                    "content_type": item.content_type,
                    "summary": item.summary[:150] + "..." if len(item.summary) > 150 else item.summary,
                    "recommendation_reason": "Popular content",
                    "relevance_score": 0.6,
                    "created_at": item.created_at.isoformat()
                })
        
        return RecommendationResponse(
            recommendations=recommendations,
            recommendation_type="personalized" if current_content_id else "popular",
            generated_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.get("/feed")
async def get_personalized_feed(
    user_id: str,
    content_types: List[str] = Query(default=["all"]),
    limit: int = Query(default=20, le=50),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized content feed for user
    """
    try:
        # Build query based on content types
        query = db.query(Knowledge)
        
        if "all" not in content_types:
            query = query.filter(Knowledge.content_type.in_(content_types))
        
        # Get feed items with pagination
        feed_items_query = query.order_by(Knowledge.created_at.desc()).offset(offset).limit(limit)
        feed_items = feed_items_query.all()
        
        # Format feed items
        formatted_feed = []
        for item in feed_items:
            # Get chapter count for this knowledge item
            chapter_count = db.query(Chapter).filter(Chapter.knowledge_id == str(item.id)).count()
            
            formatted_feed.append({
                "id": str(item.id),
                "title": item.name,
                "content_type": item.content_type,
                "summary": item.summary[:200] + "..." if len(item.summary) > 200 else item.summary,
                "created_at": item.created_at.isoformat(),
                "user_id": item.user_id,
                "status": item.status,
                "chapter_count": chapter_count,
                "metadata": item.meta_data or {},
                "feed_score": 0.75  # TODO: Implement actual feed ranking
            })
        
        # Get total count for pagination
        total_count = query.count()
        
        return FeedResponse(
            feed_items=formatted_feed,
            total_count=total_count,
            feed_type="personalized",
            updated_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get feed: {str(e)}")

@router.get("/autocomplete")
async def search_autocomplete(
    query: str = Query(..., min_length=2),
    limit: int = Query(default=10, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get autocomplete suggestions for search queries
    """
    try:
        # Search in knowledge titles and summaries
        suggestions = db.query(Knowledge).filter(
            Knowledge.name.ilike(f"%{query}%")
        ).limit(limit).all()
        
        autocomplete_results = []
        for item in suggestions:
            autocomplete_results.append({
                "text": item.name,
                "type": "knowledge",
                "id": str(item.id),
                "content_type": item.content_type
            })
        
        # Add some generic topic suggestions
        generic_suggestions = [
            f"{query} fundamentals",
            f"{query} advanced concepts",
            f"{query} practical applications",
            f"{query} theory and practice"
        ]
        
        for suggestion in generic_suggestions[:5]:
            autocomplete_results.append({
                "text": suggestion,
                "type": "suggestion",
                "id": None,
                "content_type": "topic"
            })
        
        return {
            "suggestions": autocomplete_results,
            "query": query,
            "total_count": len(autocomplete_results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autocomplete failed: {str(e)}")

@router.get("/trending")
async def get_trending_content(
    content_type: Optional[str] = None,
    limit: int = Query(default=10, le=20),
    days: int = Query(default=7, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get trending content based on recent activity
    """
    try:
        # Calculate date threshold
        from datetime import timedelta
        date_threshold = datetime.now() - timedelta(days=days)
        
        # Build query
        query = db.query(Knowledge).filter(
            Knowledge.created_at >= date_threshold
        )
        
        if content_type:
            query = query.filter(Knowledge.content_type == content_type)
        
        # Get trending items (most recent for now)
        trending_items = query.order_by(Knowledge.created_at.desc()).limit(limit).all()
        
        formatted_trending = []
        for item in trending_items:
            formatted_trending.append({
                "id": str(item.id),
                "title": item.name,
                "content_type": item.content_type,
                "summary": item.summary[:150] + "..." if len(item.summary) > 150 else item.summary,
                "created_at": item.created_at.isoformat(),
                "trending_score": 0.8,  # TODO: Implement actual trending algorithm
                "user_id": item.user_id,
                "metadata": item.meta_data or {}
            })
        
        return {
            "trending_content": formatted_trending,
            "period_days": days,
            "content_type": content_type or "all",
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get trending content: {str(e)}")

@router.get("/similar/{content_id}")
async def get_similar_content(
    content_id: str,
    limit: int = Query(default=5, le=10),
    current_user: User = Depends(get_current_user),
    search_service: SearchService = Depends(get_search_service),
    db: Session = Depends(get_db)
):
    """
    Get content similar to a specific item
    """
    try:
        # Get the reference content
        reference_content = db.query(Knowledge).filter(Knowledge.id == content_id).first()
        
        if not reference_content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Find similar content based on content type and metadata
        similar_query = db.query(Knowledge).filter(
            Knowledge.id != content_id,
            Knowledge.content_type == reference_content.content_type
        )
        
        similar_items = similar_query.limit(limit).all()
        
        formatted_similar = []
        for item in similar_items:
            formatted_similar.append({
                "id": str(item.id),
                "title": item.name,
                "content_type": item.content_type,
                "summary": item.summary[:150] + "..." if len(item.summary) > 150 else item.summary,
                "similarity_score": 0.7,  # TODO: Implement actual similarity scoring
                "created_at": item.created_at.isoformat(),
                "user_id": item.user_id
            })
        
        return {
            "similar_content": formatted_similar,
            "reference_content_id": content_id,
            "reference_title": reference_content.name,
            "total_found": len(formatted_similar)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get similar content: {str(e)}")

# Export router
__all__ = ['router']