import logging
import os
import io
import base64
from typing import Dict, Optional

import fitz  # PyMuPDF
from PIL import Image

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.base import BaseHTTPMiddleware
import jwt

from models import ProcessingStatus, RetryRequest, RetryHistory, ImageUploadStatus, PDFResponse, User
from routes.auth import JWT_SECRET, JWT_ALGORITHM, get_db
from database import DatabaseManager
from queue_manager import QueueManager
from pdf_processor import PDFProcessor
from video_processor_v2 import VideoProcessorV2
from api_routes import router
from routes.analytics import router as analytics_router
from routes.auth import router as auth_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JWTMiddleware(BaseHTTPMiddleware):
    """Middleware to validate JWT tokens on protected endpoints."""
    
    async def dispatch(self, request: Request, call_next):
        if not self.should_validate_token(request.url.path):
            return await call_next(request)
        
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JSONResponse(
                status_code=401,
                content={"detail": "No valid authentication credentials"}
            )
        
        token = auth_header.split(' ')[1]
        try:
            # Validate JWT token
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = int(payload["sub"])
            kratos_id = payload["kid"]

            # Attach user object to request state
            db = next(get_db())  # Get a database session
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            request.state.user = user
            request.state.user_id = user_id
            request.state.kratos_id = kratos_id
            return await call_next(request)
        except jwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token has expired"}
            )
        except jwt.JWTError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid token"}
            )

    def should_validate_token(self, path: str) -> bool:
        """Check if the endpoint requires JWT validation."""
        protected_paths = [
            "/analytics",  # All analytics endpoints
            "/api/protected"  # Future protected endpoints
        ]
        return any(path.startswith(prefix) for prefix in protected_paths)

# FastAPI initialization
app = FastAPI(title="Knowledge Processing API")

# Add JWT middleware
app.add_middleware(JWTMiddleware)

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
app.include_router(analytics_router)
app.include_router(auth_router)

# Run locally (for testing with: python -m media-uploader.main)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
