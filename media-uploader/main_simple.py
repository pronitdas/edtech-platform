#!/usr/bin/env python3
"""
Simplified EdTech Platform API - Core features without ML dependencies
"""
import logging
import os
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import jwt
from sqlalchemy.orm import Session

# Core imports that should work
from database import get_db
from models import User
from src.api.v2 import v2_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mock JWT secrets for now
JWT_SECRET = "your-super-secret-jwt-key-change-in-production"
JWT_ALGORITHM = "HS256"

class JWTMiddleware(BaseHTTPMiddleware):
    """Simplified JWT middleware for core authentication."""
    
    async def dispatch(self, request: Request, call_next):
        # For now, let's make it permissive for testing
        if request.url.path.startswith(("/docs", "/openapi.json", "/health", "/v2/auth")):
            return await call_next(request)
        
        # For other endpoints, we'll implement basic auth later
        return await call_next(request)

# FastAPI app
app = FastAPI(
    title="🎓 EdTech Platform API (Core)",
    description="""
    Core EdTech Platform API without ML dependencies.
    Features:
    - User authentication (/v2/auth)
    - Knowledge management (/v2/knowledge) 
    - Chapter management (/v2/chapters)
    - Analytics (/v2/analytics)
    - Content management (/v2/content)
    - Roleplay scenarios (/v2/roleplay)
    """,
    version="2.0.0-core",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic health check
@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "service": "edtech-platform-core",
        "version": "2.0.0-core"
    }

# Add V2 API routes
app.include_router(v2_router, prefix="")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found", "path": str(request.url.path)}
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    logger.error(f"Internal server error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )