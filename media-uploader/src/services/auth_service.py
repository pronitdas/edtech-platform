"""
Authentication service for V2 API - Direct database implementation
"""

import os
import logging
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import hashlib
from sqlalchemy.orm import Session
import jwt
from jwt.exceptions import PyJWTError as JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models import User
from database import get_db

logger = logging.getLogger(__name__)

# Security scheme for FastAPI
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

def hash_password(password: str) -> str:
    """Simple password hashing using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        
    async def register(self, email: str, password: str, name: str = None) -> Dict[str, Any]:
        """Register a new user directly in the database"""
        try:
            # Check if user already exists
            existing_user = self.db.query(User).filter(User.email == email).first()
            if existing_user:
                return {"error": "User with this email already exists"}
            
            # Create new user
            hashed_password = hash_password(password)
            kratos_id = str(uuid.uuid4())  # Generate a unique ID
            
            user = User(
                kratos_id=kratos_id,
                email=email,
                display_name=name or email.split('@')[0],
                verified=True,
                active=True,
                password_hash=hashed_password,
                created_at=datetime.utcnow()
            )
            
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            
            # Create JWT token
            access_token = self.create_access_token(data={"sub": str(user.id)})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": user.id,
                "email": user.email
            }
                
        except Exception as e:
            logger.error(f"Registration error: {e}")
            self.db.rollback()
            return {"error": str(e)}
    
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """Login user with email and password"""
        try:
            # Find user by email
            user = self.db.query(User).filter(User.email == email).first()
            if not user:
                return {"error": "Invalid credentials"}
            
            # Check if user has a password hash (for backwards compatibility)
            if not hasattr(user, 'password_hash') or not user.password_hash:
                # Set password for existing users without password
                user.password_hash = hash_password(password)
                self.db.commit()
            else:
                # Verify password
                if not verify_password(password, user.password_hash):
                    return {"error": "Invalid credentials"}
            
            # Update last login
            user.last_login = datetime.utcnow()
            self.db.commit()
            
            # Create JWT token
            access_token = self.create_access_token(data={"sub": str(user.id)})
            
            return {
                "access_token": access_token,
                "token_type": "bearer", 
                "user_id": user.id,
                "email": user.email
            }
                
        except Exception as e:
            logger.error(f"Login error: {e}")
            return {"error": str(e)}
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                return None
            return {"user_id": int(user_id)}
        except JWTError:
            return None
    
    def get_current_user(self, token: str) -> Optional[User]:
        """Get current user from token"""
        payload = self.verify_token(token)
        if payload is None:
            return None
        
        user_id = payload.get("user_id")
        if user_id is None:
            return None
            
        user = self.db.query(User).filter(User.id == user_id).first()
        return user


# Standalone function for FastAPI dependency injection
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to get the current authenticated user
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode the JWT token
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    
    return user
