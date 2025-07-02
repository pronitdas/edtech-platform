#!/usr/bin/env python3
"""
Create demo users for EdTech platform using V2 auth endpoints
This creates users directly in the database with generated kratos_ids for demo purposes
"""

import sys
import os
import asyncio
import json
import uuid
from datetime import datetime, timedelta
import hashlib
import requests

# Add the media-uploader directory to the Python path
sys.path.append('/home/pronit/workspace/edtech-platform/media-uploader')

from models import User
from database import SessionLocal
from sqlalchemy import text

# Backend API base URL
BACKEND_URL = "http://localhost:8000"

async def create_demo_users_via_api():
    """Create demo users using the V2 auth endpoints"""
    
    print("🚀 Creating demo users via API endpoints...")
    
    # Demo user data
    teacher_data = {
        "email": "teacher@demo.com",
        "password": "teacher123",
        "name": "Demo Teacher",
        "school_name": "Demo High School",
        "subjects_taught": ["Mathematics", "Algebra", "Geometry"],
        "grade_levels_taught": ["9th Grade", "10th Grade", "11th Grade"],
        "years_experience": 5,
        "classroom_size": 25
    }
    
    student_data = {
        "email": "student@demo.com",
        "password": "student123",
        "name": "Demo Student",
        "grade_level": "10th Grade",
        "subjects_of_interest": ["Mathematics", "Science", "Computer Science"],
        "learning_goals": "Improve problem-solving skills and prepare for college entrance exams",
        "preferred_difficulty": "medium"
    }
    
    try:
        # Create teacher
        print("📚 Creating teacher user...")
        teacher_response = requests.post(
            f"{BACKEND_URL}/v2/auth/onboard/teacher",
            json=teacher_data,
            headers={"Content-Type": "application/json"}
        )
        
        if teacher_response.status_code == 200:
            teacher_result = teacher_response.json()
            print(f"✅ Teacher created: ID {teacher_result.get('user_id')}")
            teacher_token = teacher_result.get('access_token')
        else:
            print(f"❌ Teacher creation failed: {teacher_response.status_code} - {teacher_response.text}")
            teacher_token = None
        
        # Create student
        print("🎓 Creating student user...")
        student_response = requests.post(
            f"{BACKEND_URL}/v2/auth/onboard/student",
            json=student_data,
            headers={"Content-Type": "application/json"}
        )
        
        if student_response.status_code == 200:
            student_result = student_response.json()
            print(f"✅ Student created: ID {student_result.get('user_id')}")
            student_token = student_result.get('access_token')
        else:
            print(f"❌ Student creation failed: {student_response.status_code} - {student_response.text}")
            student_token = None
        
        # Test login for both users
        print("\n🔐 Testing login credentials...")
        
        # Test teacher login
        teacher_login = requests.post(
            f"{BACKEND_URL}/v2/auth/login",
            json={"email": "teacher@demo.com", "password": "teacher123"},
            headers={"Content-Type": "application/json"}
        )
        
        if teacher_login.status_code == 200:
            print("✅ Teacher login successful")
        else:
            print(f"❌ Teacher login failed: {teacher_login.status_code}")
        
        # Test student login
        student_login = requests.post(
            f"{BACKEND_URL}/v2/auth/login",
            json={"email": "student@demo.com", "password": "student123"},
            headers={"Content-Type": "application/json"}
        )
        
        if student_login.status_code == 200:
            print("✅ Student login successful")
        else:
            print(f"❌ Student login failed: {student_login.status_code}")
        
        return {
            "success": True,
            "teacher": {
                "email": "teacher@demo.com",
                "password": "teacher123",
                "token": teacher_token
            },
            "student": {
                "email": "student@demo.com",
                "password": "student123",
                "token": student_token
            }
        }
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend API. Is the server running on port 8000?")
        return await create_demo_users_direct()
    except Exception as e:
        print(f"❌ Error creating users via API: {e}")
        return await create_demo_users_direct()

async def create_demo_users_direct():
    """Fallback: Create demo users directly in database"""
    
    print("📝 Creating demo users directly in database...")
    
    # Get database session
    with SessionLocal() as db:
        try:
            # Check if demo users already exist
            existing_teacher = db.query(User).filter(User.email == "teacher@demo.com").first()
            existing_student = db.query(User).filter(User.email == "student@demo.com").first()
            
            if existing_teacher:
                print("Demo teacher already exists, updating...")
                teacher = existing_teacher
                teacher.updated_at = datetime.utcnow()
            else:
                print("Creating demo teacher user...")
                teacher = User(
                    kratos_id=str(uuid.uuid4()),
                    email="teacher@demo.com",
                    display_name="Demo Teacher",
                    password_hash=hashlib.sha256("teacher123".encode()).hexdigest(),
                    roles=["teacher"],
                    verified=True,
                    active=True,
                    onboarding_completed=True,
                    
                    # Teacher specific fields
                    school_name="Demo High School",
                    subjects_taught=["Mathematics", "Algebra", "Geometry"],
                    grade_levels_taught=["9th Grade", "10th Grade", "11th Grade"],
                    years_experience=5,
                    classroom_size=25,
                    
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(teacher)
                db.flush()  # Get the ID
            
            if existing_student:
                print("Demo student already exists, updating...")
                student = existing_student
                student.updated_at = datetime.utcnow()
            else:
                print("Creating demo student user...")
                student = User(
                    kratos_id=str(uuid.uuid4()),
                    email="student@demo.com",
                    display_name="Demo Student", 
                    password_hash=hashlib.sha256("student123".encode()).hexdigest(),
                    roles=["student"],
                    verified=True,
                    active=True,
                    onboarding_completed=True,
                    
                    # Student specific fields
                    grade_level="10th Grade",
                    subjects_of_interest=["Mathematics", "Science", "Computer Science"],
                    learning_goals="Improve problem-solving skills and prepare for college entrance exams",
                    preferred_difficulty="medium",
                    
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(student)
                db.flush()  # Get the ID
            
            # Create demo learning progress for student
            print("📊 Creating demo learning progress...")
            
            # Insert some demo progress data
            demo_progress_sql = """
            INSERT INTO user_progress (user_id, knowledge_id, progress_percentage, last_accessed, created_at, updated_at)
            VALUES 
                (:student_id, 1, 75.5, :recent_date, :now, :now),
                (:student_id, 2, 45.0, :older_date, :now, :now),
                (:student_id, 3, 90.0, :very_recent, :now, :now)
            ON CONFLICT (user_id, knowledge_id) DO UPDATE SET
                progress_percentage = EXCLUDED.progress_percentage,
                last_accessed = EXCLUDED.last_accessed,
                updated_at = EXCLUDED.updated_at;
            """
            
            now = datetime.utcnow()
            recent_date = now - timedelta(hours=2)
            older_date = now - timedelta(days=3)
            very_recent = now - timedelta(minutes=30)
            
            try:
                db.execute(text(demo_progress_sql), {
                    "student_id": student.id,
                    "now": now,
                    "recent_date": recent_date,
                    "older_date": older_date,
                    "very_recent": very_recent
                })
            except Exception as e:
                print(f"⚠️  Could not create progress data (table may not exist): {e}")
            
            # Create demo analytics events
            demo_events_sql = """
            INSERT INTO analytics_events (user_id, event_type, event_data, created_at)
            VALUES 
                (:student_id, 'page_view', '{"page": "dashboard", "timestamp": "2024-01-01T10:00:00Z"}', :now),
                (:student_id, 'chapter_completed', '{"knowledge_id": 1, "chapter_id": "ch1", "score": 85}', :now),
                (:student_id, 'quiz_attempt', '{"quiz_id": "q1", "score": 78, "duration": 300}', :now),
                (:teacher_id, 'content_created', '{"content_type": "lesson", "subject": "mathematics"}', :now)
            ON CONFLICT DO NOTHING;
            """
            
            try:
                db.execute(text(demo_events_sql), {
                    "student_id": student.id,
                    "teacher_id": teacher.id,
                    "now": now
                })
            except Exception as e:
                print(f"⚠️  Could not create analytics events (table may not exist): {e}")
            
            # Commit all changes
            db.commit()
            
            print("\n✅ Demo users created successfully!")
            print(f"📧 Teacher: teacher@demo.com / teacher123 (ID: {teacher.id})")
            print(f"📧 Student: student@demo.com / student123 (ID: {student.id})")
            print(f"\n🔍 User Details:")
            print(f"Teacher: {teacher.display_name} - Roles: {teacher.roles}")
            print(f"Student: {student.display_name} - Roles: {student.roles}")
            print(f"Teacher School: {teacher.school_name}")
            print(f"Student Grade: {teacher.grade_level}")
            
            return {
                "success": True,
                "teacher": {
                    "id": teacher.id,
                    "email": "teacher@demo.com",
                    "password": "teacher123",
                    "kratos_id": teacher.kratos_id,
                    "name": teacher.display_name,
                    "roles": teacher.roles
                },
                "student": {
                    "id": student.id,
                    "email": "student@demo.com", 
                    "password": "student123",
                    "kratos_id": student.kratos_id,
                    "name": student.display_name,
                    "roles": student.roles
                }
            }
            
        except Exception as e:
            print(f"❌ Error creating demo users: {e}")
            db.rollback()
            raise

async def main():
    """Main function to create demo users"""
    
    print("🎯 EdTech Platform - Demo User Creation")
    print("=" * 50)
    
    # Try API first, fallback to direct database
    result = await create_demo_users_via_api()
    
    if result["success"]:
        print("\n🎉 Demo users ready!")
        print("\nLogin Credentials:")
        print(f"👨‍🏫 Teacher: teacher@demo.com / teacher123")
        print(f"👨‍🎓 Student: student@demo.com / student123")
        print(f"\n🌐 Access the frontend at: http://localhost:5174")
        print(f"📚 API documentation at: http://localhost:8000/docs")
    else:
        print("\n❌ Failed to create demo users")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())