#!/usr/bin/env python3
"""
Create demo users for EdTech platform
- One teacher user
- One student user
"""

import sys
import os
import asyncio
from datetime import datetime, timedelta
import hashlib

# Add the media-uploader directory to the Python path
sys.path.append('/home/pronit/workspace/edtech-platform/media-uploader')

from models import User
from src.database.connection import get_db_connection
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

async def create_demo_users():
    """Create demo teacher and student users"""
    
    # Get database connection
    engine = get_db_connection()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    with SessionLocal() as db:
        try:
            # Check if demo users already exist
            existing_teacher = db.query(User).filter(User.email == "teacher@demo.com").first()
            existing_student = db.query(User).filter(User.email == "student@demo.com").first()
            
            if existing_teacher:
                print("Demo teacher already exists, updating...")
                teacher = existing_teacher
            else:
                print("Creating demo teacher user...")
                teacher = User(
                    email="teacher@demo.com",
                    password_hash=hashlib.sha256("teacher123".encode()).hexdigest(),
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(teacher)
                db.flush()  # Get the ID
            
            if existing_student:
                print("Demo student already exists, updating...")
                student = existing_student
            else:
                print("Creating demo student user...")
                student = User(
                    email="student@demo.com",
                    password_hash=hashlib.sha256("student123".encode()).hexdigest(),
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(student)
                db.flush()  # Get the ID
            
            # Create/update profiles
            teacher_profile = db.query(UserProfile).filter(UserProfile.user_id == teacher.id).first()
            if not teacher_profile:
                teacher_profile = UserProfile(
                    user_id=teacher.id,
                    name="Demo Teacher",
                    role="teacher",
                    bio="Experienced mathematics teacher specializing in algebra and geometry",
                    avatar_url="https://via.placeholder.com/150/4F46E5/white?text=T",
                    preferences={
                        "language": "English",
                        "notifications": True,
                        "theme": "light",
                        "dashboard_layout": "teacher_view"
                    },
                    onboarding_completed=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(teacher_profile)
            else:
                teacher_profile.name = "Demo Teacher"
                teacher_profile.role = "teacher"
                teacher_profile.bio = "Experienced mathematics teacher specializing in algebra and geometry"
                teacher_profile.onboarding_completed = True
                teacher_profile.updated_at = datetime.utcnow()
            
            student_profile = db.query(UserProfile).filter(UserProfile.user_id == student.id).first()
            if not student_profile:
                student_profile = UserProfile(
                    user_id=student.id,
                    name="Demo Student",
                    role="student",
                    bio="High school student passionate about mathematics and science",
                    avatar_url="https://via.placeholder.com/150/10B981/white?text=S",
                    preferences={
                        "language": "English",
                        "notifications": True,
                        "theme": "dark",
                        "dashboard_layout": "student_view",
                        "difficulty_preference": "intermediate"
                    },
                    onboarding_completed=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(student_profile)
            else:
                student_profile.name = "Demo Student"
                student_profile.role = "student"
                student_profile.bio = "High school student passionate about mathematics and science"
                student_profile.onboarding_completed = True
                student_profile.updated_at = datetime.utcnow()
            
            # Create demo learning data for student
            print("Creating demo learning progress...")
            
            # Insert some demo progress data using raw SQL
            # Note: This assumes knowledge domains exist in the database
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
            
            db.execute(text(demo_progress_sql), {
                "student_id": student.id,
                "now": now,
                "recent_date": recent_date,
                "older_date": older_date,
                "very_recent": very_recent
            })
            
            # Create demo session data
            demo_sessions_sql = """
            INSERT INTO session_info (user_id, session_start, session_end, total_time_seconds, pages_visited, created_at)
            VALUES 
                (:student_id, :session1_start, :session1_end, 3600, 15, :now),
                (:student_id, :session2_start, :session2_end, 2700, 12, :now),
                (:student_id, :session3_start, :session3_end, 1800, 8, :now),
                (:teacher_id, :teacher_session_start, :teacher_session_end, 5400, 25, :now)
            ON CONFLICT DO NOTHING;
            """
            
            session1_start = now - timedelta(days=1)
            session1_end = session1_start + timedelta(hours=1)
            session2_start = now - timedelta(days=2)
            session2_end = session2_start + timedelta(minutes=45)
            session3_start = now - timedelta(hours=3)
            session3_end = session3_start + timedelta(minutes=30)
            teacher_session_start = now - timedelta(hours=1)
            teacher_session_end = teacher_session_start + timedelta(hours=1, minutes=30)
            
            db.execute(text(demo_sessions_sql), {
                "student_id": student.id,
                "teacher_id": teacher.id,
                "session1_start": session1_start,
                "session1_end": session1_end,
                "session2_start": session2_start,
                "session2_end": session2_end,
                "session3_start": session3_start,
                "session3_end": session3_end,
                "teacher_session_start": teacher_session_start,
                "teacher_session_end": teacher_session_end,
                "now": now
            })
            
            # Commit all changes
            db.commit()
            
            print("\n✅ Demo users created successfully!")
            print(f"📧 Teacher: teacher@demo.com / teacher123 (ID: {teacher.id})")
            print(f"📧 Student: student@demo.com / student123 (ID: {student.id})")
            print("\n🔍 User Details:")
            print(f"Teacher Profile: {teacher_profile.name} - {teacher_profile.role}")
            print(f"Student Profile: {student_profile.name} - {student_profile.role}")
            
            return {
                "teacher": {
                    "id": teacher.id,
                    "email": "teacher@demo.com",
                    "password": "teacher123",
                    "name": teacher_profile.name,
                    "role": teacher_profile.role
                },
                "student": {
                    "id": student.id,
                    "email": "student@demo.com", 
                    "password": "student123",
                    "name": student_profile.name,
                    "role": student_profile.role
                }
            }
            
        except Exception as e:
            print(f"❌ Error creating demo users: {e}")
            db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(create_demo_users())