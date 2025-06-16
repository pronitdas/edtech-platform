import logging
import os
import io
import base64
from typing import Dict, Optional
from datetime import datetime

import fitz  # PyMuPDF
from PIL import Image

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
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
from routes.media import router as media_router
from src.api.v2 import v2_router

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

# FastAPI initialization with comprehensive documentation
app = FastAPI(
    title="🎓 EdTech Platform - Media Processing API",
    description="""
    ## EdTech Platform Media Processing Service
    
    A comprehensive API for processing educational content including:
    
    ### 🚀 **Core Features**
    - **Multi-file Upload**: Upload multiple PDFs, videos, and documents
    - **Content Processing**: AI-powered content extraction and chapter generation
    - **Knowledge Management**: Organize and manage educational content
    - **Analytics**: Track processing status and performance metrics
    - **Authentication**: Secure user management with ORY Kratos integration
    
    ### 📚 **API Categories**
    - **Knowledge Processing**: Upload and process educational content
    - **Media Management**: Handle file storage and retrieval
    - **Analytics**: Monitor system performance and usage
    - **Authentication**: User management and security
    - **Health & Monitoring**: System status and diagnostics
    
    ### 🔧 **Getting Started**
    1. Use `/auth/register` to create an account
    2. Login via `/auth/login` to get JWT token
    3. Upload files using `/upload-knowledge-file`
    4. Monitor processing with `/knowledge/{id}/status`
    5. View analytics at `/analytics/dashboard`
    
    ### 🔗 **External Documentation**
    - [API Documentation](http://localhost:8000/docs)
    - [ReDoc Documentation](http://localhost:8000/redoc)
    - [Health Check](http://localhost:8000/health)
    """,
    version="2.0.0",
    terms_of_service="http://localhost:8000/terms",
    contact={
        "name": "EdTech Platform Support",
        "url": "http://localhost:8000/support",
        "email": "support@edtech-platform.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    openapi_tags=[
        {
            "name": "Health & Monitoring",
            "description": "System health checks and monitoring endpoints",
        },
        {
            "name": "Knowledge Processing",
            "description": "Upload, process, and manage educational content",
        },
        {
            "name": "Media Management", 
            "description": "File storage, retrieval, and media operations",
        },
        {
            "name": "Analytics",
            "description": "Performance metrics, usage statistics, and reporting",
        },
        {
            "name": "Authentication",
            "description": "User registration, login, and session management",
        },
        {
            "name": "Content Generation",
            "description": "AI-powered content creation and chapter generation",
        }
    ],
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

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

# Include API routes with tags
app.include_router(router, tags=["Knowledge Processing"])
app.include_router(analytics_router, tags=["Analytics"])
app.include_router(auth_router, tags=["Authentication"])
app.include_router(media_router, tags=["Media Management"])
app.include_router(v2_router, tags=["V2 API"])

@app.get(
    "/health",
    tags=["Health & Monitoring"],
    summary="Health Check",
    description="Check the health status of the API service",
    response_description="Service health information"
)
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns:
        dict: Service health status, version, and timestamp
    """
    return {
        "status": "healthy",
        "service": "edtech-platform",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "components": {
            "database": "connected",
            "storage": "available", 
            "queue": "running"
        }
    }

@app.get(
    "/",
    tags=["Health & Monitoring"],
    summary="API Information",
    description="Get basic information about the API service",
    response_description="API metadata and navigation links"
)
async def root():
    """
    Root endpoint providing API information and navigation.
    
    Returns:
        dict: API metadata, version, and useful links
    """
    return {
        "message": "🎓 EdTech Platform - Local-First Media Uploader Service",
        "version": "2.0.0",
        "description": "AI-powered educational content processing platform",
        "features": [
            "Multi-file upload support",
            "AI content extraction", 
            "Chapter generation",
            "Analytics dashboard",
            "Secure authentication"
        ],
        "links": {
            "docs": "/docs",
            "redoc": "/redoc", 
            "health": "/health",
            "openapi": "/openapi.json"
        },
        "endpoints": {
            "upload": "/upload-knowledge-file",
            "analytics": "/analytics/dashboard",
            "auth": "/auth/login"
        }
    }

@app.get(
    "/api/info",
    tags=["Health & Monitoring"],
    summary="Detailed API Information",
    description="Get comprehensive API information including all available endpoints"
)
async def api_info():
    """
    Comprehensive API information endpoint.
    
    Returns detailed information about all available endpoints,
    authentication requirements, and usage examples.
    """
    return {
        "api": {
            "name": "EdTech Platform API",
            "version": "2.0.0",
            "description": "Educational content processing and management API"
        },
        "authentication": {
            "type": "JWT Bearer Token",
            "login_endpoint": "/auth/login",
            "register_endpoint": "/auth/register",
            "protected_paths": ["/analytics", "/api/protected"]
        },
        "endpoints": {
            "knowledge_processing": [
                "POST /upload-knowledge-file - Upload multiple files",
                "GET /knowledge/{id}/status - Check processing status",
                "GET /knowledge/{id}/chapters - Get generated chapters",
                "POST /knowledge/{id}/retry - Retry failed processing"
            ],
            "media_management": [
                "GET /media/{id} - Get media file info",
                "GET /media/{id}/download - Download media file",
                "DELETE /media/{id} - Delete media file"
            ],
            "analytics": [
                "GET /analytics/dashboard - System dashboard",
                "GET /analytics/processing-stats - Processing statistics",
                "GET /analytics/user-activity - User activity metrics"
            ],
            "authentication": [
                "POST /auth/register - User registration",
                "POST /auth/login - User login",
                "POST /auth/logout - User logout",
                "GET /auth/profile - User profile"
            ]
        },
        "examples": {
            "upload_files": {
                "method": "POST",
                "url": "/upload-knowledge-file",
                "headers": {"Authorization": "Bearer <token>"},
                "form_data": {
                    "files": ["file1.pdf", "file2.pdf"],
                    "name": "Course Materials"
                }
            }
        }
    }

# Run locally (for testing with: python -m media-uploader.main)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
