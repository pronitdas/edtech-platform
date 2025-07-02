"""
Kratos Authentication Middleware for FastAPI
Integrates with ORY Kratos for user session validation
"""

import os
import logging
import httpx
from typing import Optional, Dict, Any
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from models import User
from database import get_db

logger = logging.getLogger(__name__)

class KratosAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to validate sessions with ORY Kratos."""
    
    def __init__(self, app, kratos_public_url: str = None):
        super().__init__(app)
        self.kratos_public_url = kratos_public_url or os.getenv(
            "KRATOS_PUBLIC_URL", 
            "http://kratos:4433"
        )
        # Create HTTP client for Kratos API calls
        self.client = httpx.AsyncClient(timeout=10.0)
        
    async def dispatch(self, request: Request, call_next):
        # Skip authentication for public endpoints and OPTIONS requests
        path = request.url.path
        method = request.method
        logger.info(f"KratosAuthMiddleware: Processing {method} {path}")

        # Always allow OPTIONS requests (CORS preflight)
        if method == "OPTIONS":
            logger.info(f"KratosAuthMiddleware: OPTIONS request, skipping auth: {path}")
            return await call_next(request)

        if not self.should_validate_session(path):
            logger.info(f"KratosAuthMiddleware: Public path, skipping auth: {path}")
            return await call_next(request)
        
        # Try Kratos session validation first
        kratos_user = await self.validate_kratos_session(request)
        if kratos_user:
            # Set user in request state from Kratos session
            await self.set_user_from_kratos(request, kratos_user)
            return await call_next(request)
        
        # Fallback to JWT token validation for development/testing
        jwt_user = await self.validate_jwt_token(request)
        if jwt_user:
            request.state.user = jwt_user
            request.state.user_id = jwt_user.id
            request.state.kratos_id = jwt_user.kratos_id
            return await call_next(request)
        
        # No valid authentication found
        logger.info(f"KratosAuthMiddleware: Authentication required but not found for: {path}")
        return JSONResponse(
            status_code=401,
            content={"detail": "Not authenticated"}
        )
    
    async def validate_kratos_session(self, request: Request) -> Optional[Dict[str, Any]]:
        """Validate session with ORY Kratos."""
        try:
            # Extract session cookie or Authorization header
            session_token = self.extract_session_token(request)
            if not session_token:
                return None
                
            # Call Kratos whoami endpoint
            headers = {"Authorization": f"Bearer {session_token}"} if session_token.startswith("ory_") else {}
            cookies = {"ory_kratos_session": session_token} if not session_token.startswith("ory_") else {}
            
            response = await self.client.get(
                f"{self.kratos_public_url}/sessions/whoami",
                headers=headers,
                cookies=cookies
            )
            
            if response.status_code == 200:
                session_data = response.json()
                return session_data.get("identity")
            
            return None
            
        except Exception as e:
            logger.warning(f"Kratos session validation failed: {e}")
            return None
    
    async def validate_jwt_token(self, request: Request) -> Optional[User]:
        """Fallback JWT token validation for development."""
        try:
            from src.services.auth_service import AuthService
            import jwt
            
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return None
            
            token = auth_header.split(' ')[1]
            
            # Use AuthService to verify token
            db = next(get_db())
            try:
                auth_service = AuthService(db)
                payload = auth_service.verify_token(token)
                
                if payload and "user_id" in payload:
                    user = db.query(User).filter(User.id == payload["user_id"]).first()
                    return user
            finally:
                db.close()
                
            return None
            
        except Exception as e:
            logger.warning(f"JWT token validation failed: {e}")
            return None
    
    async def set_user_from_kratos(self, request: Request, kratos_identity: Dict[str, Any]):
        """Set user in request state from Kratos identity."""
        try:
            kratos_id = kratos_identity.get("id")
            if not kratos_id:
                return
                
            # Find user in database by kratos_id
            db = next(get_db())
            try:
                user = db.query(User).filter(User.kratos_id == kratos_id).first()
                
                if user:
                    request.state.user = user
                    request.state.user_id = user.id
                    request.state.kratos_id = kratos_id
                else:
                    # Create user from Kratos identity if not exists
                    traits = kratos_identity.get("traits", {})
                    user = User(
                        kratos_id=kratos_id,
                        email=traits.get("email"),
                        display_name=traits.get("name", traits.get("email", "").split("@")[0]),
                        verified=True,
                        active=True,
                        roles=["student"]  # Default role
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
                    
                    request.state.user = user
                    request.state.user_id = user.id
                    request.state.kratos_id = kratos_id
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error setting user from Kratos: {e}")
    
    def extract_session_token(self, request: Request) -> Optional[str]:
        """Extract session token from request."""
        # Try Authorization header first
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            if token.startswith('ory_'):
                return token
                
        # Try session cookie
        session_cookie = request.cookies.get('ory_kratos_session')
        if session_cookie:
            return session_cookie
            
        return None
    
    def should_validate_session(self, path: str) -> bool:
        """Check if the endpoint requires authentication."""
        # Public endpoints that don't require authentication
        public_paths = [
            "/health",
            "/test-public",
            "/",
            "/docs",
            "/redoc", 
            "/openapi.json",
            "/api/info",
            # V2 auth endpoints
            "/v2/auth/register",
            "/v2/auth/login",
            "/v2/auth/simple-register",
            "/v2/auth/simple-login",
            "/v2/auth/simple-onboard-student",
            "/v2/auth/simple-onboard-teacher",
            "/v2/auth/demo-login",
            "/v2/auth/onboard/student",
            "/v2/auth/onboard/teacher",
            # Admin health checks
            "/v2/admin/health"
        ]
        
        # Check if path is public (exact match only for specific paths)
        if path in public_paths:
            return False
            
        # Check for prefix matches only for certain paths
        public_prefixes = [
            "/docs",
            "/redoc"
        ]
        if any(path.startswith(prefix) for prefix in public_prefixes):
            return False
            
        # Most endpoints require authentication
        return True

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Cleanup HTTP client on shutdown."""
        await self.client.aclose()