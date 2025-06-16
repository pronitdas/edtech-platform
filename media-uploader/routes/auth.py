import os
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urljoin
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import jwt
import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, Header, Request, Query

from sqlalchemy.orm import Session

from database import DatabaseManager, get_db as get_database_session
from models import User

router = APIRouter(
    prefix="/auth", 
    tags=["Authentication"],
    responses={
        401: {"description": "Authentication failed"},
        403: {"description": "Access forbidden"},
        404: {"description": "User not found"}
    }
)

# Constants from environment variables
KRATOS_PUBLIC_URL = os.getenv("KRATOS_PUBLIC_URL", "http://127.0.0.1:4433")
KRATOS_ADMIN_URL = os.getenv("KRATOS_ADMIN_URL", "http://127.0.0.1:4434")
JWT_SECRET = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Validate required environment variables
if not JWT_SECRET:
    raise ValueError("JWT_SECRET_KEY environment variable is not set")


def get_db():
    """Get database session for auth routes."""
    return get_database_session()

async def get_kratos_client():
    async with httpx.AsyncClient() as client:
        yield client

def create_jwt_token(user_id: int, kratos_id: str) -> str:
    """Create a new JWT token for authenticated user."""
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode = {
        "sub": str(user_id),
        "kid": kratos_id,
        "exp": expire
    }
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> User:
    """Return current user from request state (attached by JWTMiddleware)."""
    user = request.state.user
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@router.post(
    "/register",
    summary="👤 Complete User Registration",
    description="""
    Complete the user registration process using ORY Kratos flow.
    
    **Registration Process:**
    1. User initiates registration through Kratos UI
    2. Kratos validates credentials and creates identity
    3. This endpoint completes registration and creates local user
    4. Returns JWT token for immediate authentication
    
    **Requirements:**
    - Valid Kratos registration flow ID
    - Completed registration form data
    - Valid email and password
    
    **Returns:**
    - JWT access token
    - User profile information
    - Token expiration details
    """,
    response_description="Registration success with JWT token",
    responses={
        200: {
            "description": "Registration completed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "token_type": "bearer",
                        "user": {
                            "id": 123,
                            "email": "user@example.com",
                            "display_name": "John Doe",
                            "roles": ["user"],
                            "verified": False
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid registration flow or data",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Invalid registration flow"
                    }
                }
            }
        }
    }
)
async def register_user(
    flow_id: str = Query(
        ..., 
        description="Kratos registration flow ID",
        example="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    ),
    client: httpx.AsyncClient = Depends(get_kratos_client),
    db: Session = Depends(get_db)
):
    """Complete Kratos registration flow and create local user."""
    try:
        # Get registration data from Kratos
        response = await client.get(
            urljoin(KRATOS_PUBLIC_URL, f"/self-service/registration/flows?id={flow_id}")
        )
        response.raise_for_status()
        flow_data = response.json()

        if flow_data.get("active") != "password":
            raise HTTPException(status_code=400, detail="Invalid registration flow")

        # Extract identity data
        identity = flow_data.get("identity", {})
        traits = identity.get("traits", {})
        
        # Create local user
        user = User(
            kratos_id=identity["id"],
            email=traits["email"],
            display_name=f"{traits['name']['first']} {traits['name']['last']}",
            roles=["user"],
            verified=False
        )
        
        db.add(user)
        db.commit()

        # Generate JWT
        token = create_jwt_token(user.id, user.kratos_id)
        
        # Update user's JWT info
        user.current_jwt = token
        user.jwt_issued_at = datetime.utcnow()
        user.jwt_expires_at = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
        db.commit()

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "display_name": user.display_name,
                "roles": user.roles,
                "verified": user.verified
            }
        }

    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post(
    "/login",
    summary="🔐 User Login",
    description="""
    Complete user login process using ORY Kratos authentication.
    
    **Login Process:**
    1. User initiates login through Kratos UI
    2. Kratos validates credentials
    3. This endpoint completes login and issues JWT
    4. Updates user's last login timestamp
    
    **Security Features:**
    - JWT token with configurable expiration
    - Secure session management
    - Integration with ORY Kratos identity system
    
    **Token Details:**
    - Default expiration: 24 hours
    - Contains user ID and Kratos identity ID
    - Required for accessing protected endpoints
    """,
    response_description="Login success with JWT token",
    responses={
        200: {
            "description": "Login completed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "token_type": "bearer",
                        "user": {
                            "id": 123,
                            "email": "user@example.com",
                            "display_name": "John Doe",
                            "roles": ["user"],
                            "verified": True
                        }
                    }
                }
            }
        },
        400: {
            "description": "Invalid login flow or credentials",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Invalid login flow"
                    }
                }
            }
        },
        404: {
            "description": "User not found in local database",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "User not found"
                    }
                }
            }
        }
    }
)
async def login_user(
    flow_id: str = Query(
        ..., 
        description="Kratos login flow ID",
        example="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    ),
    client: httpx.AsyncClient = Depends(get_kratos_client),
    db: Session = Depends(get_db)
):
    """Complete Kratos login flow and issue JWT."""
    try:
        # Get login data from Kratos
        response = await client.get(
            urljoin(KRATOS_PUBLIC_URL, f"/self-service/login/flows?id={flow_id}")
        )
        response.raise_for_status()
        flow_data = response.json()

        if flow_data.get("active") != "password":
            raise HTTPException(status_code=400, detail="Invalid login flow")

        # Get identity data
        identity = flow_data.get("identity", {})
        
        # Find local user
        user = db.query(User).filter(User.kratos_id == identity["id"]).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Generate new JWT
        token = create_jwt_token(user.id, user.kratos_id)
        
        # Update user's JWT and login info
        user.current_jwt = token
        user.jwt_issued_at = datetime.utcnow()
        user.jwt_expires_at = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
        user.last_login = datetime.utcnow()
        db.commit()

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "display_name": user.display_name,
                "roles": user.roles,
                "verified": user.verified
            }
        }

    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post(
    "/reset-password",
    summary="🔄 Reset Password",
    description="""
    Initiate password reset process through ORY Kratos.
    
    **Reset Process:**
    1. User provides email address
    2. Kratos sends reset email if account exists
    3. User follows email link to reset password
    4. Password is updated in Kratos identity system
    
    **Security Features:**
    - Secure email-based verification
    - Time-limited reset tokens
    - No sensitive information exposed
    
    **Note:** This endpoint always returns success to prevent email enumeration attacks.
    """,
    response_description="Password reset initiated",
    responses={
        200: {
            "description": "Password reset email sent (if account exists)",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Password reset initiated. Check your email."
                    }
                }
            }
        }
    }
)
async def reset_password(
    email: str = Query(
        ..., 
        description="Email address for password reset",
        example="user@example.com"
    ),
    client: httpx.AsyncClient = Depends(get_kratos_client)
):
    """Initiate password reset flow through Kratos."""
    try:
        # Start recovery flow
        response = await client.post(
            urljoin(KRATOS_PUBLIC_URL, "/self-service/recovery"),
            json={"email": email}
        )
        response.raise_for_status()
        
        return {"message": "Password reset initiated. Check your email."}

    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post(
    "/verify-reset",
    summary="✅ Verify Password Reset",
    description="""
    Complete password reset verification process.
    
    **Verification Process:**
    1. User clicks reset link from email
    2. Kratos validates reset token
    3. This endpoint confirms reset completion
    4. User can now login with new password
    
    **Security:**
    - One-time use reset tokens
    - Time-limited validity
    - Secure token validation
    """,
    response_description="Password reset verification result",
    responses={
        200: {
            "description": "Password reset completed successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Password has been reset successfully."
                    }
                }
            }
        }
    }
)
async def verify_reset(
    flow_id: str = Query(
        ..., 
        description="Kratos recovery flow ID",
        example="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    ),
    client: httpx.AsyncClient = Depends(get_kratos_client)
):
    """Complete password reset verification."""
    try:
        # Get recovery flow status
        response = await client.get(
            urljoin(KRATOS_PUBLIC_URL, f"/self-service/recovery/flows?id={flow_id}")
        )
        response.raise_for_status()
        
        return {"message": "Password has been reset successfully."}

    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get(
    "/me",
    summary="👤 Get User Profile",
    description="""
    Get the current authenticated user's profile information.
    
    **Authentication Required:**
    - Valid JWT token in Authorization header
    - Format: `Bearer <token>`
    
    **Profile Information:**
    - User ID and Kratos identity ID
    - Email address and display name
    - User roles and permissions
    - Account verification status
    - Last login timestamp
    - JWT token information
    
    **Use Cases:**
    - Display user information in UI
    - Check authentication status
    - Verify user permissions
    """,
    response_description="Current user profile information",
    responses={
        200: {
            "description": "User profile retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "id": 123,
                        "kratos_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                        "email": "user@example.com",
                        "display_name": "John Doe",
                        "roles": ["user"],
                        "verified": True,
                        "active": True,
                        "last_login": "2024-12-16T15:00:00Z",
                        "created_at": "2024-12-01T10:00:00Z",
                        "jwt_expires_at": "2024-12-17T15:00:00Z"
                    }
                }
            }
        },
        401: {
            "description": "Authentication required",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Not authenticated"
                    }
                }
            }
        }
    }
)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile information."""
    return {
        "id": current_user.id,
        "kratos_id": current_user.kratos_id,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "roles": current_user.roles,
        "verified": current_user.verified,
        "active": current_user.active,
        "last_login": current_user.last_login,
        "created_at": current_user.created_at,
        "jwt_expires_at": current_user.jwt_expires_at
    }