"""
Topic-based content generation API endpoints
Provides REST API for creating comprehensive educational content from topics
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import json
from datetime import datetime

from ...database import get_db
from ...services.topic_content_generator import (
    TopicContentGenerator, TopicGenerationRequest, GeneratedContent
)
from ...services.llm_service import LLMService
from ...services.search_service import SearchService
from ...models.v2_models import Knowledge, User
from ...auth.middleware import get_current_user

router = APIRouter(prefix="/api/v2/topic-generation", tags=["Topic Generation"])

# Request/Response Models
class TopicGenerationRequestModel(BaseModel):
    """Request model for topic-based content generation"""
    topic: str = Field(..., description="Main topic to generate content for")
    subject_area: str = Field(..., description="Subject area (e.g., Mathematics, Science, History)")
    difficulty_level: str = Field(..., description="Difficulty level: beginner, intermediate, advanced")
    target_audience: str = Field(..., description="Target audience: high_school, college, professional")
    content_depth: str = Field(..., description="Content depth: overview, detailed, comprehensive")
    learning_objectives: List[str] = Field(..., description="Specific learning objectives")
    language: str = Field(default="English", description="Content language")

class GeneratedContentResponse(BaseModel):
    """Response model for generated content"""
    knowledge_id: str
    topic: str
    status: str
    generation_time: str
    content_summary: Dict[str, Any]
    external_sources_count: int
    chapters_count: int
    
class ContentDetailsResponse(BaseModel):
    """Detailed response for generated content"""
    knowledge_id: str
    topic: str
    chapters: List[Dict[str, Any]]
    mind_maps: List[Dict[str, Any]]
    notes: Dict[str, Any]
    summary: Dict[str, Any]
    quiz: Dict[str, Any]
    external_sources: List[Dict[str, str]]
    metadata: Dict[str, Any]

class TopicSuggestionRequest(BaseModel):
    """Request for topic suggestions based on user profile"""
    user_interests: List[str]
    current_knowledge_level: Dict[str, str]
    learning_goals: List[str]
    preferred_subjects: List[str]

class TopicSuggestionResponse(BaseModel):
    """Response with suggested topics"""
    suggested_topics: List[Dict[str, Any]]
    related_existing_content: List[Dict[str, Any]]
    learning_pathways: List[Dict[str, Any]]

# Dependency injection
def get_topic_generator(
    db: Session = Depends(get_db)
) -> TopicContentGenerator:
    """Get topic content generator with dependencies"""
    llm_service = LLMService()
    search_service = SearchService(db)
    return TopicContentGenerator(llm_service, search_service)

@router.post("/generate", response_model=GeneratedContentResponse)
async def generate_topic_content(
    request: TopicGenerationRequestModel,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    generator: TopicContentGenerator = Depends(get_topic_generator),
    db: Session = Depends(get_db)
):
    """
    Generate comprehensive educational content from a topic
    
    This endpoint creates a complete course structure including:
    - Multiple chapters with detailed content
    - Mind maps for visual representation
    - Comprehensive study notes
    - Course summary and key takeaways
    - Assessment quiz with multiple question types
    - Integration with external knowledge sources (Wikipedia, etc.)
    """
    try:
        # Create generation request
        generation_request = TopicGenerationRequest(
            topic=request.topic,
            subject_area=request.subject_area,
            difficulty_level=request.difficulty_level,
            target_audience=request.target_audience,
            content_depth=request.content_depth,
            learning_objectives=request.learning_objectives,
            user_id=str(current_user.id),
            language=request.language
        )
        
        # Start background generation process
        background_tasks.add_task(
            _generate_content_async,
            generation_request,
            generator,
            db
        )
        
        # Create placeholder knowledge record for immediate response
        placeholder_knowledge = Knowledge(
            name=f"{request.topic} - {request.subject_area}",
            status="generating",
            content_type="generated_topic",
            summary=f"AI-generated content for {request.topic} (In Progress)",
            user_id=str(current_user.id),
            meta_data={
                'generation_request': request.dict(),
                'generation_started': datetime.now().isoformat(),
                'content_source': 'topic_generator'
            }
        )
        
        db.add(placeholder_knowledge)
        db.commit()
        db.refresh(placeholder_knowledge)
        
        return GeneratedContentResponse(
            knowledge_id=str(placeholder_knowledge.id),
            topic=request.topic,
            status="generating",
            generation_time="In Progress",
            content_summary={"status": "Content generation started"},
            external_sources_count=0,
            chapters_count=0
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start content generation: {str(e)}")

async def _generate_content_async(
    request: TopicGenerationRequest,
    generator: TopicContentGenerator,
    db: Session
):
    """
    Async background task for content generation
    """
    try:
        # Generate comprehensive content
        generated_content = await generator.generate_complete_course(request, db)
        
        # Update knowledge record with completion status
        knowledge = db.query(Knowledge).filter(
            Knowledge.name == f"{request.topic} - {request.subject_area}",
            Knowledge.user_id == request.user_id,
            Knowledge.status == "generating"
        ).first()
        
        if knowledge:
            knowledge.status = "completed"
            knowledge.summary = f"AI-generated comprehensive course on {request.topic}"
            knowledge.meta_data.update({
                'generation_completed': datetime.now().isoformat(),
                'chapters_count': len(generated_content.chapters),
                'external_sources_count': len(generated_content.external_sources)
            })
            db.commit()
            
    except Exception as e:
        # Update knowledge record with error status
        knowledge = db.query(Knowledge).filter(
            Knowledge.name == f"{request.topic} - {request.subject_area}",
            Knowledge.user_id == request.user_id,
            Knowledge.status == "generating"
        ).first()
        
        if knowledge:
            knowledge.status = "error"
            knowledge.meta_data.update({
                'generation_error': str(e),
                'generation_failed': datetime.now().isoformat()
            })
            db.commit()

@router.get("/content/{knowledge_id}", response_model=ContentDetailsResponse)
async def get_generated_content(
    knowledge_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve detailed generated content by knowledge ID
    """
    try:
        # Get knowledge record
        knowledge = db.query(Knowledge).filter(
            Knowledge.id == knowledge_id,
            Knowledge.user_id == str(current_user.id)
        ).first()
        
        if not knowledge:
            raise HTTPException(status_code=404, detail="Generated content not found")
        
        if knowledge.status == "generating":
            raise HTTPException(status_code=202, detail="Content generation in progress")
        
        if knowledge.status == "error":
            raise HTTPException(status_code=500, detail="Content generation failed")
        
        # Get associated content
        from ...models.v2_models import Chapter, EdTechContent
        
        chapters = db.query(Chapter).filter(Chapter.knowledge_id == knowledge_id).all()
        content = db.query(EdTechContent).filter(EdTechContent.knowledge_id == knowledge_id).first()
        
        # Format response
        response_data = {
            "knowledge_id": knowledge_id,
            "topic": knowledge.name,
            "chapters": [
                {
                    "id": str(chapter.id),
                    "content": chapter.content,
                    "metadata": chapter.meta_data
                }
                for chapter in chapters
            ],
            "mind_maps": json.loads(content.mindmap) if content and content.mindmap else [],
            "notes": json.loads(content.notes) if content and content.notes else {},
            "summary": json.loads(content.summary) if content and content.summary else {},
            "quiz": json.loads(content.quiz) if content and content.quiz else {},
            "external_sources": knowledge.meta_data.get('external_sources', []),
            "metadata": knowledge.meta_data
        }
        
        return ContentDetailsResponse(**response_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve content: {str(e)}")

@router.post("/suggest-topics", response_model=TopicSuggestionResponse)
async def suggest_topics(
    request: TopicSuggestionRequest,
    current_user: User = Depends(get_current_user),
    generator: TopicContentGenerator = Depends(get_topic_generator),
    db: Session = Depends(get_db)
):
    """
    Suggest topics based on user profile and interests
    Performs semantic search to find relevant existing content and suggest new topics
    """
    try:
        # Search for existing related content
        search_queries = request.user_interests + request.learning_goals + request.preferred_subjects
        related_content = []
        
        for query in search_queries[:5]:  # Limit searches
            try:
                search_results = await generator.search_service.search_knowledge(query, limit=3)
                for result in search_results:
                    related_content.append({
                        "knowledge_id": str(result.id),
                        "title": result.name,
                        "summary": result.summary[:200] + "..." if len(result.summary) > 200 else result.summary,
                        "content_type": result.content_type,
                        "relevance_query": query
                    })
            except:
                continue
        
        # Generate topic suggestions using LLM
        suggestion_prompt = f"""Based on the user profile, suggest 8-10 educational topics for content generation.

User Interests: {', '.join(request.user_interests)}
Current Knowledge Levels: {request.current_knowledge_level}
Learning Goals: {', '.join(request.learning_goals)}
Preferred Subjects: {', '.join(request.preferred_subjects)}

Generate suggestions that:
1. Align with user interests and goals
2. Build on current knowledge levels
3. Provide clear learning progression
4. Cover diverse aspects of preferred subjects
5. Include both foundational and advanced topics

Format as JSON array with topic, subject_area, difficulty_level, description, and learning_objectives."""

        suggestions_response = await generator.llm_service.generate_structured_content(
            system_prompt="You are an educational advisor creating personalized topic suggestions.",
            user_prompt=suggestion_prompt,
            schema_type="topic_suggestions"
        )
        
        # Create learning pathways
        pathways = [
            {
                "pathway_name": "Foundational Learning",
                "description": "Build core knowledge in your areas of interest",
                "topics": [s for s in suggestions_response.get('suggestions', []) if s.get('difficulty_level') == 'beginner'],
                "estimated_duration": "4-6 weeks"
            },
            {
                "pathway_name": "Skill Development",
                "description": "Develop practical skills and applications",
                "topics": [s for s in suggestions_response.get('suggestions', []) if s.get('difficulty_level') == 'intermediate'],
                "estimated_duration": "6-8 weeks"
            },
            {
                "pathway_name": "Advanced Mastery",
                "description": "Achieve deep understanding and expertise",
                "topics": [s for s in suggestions_response.get('suggestions', []) if s.get('difficulty_level') == 'advanced'],
                "estimated_duration": "8-12 weeks"
            }
        ]
        
        return TopicSuggestionResponse(
            suggested_topics=suggestions_response.get('suggestions', []),
            related_existing_content=related_content,
            learning_pathways=pathways
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate topic suggestions: {str(e)}")

@router.get("/generation-status/{knowledge_id}")
async def get_generation_status(
    knowledge_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check the status of content generation
    """
    try:
        knowledge = db.query(Knowledge).filter(
            Knowledge.id == knowledge_id,
            Knowledge.user_id == str(current_user.id)
        ).first()
        
        if not knowledge:
            raise HTTPException(status_code=404, detail="Generation task not found")
        
        return {
            "knowledge_id": knowledge_id,
            "status": knowledge.status,
            "created_at": knowledge.created_at.isoformat(),
            "metadata": knowledge.meta_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check status: {str(e)}")

@router.get("/my-generated-content")
async def list_my_generated_content(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0
):
    """
    List all generated content for the current user
    """
    try:
        knowledge_items = db.query(Knowledge).filter(
            Knowledge.user_id == str(current_user.id),
            Knowledge.content_type == "generated_topic"
        ).offset(offset).limit(limit).all()
        
        return {
            "generated_content": [
                {
                    "knowledge_id": str(item.id),
                    "topic": item.name,
                    "status": item.status,
                    "created_at": item.created_at.isoformat(),
                    "summary": item.summary,
                    "metadata": item.meta_data
                }
                for item in knowledge_items
            ],
            "total_count": db.query(Knowledge).filter(
                Knowledge.user_id == str(current_user.id),
                Knowledge.content_type == "generated_topic"
            ).count()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list content: {str(e)}")

# Add topic suggestions schema to content_schemas.py
TOPIC_SUGGESTIONS_SCHEMA = {
    "type": "object",
    "properties": {
        "suggestions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string"},
                    "subject_area": {"type": "string"},
                    "difficulty_level": {"type": "string"},
                    "description": {"type": "string"},
                    "learning_objectives": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "estimated_duration": {"type": "string"},
                    "prerequisites": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["topic", "subject_area", "difficulty_level", "description"]
            }
        }
    },
    "required": ["suggestions"]
}

# Export router
__all__ = ['router']