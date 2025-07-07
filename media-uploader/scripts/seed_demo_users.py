#!/usr/bin/env python3
"""
Demo User Seeding Script
Creates demo users for development and testing purposes
"""

import asyncio
import sys
import os
import json
import httpx
from datetime import datetime, timezone

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User, Base

# Demo users to create
DEMO_USERS = [
    {
        "email": "student@example.com",
        "password": "demo123",
        "display_name": "Demo Student",
        "roles": ["student"],
        "verified": True,
        "active": True,
        "onboarding_completed": True,
        "profile": {
            "grade_level": "10th Grade",
            "subjects_of_interest": ["Mathematics", "Physics", "Chemistry"],
            "learning_goals": ["Improve problem-solving skills", "Prepare for college"],
            "preferred_difficulty": "intermediate"
        }
    },
    {
        "email": "teacher@example.com", 
        "password": "demo123",
        "display_name": "Demo Teacher",
        "roles": ["teacher"],
        "verified": True,
        "active": True,
        "onboarding_completed": True,
        "profile": {
            "school_name": "Demo High School",
            "subjects_taught": ["Mathematics", "Physics"],
            "grade_levels_taught": ["9th Grade", "10th Grade", "11th Grade"],
            "years_experience": 5,
            "classroom_size": 25
        }
    },
    {
        "email": "content@example.com",
        "password": "demo123", 
        "display_name": "Demo Content Creator",
        "roles": ["content_creator"],
        "verified": True,
        "active": True,
        "onboarding_completed": True,
        "profile": {
            "content_specialties": ["Educational Videos", "Interactive Lessons"],
            "target_audiences": ["high_school", "college"],
            "content_types": ["video", "interactive", "quiz"]
        }
    },
    {
        "email": "admin@example.com",
        "password": "demo123",
        "display_name": "Demo Admin", 
        "roles": ["admin", "teacher", "content_creator"],
        "verified": True,
        "active": True,
        "onboarding_completed": True,
        "profile": {
            "school_name": "Demo Admin School",
            "subjects_taught": ["All Subjects"],
            "grade_levels_taught": ["All Grades"],
            "years_experience": 10,
            "classroom_size": 30
        }
    }
]

def create_demo_users_db():
    """Create demo users directly in the database"""
    print("🌱 Creating demo users in database...")
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        created_count = 0
        for user_data in DEMO_USERS:
            # Check if user already exists
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if existing:
                print(f"   ⚠️  User {user_data['email']} already exists, skipping...")
                continue
            
            # Create user
            profile = user_data.pop("profile", {})
            user = User(
                **user_data,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                # Add profile fields directly to user model
                **profile
            )
            
            # Convert roles to JSON string if it's a list
            if isinstance(user.roles, list):
                user.roles = json.dumps(user.roles)
                
            # Convert lists to JSON strings for database storage
            if hasattr(user, 'subjects_of_interest') and isinstance(user.subjects_of_interest, list):
                user.subjects_of_interest = json.dumps(user.subjects_of_interest)
            if hasattr(user, 'learning_goals') and isinstance(user.learning_goals, list):
                user.learning_goals = json.dumps(user.learning_goals)
            if hasattr(user, 'subjects_taught') and isinstance(user.subjects_taught, list):
                user.subjects_taught = json.dumps(user.subjects_taught)
            if hasattr(user, 'grade_levels_taught') and isinstance(user.grade_levels_taught, list):
                user.grade_levels_taught = json.dumps(user.grade_levels_taught)
            if hasattr(user, 'content_specialties') and isinstance(user.content_specialties, list):
                user.content_specialties = json.dumps(user.content_specialties)
            if hasattr(user, 'target_audiences') and isinstance(user.target_audiences, list):
                user.target_audiences = json.dumps(user.target_audiences)
            if hasattr(user, 'content_types') and isinstance(user.content_types, list):
                user.content_types = json.dumps(user.content_types)
            
            db.add(user)
            created_count += 1
            print(f"   ✅ Created user: {user_data['email']} ({user_data['roles']})")
        
        db.commit()
        print(f"🎉 Successfully created {created_count} demo users!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating demo users: {e}")
        db.rollback()
        return False
    finally:
        db.close()

async def create_demo_users_kratos():
    """Create demo users through Kratos API"""
    print("🔐 Creating demo users in Kratos...")
    
    kratos_admin_url = os.getenv("KRATOS_ADMIN_URL", "http://localhost:4434")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        created_count = 0
        
        for user_data in DEMO_USERS:
            try:
                # Create identity in Kratos
                identity_data = {
                    "schema_id": "user_v0",
                    "traits": {
                        "email": user_data["email"],
                        "name": user_data["display_name"]
                    }
                }
                
                # Check if identity already exists
                try:
                    response = await client.get(
                        f"{kratos_admin_url}/admin/identities",
                        params={"per_page": 100}
                    )
                    if response.status_code == 200:
                        existing_identities = response.json()
                        for identity in existing_identities:
                            if identity["traits"]["email"] == user_data["email"]:
                                print(f"   ⚠️  Kratos identity {user_data['email']} already exists, skipping...")
                                continue
                except:
                    pass  # Continue if we can't check existing identities
                
                # Create identity
                response = await client.post(
                    f"{kratos_admin_url}/admin/identities",
                    json=identity_data
                )
                
                if response.status_code == 201:
                    identity = response.json()
                    print(f"   ✅ Created Kratos identity: {user_data['email']} (ID: {identity['id']})")
                    created_count += 1
                else:
                    print(f"   ❌ Failed to create Kratos identity for {user_data['email']}: {response.text}")
                    
            except Exception as e:
                print(f"   ❌ Error creating Kratos identity for {user_data['email']}: {e}")
        
        print(f"🎉 Successfully created {created_count} Kratos identities!")
        return created_count > 0

async def test_demo_logins():
    """Test that demo login endpoints work"""
    print("🧪 Testing demo login endpoints...")
    
    api_url = os.getenv("API_URL", "http://localhost:8000")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # Test student demo login
            response = await client.post(f"{api_url}/v2/auth/demo-login")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Student demo login works - Token: {data.get('access_token', 'N/A')[:20]}...")
            else:
                print(f"   ❌ Student demo login failed: {response.text}")
            
            # Test teacher demo login
            response = await client.post(f"{api_url}/v2/auth/demo-teacher-login")
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ Teacher demo login works - Token: {data.get('access_token', 'N/A')[:20]}...")
            else:
                print(f"   ❌ Teacher demo login failed: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error testing demo logins: {e}")

def print_kratos_info():
    """Print Kratos admin information"""
    print("\n" + "="*60)
    print("🔐 KRATOS ADMIN INFORMATION")
    print("="*60)
    
    kratos_admin_url = os.getenv("KRATOS_ADMIN_URL", "http://localhost:4434")
    kratos_public_url = os.getenv("KRATOS_PUBLIC_URL", "http://localhost:4433")
    
    print(f"📋 Kratos Admin API: {kratos_admin_url}")
    print(f"🌐 Kratos Public API: {kratos_public_url}")
    print()
    print("🛠️  Useful Admin Endpoints:")
    print(f"   • List Identities: GET {kratos_admin_url}/admin/identities")
    print(f"   • Create Identity: POST {kratos_admin_url}/admin/identities")
    print(f"   • Get Identity: GET {kratos_admin_url}/admin/identities/{{id}}")
    print(f"   • Delete Identity: DELETE {kratos_admin_url}/admin/identities/{{id}}")
    print()
    print("🔍 Useful Public Endpoints:")
    print(f"   • Check Session: GET {kratos_public_url}/sessions/whoami")
    print(f"   • Login Flow: GET {kratos_public_url}/self-service/login/api")
    print(f"   • Registration Flow: GET {kratos_public_url}/self-service/registration/api")
    print()
    print("📱 Demo Accounts Created:")
    for user in DEMO_USERS:
        roles = ", ".join(user["roles"])
        print(f"   • {user['email']} (password: {user['password']}) - {roles}")
    print()
    print("🌐 Frontend URLs:")
    print("   • Login: http://localhost:3000/login")
    print("   • Register: http://localhost:3000/register")
    print("   • Dashboard: http://localhost:3000/app")
    print("="*60)

async def main():
    print("🚀 Demo User Seeding Script")
    print("="*40)
    
    # Create demo users in database
    db_success = create_demo_users_db()
    
    # Try to create demo users in Kratos
    try:
        kratos_success = await create_demo_users_kratos()
    except Exception as e:
        print(f"⚠️  Kratos not available: {e}")
        kratos_success = False
    
    # Test demo login endpoints
    await test_demo_logins()
    
    # Print summary
    print_kratos_info()
    
    if db_success:
        print("\n✅ Demo users are ready! You can now:")
        print("   1. Use demo login buttons on the frontend")
        print("   2. Login manually with the credentials above")
        print("   3. Use the Kratos admin API for user management")
    else:
        print("\n❌ Some issues occurred. Check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())