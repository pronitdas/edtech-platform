import logging
import os
import io
import base64
from typing import Dict, Optional

import fitz  # PyMuPDF
from PIL import Image

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from models import ProcessingStatus, RetryRequest, RetryHistory, ImageUploadStatus, PDFResponse
from database import DatabaseManager
from queue_manager import QueueManager
from pdf_processor import PDFProcessor
from video_processor_v2 import VideoProcessorV2
from api_routes import router

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

# Include API routes
app.include_router(router)

# Run locally (for testing with: python -m media-uploader.main)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
