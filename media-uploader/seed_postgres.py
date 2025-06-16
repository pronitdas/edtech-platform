#!/usr/bin/env python3
"""
PostgreSQL Database Seeder

This script inserts test data into the PostgreSQL database for development and testing.
It uses SQLAlchemy to interact with the database and creates deterministic test records.

Example usage:
    python seed_postgres.py
"""

import logging
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from models import Base, Knowledge, Chapter, RetryHistory, EdTechContent
from database import DATABASE_URL

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_data(session: Session):
    """Create deterministic test data in the database."""
    
    # Create test knowledge entries
    knowledge_entries = [
        Knowledge(
            id=1,
            status="completed",
            content_type="video",
            difficulty_level="intermediate",
            target_audience={"roles": ["student", "professional"]},
            prerequisites={"skills": ["python_basics", "web_development"]},
            summary="Introduction to FastAPI",
            video_url="https://example.com/fastapi-intro",
            has_transcript=True,
            meta_data={"duration": "45m", "instructor": "Jane Doe"},
            retry_count=0,
            seeded=True
        ),
        Knowledge(
            id=2,
            status="pending",
            content_type="document",
            difficulty_level="beginner",
            target_audience={"roles": ["student"]},
            prerequisites={"skills": ["programming_basics"]},
            summary="Python for Beginners",
            video_url=None,
            has_transcript=False,
            meta_data={"format": "pdf", "pages": 50},
            retry_count=0,
            seeded=True
        )
    ]
    
    # Add and flush knowledge entries to get their IDs
    session.add_all(knowledge_entries)
    session.flush()
    
    # Create test chapters
    chapters = [
        Chapter(
            id="ch1-fastapi-intro",
            knowledge_id=1,
            content="# Introduction to FastAPI\n\nFastAPI is a modern web framework...",
            meta_data={"order": 1, "reading_time": "10m"}
        ),
        Chapter(
            id="ch2-fastapi-setup",
            knowledge_id=1,
            content="# Setting up FastAPI\n\nFirst, install FastAPI using pip...",
            meta_data={"order": 2, "reading_time": "15m"}
        ),
        Chapter(
            id="ch1-python-basics",
            knowledge_id=2,
            content="# Python Basics\n\nPython is a high-level programming language...",
            meta_data={"order": 1, "reading_time": "20m"}
        )
    ]
    
    # Add chapters
    session.add_all(chapters)
    
    # Create test retry history
    retry_histories = [
        RetryHistory(
            knowledge_id=1,
            status="success",
            error=None,
            created_at=datetime(2025, 6, 1, 10, 0, 0)
        ),
        RetryHistory(
            knowledge_id=2,
            status="error",
            error="Invalid file format",
            created_at=datetime(2025, 6, 1, 11, 0, 0)
        )
    ]
    
    # Add retry histories
    session.add_all(retry_histories)
    
    # Create test edtech content
    edtech_contents = [
        # English content for FastAPI Introduction (Chapter 1)
        EdTechContent(
            knowledge_id=1,
            chapter_id="ch1-fastapi-intro",
            language="English",
            notes="• FastAPI is a modern Python web framework\n• High performance and easy to learn\n• Built on Starlette and Pydantic\n• Automatic API documentation",
            summary="FastAPI is a modern, fast web framework for building APIs with Python 3.6+ based on standard Python type hints. It provides automatic Swagger UI documentation, validation, and high performance.",
            quiz={
                "questions": [
                    {
                        "question": "What is FastAPI based on?",
                        "options": ["Django", "Flask", "Starlette", "Express"],
                        "correct": 2,
                        "explanation": "FastAPI is built on top of Starlette framework"
                    },
                    {
                        "question": "What Python version is required for FastAPI?",
                        "options": ["2.7+", "3.4+", "3.6+", "3.8+"],
                        "correct": 2,
                        "explanation": "FastAPI requires Python 3.6 or above due to type hints"
                    }
                ]
            },
            mindmap={
                "root": "FastAPI Framework",
                "children": [
                    {
                        "name": "Key Features",
                        "children": ["Fast", "Easy to Learn", "Modern Python", "Auto Documentation"]
                    },
                    {
                        "name": "Based On",
                        "children": ["Starlette", "Pydantic"]
                    }
                ]
            },
            meta_data={
                "generated_at": "2025-06-16T14:30:00Z",
                "version": "1.0"
            }
        ),
        # Spanish content for FastAPI Introduction
        EdTechContent(
            knowledge_id=1,
            chapter_id="ch1-fastapi-intro",
            language="Spanish",
            notes="• FastAPI es un framework web moderno de Python\n• Alto rendimiento y fácil de aprender\n• Construido sobre Starlette y Pydantic\n• Documentación API automática",
            summary="FastAPI es un framework web moderno y rápido para construir APIs con Python 3.6+ basado en type hints estándar de Python. Proporciona documentación automática Swagger UI, validación y alto rendimiento.",
            quiz={
                "questions": [
                    {
                        "question": "¿Sobre qué está basado FastAPI?",
                        "options": ["Django", "Flask", "Starlette", "Express"],
                        "correct": 2,
                        "explanation": "FastAPI está construido sobre el framework Starlette"
                    },
                    {
                        "question": "¿Qué versión de Python requiere FastAPI?",
                        "options": ["2.7+", "3.4+", "3.6+", "3.8+"],
                        "correct": 2,
                        "explanation": "FastAPI requiere Python 3.6 o superior debido a los type hints"
                    }
                ]
            },
            mindmap={
                "root": "Framework FastAPI",
                "children": [
                    {
                        "name": "Características",
                        "children": ["Rápido", "Fácil de Aprender", "Python Moderno", "Documentación Auto"]
                    },
                    {
                        "name": "Basado En",
                        "children": ["Starlette", "Pydantic"]
                    }
                ]
            },
            meta_data={
                "generated_at": "2025-06-16T14:30:00Z",
                "version": "1.0",
                "locale": "es"
            }
        )
    ]
    
    # Add edtech content
    session.add_all(edtech_contents)

def main():
    """Main function to seed the database."""
    try:
        # Create database engine
        engine = create_engine(DATABASE_URL)
        
        # Create all tables
        Base.metadata.create_all(engine)
        
        # Create database session
        with Session(engine) as session:
            # Create test data
            create_test_data(session)
            
            # Commit the transaction
            session.commit()
            
            logger.info("Successfully seeded PostgreSQL database with test data")
            
    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}")
        raise

if __name__ == "__main__":
    main()