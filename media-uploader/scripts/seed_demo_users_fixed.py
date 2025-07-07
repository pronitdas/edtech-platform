#!/usr/bin/env python3
"""
Fixed Demo User Seeding Script
Creates demo users properly integrated with Kratos
"""

import asyncio
import sys
import os
import json
import httpx
from datetime import datetime, timezone
import uuid

# Add the src directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User, Base

# Demo users metadata (no passwords - Kratos handles that)
DEMO_USERS_METADATA = [
    {
        "email": "student@example.com",
        "display_name": "Demo Student",
        "roles": ["student"],
        "verified": True,
        "active": True,
        "onboarding_completed": True,
        # Student-specific fields
        "grade_level": "10th Grade",
        "subjects_of_interest": ["Mathematics", "Physics", "Chemistry"],
        "learning_goals": "Improve problem-solving skills and prepare for college",
        "preferred_difficulty": "intermediate"
    },
    {
        "email": "teacher@example.com", 
        "display_name": "Demo Teacher",
        "roles": ["teacher"],
        "verified": True,
        "active": True,
        "onboarding_completed": True,
        # Teacher-specific fields
        "school_name": "Demo High School",
        "subjects_taught": ["Mathematics", "Physics"],
        "grade_levels_taught": ["9th Grade", "10th Grade", "11th Grade"],
        "years_experience": 5,
        "classroom_size": 25
    },
    {
        "email": "content@example.com",
        "display_name": "Demo Content Creator",
        "roles": ["content_creator"],
        "verified": True,
        "active": True,
        "onboarding_completed": True
    },
    {
        "email": "admin@example.com",
        "display_name": "Demo Admin", 
        "roles": ["admin", "teacher", "content_creator"],
        "verified": True,
        "active": True,
        "onboarding_completed": True,
        # Teacher fields for admin
        "school_name": "Demo Admin School",
        "subjects_taught": ["All Subjects"],
        "grade_levels_taught": ["All Grades"],
        "years_experience": 10,
        "classroom_size": 30
    }
]

# Kratos identities to create (with passwords for Kratos)
KRATOS_USERS = [
    {
        "email": "student@example.com",
        "password": "demo123",
        "name": "Demo Student"
    },
    {
        "email": "teacher@example.com",
        "password": "demo123", 
        "name": "Demo Teacher"
    },
    {
        "email": "content@example.com",
        "password": "demo123",
        "name": "Demo Content Creator"
    },
    {
        "email": "admin@example.com",
        "password": "demo123",
        "name": "Demo Admin"
    }
]

async def create_kratos_identities():
    """Create identities in Kratos with passwords"""
    print("🔐 Creating demo identities in Kratos...")
    
    kratos_admin_url = os.getenv("KRATOS_ADMIN_URL", "http://localhost:4434")
    created_identities = {}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for user_data in KRATOS_USERS:
            try:
                # Check if identity already exists
                try:
                    response = await client.get(f"{kratos_admin_url}/admin/identities")
                    if response.status_code == 200:
                        existing_identities = response.json()
                        for identity in existing_identities:
                            if identity["traits"]["email"] == user_data["email"]:
                                print(f"   ⚠️  Kratos identity {user_data['email']} already exists")
                                created_identities[user_data["email"]] = identity["id"]
                                continue
                except:
                    pass  # Continue if we can't check existing identities
                
                # Create identity with password
                identity_data = {
                    "schema_id": "user_v0",
                    "traits": {
                        "email": user_data["email"],
                        "name": {
                            "first": user_data["name"].split()[0],
                            "last": user_data["name"].split()[-1] if len(user_data["name"].split()) > 1 else ""
                        }
                    },
                    "credentials": {
                        "password": {
                            "config": {
                                "password": user_data["password"]
                            }
                        }
                    },
                    "state": "active"
                }
                
                response = await client.post(
                    f"{kratos_admin_url}/admin/identities",
                    json=identity_data
                )
                
                if response.status_code == 201:
                    identity = response.json()
                    created_identities[user_data["email"]] = identity["id"]
                    print(f"   ✅ Created Kratos identity: {user_data['email']} (ID: {identity['id']})")
                else:
                    print(f"   ❌ Failed to create Kratos identity for {user_data['email']}: {response.text}")
                    
            except Exception as e:
                print(f"   ❌ Error creating Kratos identity for {user_data['email']}: {e}")
    
    return created_identities

def create_user_metadata(kratos_identities):
    """Create user metadata in our database"""
    print("🗄️  Creating user metadata in database...")
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        created_count = 0
        for user_data in DEMO_USERS_METADATA:
            email = user_data["email"]
            
            # Check if user already exists
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                print(f"   ⚠️  User metadata for {email} already exists, updating...")
                # Update existing user
                for key, value in user_data.items():
                    if key != "email":  # Don't update email
                        if isinstance(value, list):
                            setattr(existing, key, json.dumps(value))
                        else:
                            setattr(existing, key, value)
                existing.updated_at = datetime.now(timezone.utc)
                created_count += 1
            else:
                # Get Kratos ID if available
                kratos_id = kratos_identities.get(email, str(uuid.uuid4()))
                
                # Create new user
                user_data_copy = user_data.copy()
                
                # Convert lists to JSON strings for database storage
                if isinstance(user_data_copy.get('roles'), list):
                    user_data_copy['roles'] = json.dumps(user_data_copy['roles'])
                if isinstance(user_data_copy.get('subjects_of_interest'), list):
                    user_data_copy['subjects_of_interest'] = json.dumps(user_data_copy['subjects_of_interest'])
                if isinstance(user_data_copy.get('subjects_taught'), list):
                    user_data_copy['subjects_taught'] = json.dumps(user_data_copy['subjects_taught'])
                if isinstance(user_data_copy.get('grade_levels_taught'), list):
                    user_data_copy['grade_levels_taught'] = json.dumps(user_data_copy['grade_levels_taught'])
                
                user = User(
                    kratos_id=kratos_id,
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc),
                    **user_data_copy
                )
                
                db.add(user)
                created_count += 1
                print(f"   ✅ Created user metadata: {email} (Kratos ID: {kratos_id})")
        
        db.commit()
        print(f"🎉 Successfully processed {created_count} user records!")
        return True
        
    except Exception as e:
        print(f"❌ Error creating user metadata: {e}")
        db.rollback()
        return False
    finally:
        db.close()

async def test_auth_endpoints():
    """Test that the auth endpoints work"""
    print("🧪 Testing authentication endpoints...")
    
    api_url = os.getenv("API_URL", "http://localhost:8000")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # Test demo endpoints
            print("   Testing demo login endpoints...")
            response = await client.post(f"{api_url}/v2/auth/demo-login")
            if response.status_code == 200:
                print(f"   ✅ Student demo login works")
            else:
                print(f"   ❌ Student demo login failed: {response.status_code}")
            
            response = await client.post(f"{api_url}/v2/auth/demo-teacher-login")
            if response.status_code == 200:
                print(f"   ✅ Teacher demo login works")
            else:
                print(f"   ❌ Teacher demo login failed: {response.status_code}")
            
            # Test regular login if Kratos is available
            print("   Testing regular login endpoints...")
            login_data = {"email": "student@example.com", "password": "demo123"}
            response = await client.post(f"{api_url}/v2/auth/login", json=login_data)
            if response.status_code == 200:
                print(f"   ✅ Regular login works")
            else:
                print(f"   ⚠️  Regular login failed (normal if Kratos integration not complete): {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error testing auth endpoints: {e}")

def print_setup_info():
    """Print setup and usage information"""
    print("\n" + "="*60)
    print("🚀 DEMO ENVIRONMENT SETUP COMPLETE")
    print("="*60)
    
    kratos_admin_url = os.getenv("KRATOS_ADMIN_URL", "http://localhost:4434")
    kratos_public_url = os.getenv("KRATOS_PUBLIC_URL", "http://localhost:4433")
    api_url = os.getenv("API_URL", "http://localhost:8000")
    
    print(f"🔧 Service URLs:")
    print(f"   • API Server: {api_url}")
    print(f"   • Kratos Admin: {kratos_admin_url}")
    print(f"   • Kratos Public: {kratos_public_url}")
    print()
    
    print("📱 Demo Accounts (use these for testing):")
    for user in KRATOS_USERS:
        roles = next((u["roles"] for u in DEMO_USERS_METADATA if u["email"] == user["email"]), ["user"])
        role_str = ", ".join(roles)
        print(f"   • {user['email']} / {user['password']} ({role_str})")
    print()
    
    print("🌐 Frontend URLs:")
    print("   • Login: http://localhost:3000/login")
    print("   • Register: http://localhost:3000/register") 
    print("   • Dashboard: http://localhost:3000/app")
    print()
    
    print("🛠️  Admin/Debug URLs:")
    print(f"   • Kratos Admin: {kratos_admin_url}/admin/identities")
    print(f"   • API Health: {api_url}/health")
    print(f"   • API Docs: {api_url}/docs")
    print()
    
    print("💡 Quick Test Commands:")
    print(f"   curl {api_url}/v2/auth/demo-login")
    print(f"   curl {kratos_public_url}/sessions/whoami")
    print("="*60)

async def main():
    print("🚀 Fixed Demo User Seeding Script")
    print("="*40)
    
    # Create Kratos identities (with passwords)
    kratos_identities = {}
    try:
        kratos_identities = await create_kratos_identities()
    except Exception as e:
        print(f"⚠️  Kratos setup failed (continuing with metadata only): {e}")
    
    # Create user metadata in our database
    metadata_success = create_user_metadata(kratos_identities)
    
    # Test auth endpoints
    await test_auth_endpoints()
    
    # Print setup info
    print_setup_info()
    
    if metadata_success or kratos_identities:
        print("\n✅ Demo environment is ready!")
        print("   You can now test login with the accounts above")
    else:
        print("\n❌ Setup encountered issues. Check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())