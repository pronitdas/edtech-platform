#!/usr/bin/env python3
"""
Test script to verify onboarding functionality
"""

import uuid
import hashlib
from datetime import datetime
from database import get_db
from sqlalchemy import text

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def test_create_student():
    db = next(get_db())
    try:
        kratos_id = str(uuid.uuid4())
        password_hash = hash_password("testpass123")
        
        # Use raw SQL to create user
        result = db.execute(text("""
            INSERT INTO users (
                kratos_id, email, display_name, password_hash, roles, 
                verified, active, onboarding_completed, grade_level, 
                subjects_of_interest, learning_goals, preferred_difficulty, 
                created_at
            ) VALUES (
                :kratos_id, :email, :name, :password_hash, :roles, 
                :verified, :active, :onboarding_completed, :grade_level, 
                :subjects_of_interest, :learning_goals, :preferred_difficulty, 
                :created_at
            )
            RETURNING id, email, display_name
        """), {
            'kratos_id': kratos_id,
            'email': 'rawsql@example.com',
            'name': 'Raw SQL Student',
            'password_hash': password_hash,
            'roles': '["student"]',
            'verified': True,
            'active': True,
            'onboarding_completed': True,
            'grade_level': 'High School (9-12)',
            'subjects_of_interest': '["Mathematics", "Science"]',
            'learning_goals': 'Learn with raw SQL',
            'preferred_difficulty': 'medium',
            'created_at': datetime.utcnow()
        })
        
        user = result.fetchone()
        db.commit()
        
        print(f"✓ Successfully created user with raw SQL:")
        print(f"  ID: {user[0]}")
        print(f"  Email: {user[1]}")
        print(f"  Name: {user[2]}")
        
        return user[0]
        
    except Exception as e:
        print(f"✗ Raw SQL creation failed: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    test_create_student()