import logging
import json
import os
import tempfile
from typing import Dict, Optional, List, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, BackgroundTasks, Query, Form
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
from video_processor import VideoProcessor
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
    api_key = os.environ.get("OPENAI_API_KEY", "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")
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

@router.post("/test/video-process")
async def test_video_process(
    file: UploadFile = File(...),
    knowledge_id: int = Form(...),
    knowledge_name: str = Form(...),
    whisper_model: str = Form("base"),
    openai_model: str = Form("gpt-4o-mini"),
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """
    Test endpoint for processing a video file directly.
    
    Args:
        file: The video file to process
        knowledge_id: ID to associate with the processed content
        knowledge_name: Name of the knowledge entry
        whisper_model: Whisper model to use (tiny, base, small, medium, large)
        openai_model: OpenAI model to use
        
    Returns:
        JSON response with processing results
    """
    try:
        # Check file extension
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']:
            raise HTTPException(400, "File must be a video file")
            
        # Read the file content
        file_content = await file.read()
        
        # Process the video
        logger.info(f"Processing test video: {file.filename}")
        
        # Process video to get textbook structure and chapters
        textbook, chapters = VideoProcessor.process_video_to_chapters(
            file_content,
            knowledge_id=knowledge_id,
            knowledge_name=knowledge_name,
            whisper_model=whisper_model,
            openai_model=openai_model
        )
        
        # Insert chapters into database
        db_manager.insert_chapters(knowledge_id, chapters)
        
        # Update knowledge status
        db_manager.update_knowledge_status(
            knowledge_id,
            "processed",
            {
                "analysis": textbook,
                "processed_at": datetime.utcnow().isoformat(),
                "file_type": "video"
            }
        )
        
        return {
            "success": True,
            "message": "Video processed successfully",
            "chapters_count": len(chapters),
            "textbook_structure": textbook
        }
        
    except Exception as e:
        logger.error(f"Error in test video processing: {str(e)}")
        raise HTTPException(500, f"Error processing video: {str(e)}")
