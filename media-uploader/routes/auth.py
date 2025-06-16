import os
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urljoin
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

import jwt
import httpx
from fastapi import APIRouter, Depends, HTTPException, Response, Header

from sqlalchemy.orm import Session

from database import DatabaseManager
from models import User

router = APIRouter(prefix="/auth", tags=["authentication"])

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
    return DatabaseManager().get_session()

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

@router.post("/register")
async def register_user(
    flow_id: str,
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

@router.post("/login")
async def login_user(
    flow_id: str,
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

@router.post("/reset-password")
async def reset_password(
    email: str,
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

@router.post("/verify-reset")
async def verify_reset(
    flow_id: str,
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

@router.get("/me")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "roles": current_user.roles,
        "verified": current_user.verified,
        "last_login": current_user.last_login,
        "created_at": current_user.created_at
    }