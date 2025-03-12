import logging
import json
import os
from typing import Dict, Optional, List, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, BackgroundTasks, Query
from fastapi.responses import JSONResponse
import requests

from models import (
    ProcessingStatus, RetryRequest, RetryHistory, ImageUploadStatus, PDFResponse,
    ContentGenerationRequest, ContentGenerationResponse,
    ChapterDataRequest, ChapterDataResponse
)
from database import DatabaseManager
from queue_manager import QueueManager
from pdf_processor import PDFProcessor
from openai_client import OpenAIClient
from openai_functions import (
    generate_notes, generate_summary, generate_questions, generate_mind_map_structure
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Dependencies
def get_db_manager():
    return DatabaseManager()

def get_queue_manager(db_manager: DatabaseManager = Depends(get_db_manager)):
    return QueueManager(db_manager)

def get_openai_client():
    """Get an OpenAI client."""
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        logger.warning("OPENAI_API_KEY not set, using default key")
    return OpenAIClient(api_key)

# Routes
@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@router.get("/process/{knowledge_id}")
def start_processing(
    knowledge_id: int,
    queue_manager: QueueManager = Depends(get_queue_manager),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """Start processing a knowledge entry."""
    try:
        # Check if knowledge exists
        try:
            knowledge = db_manager.get_unseeded_knowledge(knowledge_id)
        except Exception as e:
            raise HTTPException(404, "Knowledge not found or already seeded.")

        # Add to queue
        queue_manager.add_job(knowledge_id)

        return {
            "knowledge_id": knowledge_id,
            "status": "queued",
            "message": "Knowledge processing has been queued.",
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to start processing: {str(e)}")
        raise HTTPException(500, f"Failed to start processing: {str(e)}")


@router.post("/process/{knowledge_id}/retry")
def retry_processing(
    knowledge_id: int,
    retry_request: RetryRequest,
    queue_manager: QueueManager = Depends(get_queue_manager),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """Retry processing a failed knowledge entry."""
    try:
        # Check if knowledge exists
        try:
            knowledge = db_manager.get_knowledge(knowledge_id)
        except Exception as e:
            raise HTTPException(404, "Knowledge not found.")
            
        # Check if knowledge is in a failed state
        if knowledge.get("status") != "failed" and not retry_request.force:
            raise HTTPException(400, "Knowledge is not in a failed state. Use force=true to retry anyway.")
            
        # Get current retry count
        retry_count = knowledge.get("retry_count", 0)
        
        # Check if max retries reached
        if retry_count >= queue_manager.max_retries and not retry_request.force:
            raise HTTPException(400, f"Maximum retry count ({queue_manager.max_retries}) reached. Use force=true to retry anyway.")
            
        # Override max retries if specified
        if retry_request.max_retries is not None:
            queue_manager.max_retries = retry_request.max_retries
            
        # Add to queue with current retry count
        queue_manager.add_job(knowledge_id)
        
        # Add retry history entry
        db_manager.add_retry_history(
            knowledge_id, 
            "retry_manual", 
            f"Manual retry requested (force={retry_request.force})"
        )
        
        return {
            "knowledge_id": knowledge_id,
            "status": "queued",
            "message": "Knowledge processing has been queued for retry.",
            "retry_count": retry_count + 1
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to retry processing: {str(e)}")
        raise HTTPException(500, f"Failed to retry processing: {str(e)}")


@router.get("/process/{knowledge_id}/retry-history")
def get_retry_history(
    knowledge_id: int,
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """Get retry history for a knowledge entry."""
    try:
        # Check if knowledge exists
        try:
            knowledge = db_manager.get_knowledge(knowledge_id)
        except Exception as e:
            raise HTTPException(404, "Knowledge not found.")
            
        # Get retry history
        retry_history = db_manager.get_retry_history(knowledge_id)
        
        return RetryHistory(
            knowledge_id=knowledge_id,
            retries=retry_history
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to get retry history: {str(e)}")
        raise HTTPException(500, f"Failed to get retry history: {str(e)}")


@router.get("/process/{knowledge_id}/status")
def get_processing_status(
    knowledge_id: int,
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """Get the current processing status."""
    try:
        try:
            knowledge = db_manager.get_knowledge(knowledge_id)
        except Exception as e:
            raise HTTPException(404, "Knowledge not found")

        return ProcessingStatus(
            knowledge_id=knowledge_id,
            status=knowledge.get("status", "unknown"),
            message=knowledge.get("message", ""),
            retry_count=knowledge.get("retry_count", 0),
            result=json.loads(knowledge.get("metadata", "{}")) if knowledge.get("metadata") else None
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to get status: {str(e)}")
        raise HTTPException(500, f"Failed to get status: {str(e)}")


@router.get("/process/{knowledge_id}/images")
def get_image_status(
    knowledge_id: int,
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """
    Get the status of image uploads for a knowledge entry.
    
    Args:
        knowledge_id: The ID of the knowledge entry
        db_manager: The database manager
        
    Returns:
        The image upload status
    """
    try:
        # Get knowledge entry
        knowledge = db_manager.get_knowledge(knowledge_id)
        
        # Extract image information from metadata
        metadata = knowledge.get("metadata", {})
        if isinstance(metadata, str):
            metadata = json.loads(metadata)
            
        images = metadata.get("images", {})
        total_images = len(images)
        uploaded_images = sum(1 for img in images.values() if img.get("uploaded", False))
        failed_images = [
            filename for filename, img in images.items() 
            if img.get("error") and not img.get("uploaded", False)
        ]
        
        return ImageUploadStatus(
            knowledge_id=knowledge_id,
            total_images=total_images,
            uploaded_images=uploaded_images,
            failed_images=failed_images
        )
        
    except Exception as e:
        logger.error(f"Error getting image status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate-content/{knowledge_id}", response_model=ContentGenerationResponse)
async def generate_content(
    knowledge_id: int,
    chapter_id: Optional[str] = None,
    types: List[str] = Query(...),
    language: str = "English",
    db_manager: DatabaseManager = Depends(get_db_manager),
    openai_client: OpenAIClient = Depends(get_openai_client)
):
    """
    Generate content using OpenAI.
    
    Args:
        knowledge_id: The ID of the knowledge entry
        chapter_id: Optional ID of the specific chapter to process
        types: List of content types to generate
        language: The language for the content (default: English)
        db_manager: The database manager
        openai_client: The OpenAI client
        
    Returns:
        The generated content
    """
    logger.info(f"Starting content generation for knowledge_id={knowledge_id}, chapter_id={chapter_id}, types={types}, language={language}")
    try:
        # Get chapter data from the database
        chapters = db_manager.get_chapter_data(knowledge_id, chapter_id)
        
        if not chapters or len(chapters) == 0:
            error_msg = f"No chapters found for knowledge_id={knowledge_id}" + (f", chapter_id={chapter_id}" if chapter_id else "")
            logger.error(error_msg)
            raise Exception(error_msg)
        
        logger.info(f"Found {len(chapters)} chapters to process")
        
        # Define type generators mapping
        type_generators = {
            "notes": generate_notes,
            "summary": generate_summary,
            "quiz": generate_questions,
            "mindmap": generate_mind_map_structure,
        }
        
        all_results = []
        # Process each chapter
        for chapter in [chapters[0]]:
            chapter_id = chapter.get("id")
            
            # Generate content for each requested type
            results = {}
            for content_type in types:
                if content_type not in type_generators:
                    logger.warning(f"{content_type} not supported")
                    continue
                
                generator = type_generators[content_type]
                
                try:
                    # Call the appropriate generator function
                    if content_type == "mindmap":
                        generated = await generator(openai_client, chapter.get("chapter", ""), language)
                    elif content_type == "quiz":
                        generated = await generator(openai_client, chapter.get("chapter", ""), language)
                    else:
                        generated = await generator(openai_client, chapter.get("chapter", ""), language)
                        # Join the chunked results with a delimiter for storage
                        generated = "|||||".join(generated) if isinstance(generated, list) else generated
                    
                    results[content_type] = generated
                    logger.info(f"Successfully generated {content_type} content for chapter {chapter_id}")
                except Exception as e:
                    logger.error(f"Error generating {content_type} for chapter {chapter_id}: {str(e)}")
                    results[content_type] = f"Error generating {content_type}: {str(e)}"
            
            # Update content in the database using the table with language suffix
            table_name = f"EdTechContent_{language}"
            logger.info(f"Updating content in {table_name} for chapter {chapter_id}, knowledge_id {knowledge_id}")
            
            data = db_manager.supabase.from_(table_name).update(
                results
            ).eq('chapter_id', chapter_id).eq('knowledge_id', knowledge_id).execute()
            
            # Fetch the updated record separately if needed
            updated_record = db_manager.supabase.from_(table_name).select("*").eq('chapter_id', chapter_id).eq('knowledge_id', knowledge_id).execute()
            
            if hasattr(data, 'error') and data.error:
                logger.error(f"Error updating content for chapter {chapter_id}: {data.error}")
                continue
            
            logger.info(f"Successfully updated content in {table_name} for chapter {chapter_id}")
            all_results.extend(updated_record.data if hasattr(updated_record, 'data') and updated_record.data else [])
        
        return ContentGenerationResponse(
            success=True,
            data={"chapters": all_results}
        )
        
    except Exception as e:
        logger.error(f"Error generating content: {str(e)}")
        return ContentGenerationResponse(
            success=False,
            error=str(e)
        )


@router.get("/chapters/{knowledge_id}", response_model=ChapterDataResponse)
async def get_chapter_data(
    knowledge_id: int,
    chapter_id: Optional[str] = None,
    types: Optional[List[str]] = None,
    language: str = "English",
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """
    Get chapter data from the chapters_v1 table.
    
    Args:
        knowledge_id: The ID of the knowledge entry
        chapter_id: Optional chapter ID to filter by
        types: Optional list of content types to include
        language: The language for the content (default: English)
        db_manager: The database manager
        
    Returns:
        The chapter data
    """
    try:
        # Get chapter data from the database
        chapters = db_manager.get_chapter_data(knowledge_id, chapter_id)
        
        # If types are specified, filter the data to include only those types
        if types:
            # Filter chapters based on requested types
            filtered_chapters = []
            for chapter in chapters:
                filtered_chapter = {
                    "knowledge_id": chapter.get("knowledge_id"),
                    "chapter_id": chapter.get("chapter_id"),
                    "language": language
                }
                
                # Include only requested types
                for content_type in types:
                    if content_type in chapter:
                        filtered_chapter[content_type] = chapter.get(content_type)
                
                filtered_chapters.append(filtered_chapter)
            
            chapters = filtered_chapters
        
        return ChapterDataResponse(
            success=True,
            data=chapters,
            error=None
        )
        
    except Exception as e:
        logger.error(f"Error getting chapter data: {str(e)}")
        return ChapterDataResponse(
            success=False,
            data=None,
            error=str(e)
        )
