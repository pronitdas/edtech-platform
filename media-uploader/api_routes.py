import logging
import json
from typing import Dict, Optional, List, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
import requests

from .models import ProcessingStatus, RetryRequest, RetryHistory, ImageUploadStatus, PDFResponse
from .database import DatabaseManager
from .queue_manager import QueueManager
from .pdf_processor import PDFProcessor

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
            last_retry=knowledge.get("last_retry"),
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
    """Get the status of image uploads for a knowledge entry."""
    try:
        try:
            knowledge = db_manager.get_knowledge(knowledge_id)
        except Exception as e:
            raise HTTPException(404, "Knowledge not found")
            
        # Get metadata
        metadata = json.loads(knowledge.get("metadata", "{}")) if knowledge.get("metadata") else {}
        
        # Get image info
        image_urls = metadata.get("image_urls", {})
        failed_images = metadata.get("failed_images", [])
        
        return ImageUploadStatus(
            knowledge_id=knowledge_id,
            total_images=len(image_urls) + len(failed_images),
            uploaded_images=len(image_urls),
            failed_images=failed_images
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to get image status: {str(e)}")
        raise HTTPException(500, f"Failed to get image status: {str(e)}")


@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """
    Upload and process a PDF file.
    This endpoint is for testing purposes and does not use the queue system.
    """
    try:
        contents = await file.read()
        pdf_document = fitz.open(stream=contents, filetype="pdf")

        markdown_text = []
        images = {}
        metadata = {
            "title": pdf_document.metadata.get("title", ""),
            "author": pdf_document.metadata.get("author", ""),
            "pages": len(pdf_document),
            "format": "PDF",
        }

        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]

            # Extract text
            text = page.get_text()
            markdown_text.append(text)

            # Extract images
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = pdf_document.extract_image(xref)
                image_data = base_image["image"]

                # Convert to PIL Image
                image = Image.open(io.BytesIO(image_data))

                # Generate unique filename
                image_filename = f"image_{page_num + 1}_{img_index + 1}.png"

                # Convert to base64 for direct return
                buffered = io.BytesIO()
                image.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()

                images[image_filename] = img_str

        return JSONResponse({
            "markdown": "\n\n".join(markdown_text),
            "images": images,
            "metadata": metadata
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-and-process")
async def upload_and_process(
    file: UploadFile = File(...),
    user_id: str = None,
    background_tasks: BackgroundTasks = None,
    db_manager: DatabaseManager = Depends(get_db_manager),
    queue_manager: QueueManager = Depends(get_queue_manager)
):
    """
    Upload a PDF file and automatically start processing.
    This endpoint combines file upload and processing in one step.
    """
    try:
        # Extract filename without extension
        filename = file.filename
        name = filename.rsplit('.', 1)[0] if '.' in filename else filename
        
        # Insert knowledge entry
        knowledge_data = {
            "name": name,
            "status": "uploaded",
            "filename": filename
        }
        
        if user_id:
            knowledge_data["userId"] = user_id
            
        response = db_manager.supabase.table("knowledge").insert([knowledge_data]).execute()
        
        if hasattr(response, 'error') and response.error:
            raise Exception(f"Error inserting knowledge: {response.error}")
            
        knowledge_id = response.data[0]["id"]
        
        # Read file content
        contents = await file.read()
        
        # Upload file to storage
        file_path = f"media/doc/{knowledge_id}/{filename}"
        upload_response = db_manager.supabase.storage.from_("media").upload(
            file_path,
            contents,
            {"contentType": file.content_type}
        )
        
        if hasattr(upload_response, 'error') and upload_response.error:
            raise Exception(f"Error uploading file: {upload_response.error}")
            
        # Start processing in background
        queue_manager.add_job(knowledge_id)
        
        return {
            "knowledge_id": knowledge_id,
            "filename": filename,
            "status": "queued",
            "message": "File uploaded and processing has been queued."
        }
        
    except Exception as e:
        logger.error(f"Failed to upload and process: {str(e)}")
        raise HTTPException(500, f"Failed to upload and process: {str(e)}")
