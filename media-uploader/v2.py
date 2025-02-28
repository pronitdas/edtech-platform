import logging
import os
import json
import threading
import time
import base64
import io
import uuid
from datetime import datetime
from typing import Dict, Optional

import fitz  # PyMuPDF
from PIL import Image
from queue import Queue, Empty

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests

# Import from our new modular structure
from .models import ProcessingStatus, RetryRequest, RetryHistory, ImageUploadStatus, PDFResponse
from .database import DatabaseManager
from .queue_manager import QueueManager
from .pdf_processor import PDFProcessor
from .api_routes import router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI initialization
app = FastAPI(title="Knowledge Processing API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database and queue managers
db_manager = DatabaseManager()
queue_manager = QueueManager(db_manager)

# Include API routes
app.include_router(router)

# For backward compatibility, add the old routes directly
@app.get("/process/{knowledge_id}")
def start_processing(knowledge_id: int):
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


@app.get("/process/{knowledge_id}/status")
def get_processing_status(knowledge_id: int):
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


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    A quick endpoint to test how your PDF is being read and
    how text/images are extracted (not used in the queue system).
    """
    try:
        contents = await file.read()
        markdown, images, metadata = PDFProcessor.process_pdf(contents)
        
        # Convert images to simple base64 strings for response
        simple_images = {}
        for img_filename, img_data in images.items():
            simple_images[img_filename] = img_data["data"]
        
        return JSONResponse({
            "markdown": markdown,
            "images": simple_images,
            "metadata": metadata
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-and-process")
async def upload_and_process(
    file: UploadFile = File(...),
    user_id: str = None,
    background_tasks: BackgroundTasks = None,
    request = None
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
        
        # Call the /process/knowledge endpoint
        try:
            # Make a direct call to the process endpoint
            logger.info(f"Calling process endpoint for knowledge_id {knowledge_id}")
            # We don't need to make an HTTP request since we're already in the same process
            # The job is already queued by queue_manager.add_job(knowledge_id) above
        except Exception as e:
            logger.error(f"Failed to process knowledge: {str(e)}")
            # Continue even if this fails, as we've already queued the job
        
        return {
            "knowledge_id": knowledge_id,
            "filename": filename,
            "status": "queued",
            "message": "File uploaded and processing has been queued."
        }
        
    except Exception as e:
        logger.error(f"Failed to upload and process: {str(e)}")
        raise HTTPException(500, f"Failed to upload and process: {str(e)}")


# Run locally (for testing with: python v2.py)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
