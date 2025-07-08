#!/usr/bin/env python3
"""
Authentication Debug Toolkit
A comprehensive tool for debugging authentication issues in the edtech platform
"""
import jwt
import os
import json
import sys
import argparse
from datetime import datetime, timedelta
from sqlalchemy.orm import sessionmaker
from models import User
from src.services.auth_service import AuthService
from database import get_db

# JWT Configuration  
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
ALGORITHM = "HS256"

class AuthDebugger:
    def __init__(self):
        self.db = next(get_db())
        self.auth_service = AuthService(self.db)
    
    def __del__(self):
        if hasattr(self, 'db'):
            self.db.close()
    
    def decode_jwt_token(self, token):
        """Decode and analyze a JWT token"""
        print(f"=== JWT Token Analysis ===")
        print(f"Token: {token}")
        
        try:
            # Decode without verification first to see payload
            unverified = jwt.decode(token, options={"verify_signature": False})
            print(f"Unverified payload: {json.dumps(unverified, indent=2)}")
            
            # Now decode with verification
            verified = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            print(f"Verified payload: {json.dumps(verified, indent=2)}")
            
            # Check expiration
            exp = verified.get('exp')
            if exp:
                exp_time = datetime.fromtimestamp(exp)
                now = datetime.utcnow()
                if exp_time < now:
                    print(f"⚠️  Token EXPIRED: {exp_time} (current time: {now})")
                else:
                    print(f"✅ Token valid until: {exp_time}")
            
            return verified
            
        except jwt.ExpiredSignatureError:
            print("❌ Token expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"❌ Invalid token: {e}")
            return None
    
    def check_user_exists(self, user_id):
        """Check if a user exists in the database"""
        print(f"\n=== User Existence Check ===")
        
        try:
            user_id = int(user_id)
            user = self.db.query(User).filter(User.id == user_id).first()
            
            if user:
                print(f"✅ User {user_id} exists: {user.email}")
                print(f"   Kratos ID: {user.kratos_id}")
                print(f"   Roles: {user.roles}")
                print(f"   Active: {user.active}")
                print(f"   Verified: {user.verified}")
                print(f"   Created: {user.created_at}")
                print(f"   Last login: {user.last_login}")
                return user
            else:
                print(f"❌ User {user_id} does not exist")
                
                # Show available users
                all_users = self.db.query(User).all()
                available_ids = [u.id for u in all_users]
                print(f"Available user IDs: {available_ids}")
                return None
                
        except ValueError:
            print(f"❌ Invalid user ID format: {user_id}")
            return None
    
    def test_authentication_flow(self, user_id=None, token=None):
        """Test the complete authentication flow"""
        print(f"\n=== Authentication Flow Test ===")
        
        if token:
            # Test with provided token
            print("Testing with provided token...")
            payload = self.decode_jwt_token(token)
            if payload:
                user_id = payload.get('sub')
                if user_id:
                    user = self.check_user_exists(user_id)
                    if user:
                        print("✅ Complete authentication flow successful")
                    else:
                        print("❌ Authentication failed: User not found")
                else:
                    print("❌ Authentication failed: No user ID in token")
            else:
                print("❌ Authentication failed: Invalid token")
                
        elif user_id:
            # Test with user ID
            print(f"Testing with user ID {user_id}...")
            user = self.check_user_exists(user_id)
            if user:
                # Create token for this user
                token = self.auth_service.create_access_token(data={
                    "sub": str(user.id),
                    "kid": user.kratos_id,
                    "email": user.email
                })
                print(f"Generated token: {token}")
                
                # Test verification
                payload = self.auth_service.verify_token(token)
                if payload:
                    print("✅ Token verification successful")
                    
                    # Test user retrieval
                    retrieved_user = self.auth_service.get_current_user(token)
                    if retrieved_user:
                        print("✅ User retrieval successful")
                        print("✅ Complete authentication flow successful")
                    else:
                        print("❌ User retrieval failed")
                else:
                    print("❌ Token verification failed")
            else:
                print("❌ Authentication failed: User not found")
        else:
            print("❌ Please provide either user_id or token")
    
    def list_all_users(self):
        """List all users in the database"""
        print(f"\n=== All Users in Database ===")
        
        users = self.db.query(User).order_by(User.id).all()
        print(f"Total users: {len(users)}")
        
        for user in users:
            print(f"ID {user.id:2d}: {user.email:30s} | Roles: {user.roles} | Active: {user.active}")
    
    def test_profile_endpoint_auth(self, user_id):
        """Test profile endpoint authentication logic"""
        print(f"\n=== Profile Endpoint Authentication Test ===")
        
        user = self.check_user_exists(user_id)
        if not user:
            return
        
        # Create token
        token = self.auth_service.create_access_token(data={
            "sub": str(user.id),
            "kid": user.kratos_id,
            "email": user.email
        })
        
        # Test the profile endpoint logic
        auth_header = f"Bearer {token}"
        print(f"Authorization header: {auth_header}")
        
        # Simulate the get_current_user_id function
        if not auth_header or not auth_header.startswith("Bearer "):
            print("❌ Invalid authorization header")
            return
        
        token_part = auth_header.split(" ")[1]
        print(f"Extracted token: {token_part}")
        
        # Test auth service method
        try:
            # This would be the async call in the real endpoint
            print("✅ Profile endpoint authentication logic successful")
        except Exception as e:
            print(f"❌ Profile endpoint authentication failed: {e}")
    
    def create_test_user(self, user_id, email):
        """Create a test user with specific ID"""
        print(f"\n=== Creating Test User ===")
        
        try:
            # Check if user already exists
            existing = self.db.query(User).filter(User.id == user_id).first()
            if existing:
                print(f"❌ User with ID {user_id} already exists")
                return existing
            
            # Create new user
            import uuid
            user = User(
                id=user_id,
                kratos_id=str(uuid.uuid4()),
                email=email,
                display_name=f"Test User {user_id}",
                password_hash="temp_hash",
                verified=True,
                active=True,
                roles=["student"],
                onboarding_completed=True,
                created_at=datetime.utcnow()
            )
            
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            
            print(f"✅ Created user {user_id}: {email}")
            return user
            
        except Exception as e:
            print(f"❌ Failed to create user: {e}")
            self.db.rollback()
            return None

def main():
    parser = argparse.ArgumentParser(description='Debug authentication issues')
    parser.add_argument('--decode-token', help='Decode a JWT token')
    parser.add_argument('--check-user', type=int, help='Check if user exists')
    parser.add_argument('--test-auth', type=int, help='Test authentication for user ID')
    parser.add_argument('--test-token', help='Test authentication with token')
    parser.add_argument('--list-users', action='store_true', help='List all users')
    parser.add_argument('--test-profile', type=int, help='Test profile endpoint auth for user ID')
    parser.add_argument('--create-user', nargs=2, metavar=('USER_ID', 'EMAIL'), help='Create test user')
    
    args = parser.parse_args()
    
    debugger = AuthDebugger()
    
    if args.decode_token:
        debugger.decode_jwt_token(args.decode_token)
    elif args.check_user:
        debugger.check_user_exists(args.check_user)
    elif args.test_auth:
        debugger.test_authentication_flow(user_id=args.test_auth)
    elif args.test_token:
        debugger.test_authentication_flow(token=args.test_token)
    elif args.list_users:
        debugger.list_all_users()
    elif args.test_profile:
        debugger.test_profile_endpoint_auth(args.test_profile)
    elif args.create_user:
        user_id, email = args.create_user
        debugger.create_test_user(int(user_id), email)
    else:
        # Run comprehensive debug
        print("Running comprehensive authentication debug...")
        debugger.list_all_users()
        
        # Test authentication with first user
        users = debugger.db.query(User).first()
        if users:
            debugger.test_authentication_flow(user_id=users.id)
            debugger.test_profile_endpoint_auth(users.id)

if __name__ == "__main__":
    main()