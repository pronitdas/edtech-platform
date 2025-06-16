#!/usr/bin/env python3
"""
Simple PostgreSQL Database Seeder (No External Dependencies)

This script creates comprehensive test data without external dependencies:
- 15 dummy users
- 20 knowledge entries 
- 50 chapters per knowledge (1000 total chapters)
- Related educational content, media files, and analytics
"""

import logging
import random
import uuid
import sys
import os
from datetime import datetime, timedelta
from typing import List
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

# Add parent directory to path to import local modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import (
    Base, User, Knowledge, Chapter, EdTechContent, Media, 
    ContentAnalytics, EngagementMetrics, PerformanceStats,
    RetryHistoryDB, RoleplayScenario, UserSession, UserEvent
)
from database import DATABASE_URL

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants for seeding
NUM_USERS = 15
NUM_KNOWLEDGE = 20
CHAPTERS_PER_KNOWLEDGE = 50
LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese']
CONTENT_TYPES = ['video', 'document', 'audio', 'mixed', 'presentation']
DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']
ROLES = ['student', 'teacher', 'admin', 'content_creator', 'analyst']

# Sample data for realistic generation
FIRST_NAMES = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa',
    'William', 'Jessica', 'James', 'Ashley', 'Christopher', 'Amanda', 'Daniel'
]

LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 
    'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'
]

SAMPLE_TEXTS = [
    "This comprehensive course provides detailed insights into the subject matter.",
    "Learn the fundamental concepts through practical examples and real-world applications.",
    "Discover advanced techniques used by industry professionals.",
    "Master the skills needed to excel in your career.",
    "Explore cutting-edge methodologies and best practices.",
    "Gain hands-on experience with interactive exercises and projects.",
    "Understand the theoretical foundations and practical implementations.",
    "Develop expertise through structured learning paths and assessments."
]

KNOWLEDGE_TOPICS = [
    "Machine Learning Fundamentals", "Web Development with React", "Data Science Essentials",
    "Cloud Computing with AWS", "Mobile App Development", "Cybersecurity Basics",
    "Artificial Intelligence", "Database Design", "DevOps Practices", "Python Programming",
    "JavaScript Advanced Concepts", "System Design", "Blockchain Technology", "UI/UX Design",
    "Network Programming", "Software Testing", "Microservices Architecture", "Docker & Kubernetes",
    "Data Visualization", "API Development"
]

def generate_email() -> str:
    """Generate a realistic email address."""
    first = random.choice(FIRST_NAMES).lower()
    last = random.choice(LAST_NAMES).lower()
    domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'company.com', 'university.edu']
    return f"{first}.{last}@{random.choice(domains)}"

def generate_name() -> str:
    """Generate a realistic full name."""
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def generate_text(min_words: int = 20, max_words: int = 100) -> str:
    """Generate sample text."""
    num_sentences = random.randint(2, 5)
    sentences = random.choices(SAMPLE_TEXTS, k=num_sentences)
    return " ".join(sentences)

def generate_hash() -> str:
    """Generate a random hash-like string."""
    return f"hash_{random.randint(100000, 999999)}_{uuid.uuid4().hex[:8]}"

def generate_users(session: Session) -> List[User]:
    """Generate realistic dummy users."""
    logger.info(f"Creating {NUM_USERS} dummy users...")
    
    users = []
    for i in range(NUM_USERS):
        user = User(
            kratos_id=str(uuid.uuid4()),
            email=generate_email(),
            display_name=generate_name(),
            password_hash=generate_hash(),
            roles=random.sample(ROLES, k=random.randint(1, 3)),
            verified=random.choice([True, False]),
            active=True,
            last_login=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            created_at=datetime.utcnow() - timedelta(days=random.randint(30, 365)),
            current_jwt=generate_hash()[:32],
            jwt_issued_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24)),
            jwt_expires_at=datetime.utcnow() + timedelta(days=random.randint(1, 30))
        )
        users.append(user)
        session.add(user)
    
    session.commit()
    logger.info(f"Created {len(users)} users successfully")
    return users

def generate_knowledge_entries(session: Session, users: List[User]) -> List[Knowledge]:
    """Generate realistic knowledge entries."""
    logger.info(f"Creating {NUM_KNOWLEDGE} knowledge entries...")
    
    knowledge_entries = []
    
    for i in range(NUM_KNOWLEDGE):
        topic = KNOWLEDGE_TOPICS[i] if i < len(KNOWLEDGE_TOPICS) else f"Advanced Topic {i+1}"
        knowledge = Knowledge(
            name=topic,
            status=random.choice(['pending', 'processing', 'completed', 'failed']),
            content_type=random.choice(CONTENT_TYPES),
            difficulty_level=random.choice(DIFFICULTY_LEVELS),
            target_audience={
                "roles": random.sample(['student', 'professional', 'researcher', 'developer'], 
                                    k=random.randint(1, 3)),
                "experience_level": random.choice(['beginner', 'intermediate', 'advanced'])
            },
            prerequisites={
                "skills": [f"skill_{j}" for j in range(random.randint(2, 5))],
                "knowledge": [f"prerequisite_{j}" for j in range(random.randint(1, 3))]
            },
            summary=generate_text(30, 80),
            video_url=f"https://example.com/video_{i}" if random.choice([True, False]) else None,
            has_transcript=random.choice([True, False]),
            meta_data={
                "duration": f"{random.randint(15, 180)}m",
                "instructor": generate_name(),
                "tags": [f"tag_{j}" for j in range(random.randint(3, 8))],
                "rating": round(random.uniform(3.5, 5.0), 1),
                "views": random.randint(100, 10000)
            },
            retry_count=random.randint(0, 3),
            seeded=True,
            user_id=random.choice(users).id,
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 180))
        )
        knowledge_entries.append(knowledge)
        session.add(knowledge)
    
    session.commit()
    logger.info(f"Created {len(knowledge_entries)} knowledge entries successfully")
    return knowledge_entries

def generate_chapters(session: Session, knowledge_entries: List[Knowledge]) -> List[Chapter]:
    """Generate chapters for each knowledge entry."""
    logger.info(f"Creating {CHAPTERS_PER_KNOWLEDGE} chapters per knowledge entry...")
    
    chapters = []
    chapter_templates = [
        "Introduction to {topic}", "Basic Concepts of {topic}", "Advanced {topic} Techniques",
        "Practical Applications of {topic}", "Case Studies in {topic}", "Best Practices for {topic}",
        "Common Pitfalls in {topic}", "Tools and Resources for {topic}", "Future of {topic}",
        "Hands-on Exercise: {topic}"
    ]
    
    for knowledge in knowledge_entries:
        for i in range(CHAPTERS_PER_KNOWLEDGE):
            chapter_id = f"{knowledge.id}_chapter_{i+1:03d}"
            
            chapter = Chapter(
                id=chapter_id,
                knowledge_id=knowledge.id,
                content=generate_text(100, 300),
                meta_data={
                    "title": random.choice(chapter_templates).format(topic=knowledge.name),
                    "order": i + 1,
                    "estimated_duration": f"{random.randint(10, 60)} minutes",
                    "learning_objectives": [f"objective_{j}" for j in range(random.randint(2, 5))],
                    "key_concepts": [f"concept_{j}" for j in range(random.randint(3, 8))],
                    "difficulty": random.choice(DIFFICULTY_LEVELS)
                }
            )
            chapters.append(chapter)
            session.add(chapter)
    
    session.commit()
    logger.info(f"Created {len(chapters)} chapters successfully")
    return chapters

def generate_edtech_content(session: Session, knowledge_entries: List[Knowledge], chapters: List[Chapter]):
    """Generate educational content for chapters."""
    logger.info("Creating educational content...")
    
    content_count = 0
    for knowledge in knowledge_entries:
        knowledge_chapters = [c for c in chapters if c.knowledge_id == knowledge.id]
        
        # Generate content for a subset of chapters in multiple languages
        sample_chapters = random.sample(knowledge_chapters, min(10, len(knowledge_chapters)))
        
        for chapter in sample_chapters:
            # Generate content in 1-3 languages
            selected_languages = random.sample(LANGUAGES, k=random.randint(1, 3))
            
            for language in selected_languages:
                content = EdTechContent(
                    knowledge_id=knowledge.id,
                    chapter_id=chapter.id,
                    language=language,
                    notes=generate_text(50, 150),
                    summary=generate_text(20, 50),
                    quiz={
                        "questions": [
                            {
                                "question": f"Sample question {i+1} about the topic?",
                                "options": [f"Option {j}" for j in range(1, 5)],
                                "correct_answer": random.randint(0, 3),
                                "explanation": "This is the correct answer explanation."
                            } for i in range(random.randint(3, 7))
                        ]
                    },
                    mindmap={
                        "central_topic": chapter.meta_data.get("title", "Chapter Topic"),
                        "branches": [
                            {
                                "topic": f"Branch {i+1}",
                                "subtopics": [f"Subtopic {j}" for j in range(random.randint(2, 5))]
                            } for i in range(random.randint(3, 6))
                        ]
                    },
                    meta_data={
                        "content_quality": random.choice(['draft', 'review', 'approved']),
                        "generated_by": "AI Assistant",
                        "word_count": random.randint(500, 2000)
                    }
                )
                session.add(content)
                content_count += 1
    
    session.commit()
    logger.info(f"Created {content_count} educational content entries successfully")

def generate_media_files(session: Session, knowledge_entries: List[Knowledge], users: List[User]):
    """Generate media file records."""
    logger.info("Creating media file records...")
    
    media_files = []
    file_types = [
        ('video/mp4', 'video'), ('application/pdf', 'document'), 
        ('audio/mpeg', 'audio'), ('image/jpeg', 'image'),
        ('application/vnd.ms-powerpoint', 'presentation')
    ]
    
    for knowledge in knowledge_entries:
        # 2-5 media files per knowledge entry
        num_files = random.randint(2, 5)
        
        for i in range(num_files):
            content_type, file_category = random.choice(file_types)
            extension = content_type.split('/')[-1]
            if extension == 'vnd.ms-powerpoint':
                extension = 'ppt'
            
            filename = f"{knowledge.name.lower().replace(' ', '_')}_{i+1}.{extension}"
            
            media = Media(
                knowledge_id=knowledge.id,
                filename=filename,
                original_filename=f"original_{filename}",
                content_type=content_type,
                file_size=random.randint(1024*1024, 500*1024*1024),  # 1MB to 500MB
                file_path=f"/uploads/{knowledge.id}/{filename}",
                bucket_name="edtech-content",
                upload_status=random.choice(['completed', 'pending', 'failed']),
                error_message="Sample error message" if random.choice([True, False]) else None,
                meta_data={
                    "file_category": file_category,
                    "duration": f"{random.randint(5, 120)} minutes" if file_category in ['video', 'audio'] else None,
                    "pages": random.randint(10, 200) if file_category == 'document' else None,
                    "resolution": f"{random.choice(['720p', '1080p', '4K'])}" if file_category == 'video' else None
                },
                uploaded_by=random.choice(users).id
            )
            media_files.append(media)
            session.add(media)
    
    session.commit()
    logger.info(f"Created {len(media_files)} media file records successfully")

def generate_analytics_data(session: Session, knowledge_entries: List[Knowledge], chapters: List[Chapter]):
    """Generate analytics and performance data."""
    logger.info("Creating analytics data...")
    
    # Content Analytics
    for knowledge in knowledge_entries:
        for _ in range(random.randint(5, 15)):
            analytics = ContentAnalytics(
                knowledge_id=knowledge.id,
                content_type=random.choice(['notes', 'summary', 'quiz', 'mindmap']),
                language=random.choice(LANGUAGES),
                generation_time=round(random.uniform(0.5, 30.0), 2),
                success=random.choice([True, False]),
                error_message="Sample error occurred" if random.choice([True, False]) else None
            )
            session.add(analytics)
    
    # Engagement Metrics
    knowledge_chapters = {}
    for chapter in chapters:
        if chapter.knowledge_id not in knowledge_chapters:
            knowledge_chapters[chapter.knowledge_id] = []
        knowledge_chapters[chapter.knowledge_id].append(chapter.id)
    
    for knowledge_id, chapter_ids in knowledge_chapters.items():
        sample_chapters = random.sample(chapter_ids, min(20, len(chapter_ids)))
        
        for chapter_id in sample_chapters:
            engagement = EngagementMetrics(
                knowledge_id=knowledge_id,
                chapter_id=chapter_id,
                views=random.randint(10, 1000),
                completions=random.randint(5, 500),
                avg_time_spent=round(random.uniform(5.0, 45.0), 2)
            )
            session.add(engagement)
    
    # Performance Stats
    operations = ['content_generation', 'video_processing', 'file_upload', 'quiz_generation']
    for _ in range(100):
        perf_stat = PerformanceStats(
            operation_type=random.choice(operations),
            duration=round(random.uniform(0.1, 60.0), 3),
            success=random.choice([True, False]),
            error_count=random.randint(0, 5),
            timestamp=datetime.utcnow() - timedelta(days=random.randint(1, 30))
        )
        session.add(perf_stat)
    
    session.commit()
    logger.info("Created analytics data successfully")

def generate_roleplay_scenarios(session: Session, knowledge_entries: List[Knowledge], chapters: List[Chapter]):
    """Generate roleplay scenarios."""
    logger.info("Creating roleplay scenarios...")
    
    scenarios = []
    for knowledge in knowledge_entries:
        knowledge_chapters = [c for c in chapters if c.knowledge_id == knowledge.id]
        sample_chapters = random.sample(knowledge_chapters, min(5, len(knowledge_chapters)))
        
        for chapter in sample_chapters:
            for language in random.sample(LANGUAGES, k=random.randint(1, 2)):
                scenario = RoleplayScenario(
                    knowledge_id=knowledge.id,
                    chapter_id=chapter.id,
                    language=language,
                    topic=f"Roleplay scenario for {knowledge.name}",
                    prompt=generate_text(20, 40),
                    response=generate_text(30, 60)
                )
                scenarios.append(scenario)
                session.add(scenario)
    
    session.commit()
    logger.info(f"Created {len(scenarios)} roleplay scenarios successfully")

def generate_user_sessions_and_events(session: Session, users: List[User], knowledge_entries: List[Knowledge]):
    """Generate user sessions and events."""
    logger.info("Creating user sessions and events...")
    
    all_sessions = []
    all_events = []
    
    for user in users:
        # Generate 5-15 sessions per user
        num_sessions = random.randint(5, 15)
        user_sessions = []
        
        for _ in range(num_sessions):
            session_id = str(uuid.uuid4())
            started_at = datetime.utcnow() - timedelta(days=random.randint(1, 60))
            duration = random.randint(300, 7200)  # 5 minutes to 2 hours
            
            user_session = UserSession(
                id=session_id,
                user_id=user.id,
                started_at=started_at,
                ended_at=started_at + timedelta(seconds=duration),
                duration_sec=duration
            )
            user_sessions.append(user_session)
            all_sessions.append(user_session)
            session.add(user_session)
        
        # Commit sessions for this user before creating events
        session.commit()
        
        # Now generate events for the committed sessions
        for user_session in user_sessions:
            num_events = random.randint(3, 20)
            event_types = ['view_content', 'complete_chapter', 'take_quiz', 'download_file', 'share_content']
            
            for i in range(num_events):
                event_time = user_session.started_at + timedelta(
                    seconds=random.randint(0, user_session.duration_sec)
                )
                knowledge = random.choice(knowledge_entries)
                
                event = UserEvent(
                    user_id=user.id,
                    knowledge_id=knowledge.id,
                    chapter_id=f"{knowledge.id}_chapter_{random.randint(1, 50):03d}",
                    session_id=user_session.id,  # Use the actual session ID
                    event_type=random.choice(event_types),
                    content_id=f"content_{random.randint(1, 1000)}",
                    ts=event_time,
                    data={
                        "device": random.choice(['desktop', 'mobile', 'tablet']),
                        "browser": random.choice(['chrome', 'firefox', 'safari', 'edge']),
                        "score": random.randint(60, 100) if random.choice(event_types) == 'take_quiz' else None
                    }
                )
                all_events.append(event)
                session.add(event)
        
        # Commit events for this user
        session.commit()
    
    logger.info(f"Created {len(all_sessions)} user sessions and {len(all_events)} events successfully")

def main():
    """Main seeding function."""
    logger.info("Starting comprehensive database seeding...")
    
    # Create engine and session
    engine = create_engine(DATABASE_URL)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    with Session(engine) as session:
        try:
            # Clear existing data (be careful in production!)
            logger.info("Clearing existing seeded data...")
            
            # Delete in reverse order to avoid foreign key constraints
            session.query(UserEvent).delete()
            session.query(UserSession).delete()
            session.query(RoleplayScenario).delete()
            session.query(PerformanceStats).delete()
            session.query(EngagementMetrics).delete()
            session.query(ContentAnalytics).delete()
            session.query(Media).delete()
            session.query(EdTechContent).delete()
            session.query(Chapter).delete()
            session.query(RetryHistoryDB).delete()
            session.query(Knowledge).filter(Knowledge.seeded == True).delete()
            session.query(User).delete()
            session.commit()
            
            # Generate all test data in order
            logger.info("Generating users...")
            users = generate_users(session)
            
            logger.info("Generating knowledge entries...")
            knowledge_entries = generate_knowledge_entries(session, users)
            
            logger.info("Generating chapters...")
            chapters = generate_chapters(session, knowledge_entries)
            
            logger.info("Generating educational content...")
            generate_edtech_content(session, knowledge_entries, chapters)
            
            logger.info("Generating media files...")
            generate_media_files(session, knowledge_entries, users)
            
            logger.info("Generating analytics data...")
            generate_analytics_data(session, knowledge_entries, chapters)
            
            logger.info("Generating roleplay scenarios...")
            generate_roleplay_scenarios(session, knowledge_entries, chapters)
            
            logger.info("Generating user sessions and events...")
            generate_user_sessions_and_events(session, users, knowledge_entries)
            
            logger.info("Database seeding completed successfully!")
            logger.info("Summary:")
            logger.info(f"  - {NUM_USERS} users created")
            logger.info(f"  - {NUM_KNOWLEDGE} knowledge entries created")
            logger.info(f"  - {NUM_KNOWLEDGE * CHAPTERS_PER_KNOWLEDGE} chapters created")
            logger.info(f"  - Educational content, media files, and analytics generated")
            logger.info(f"  - User sessions and events created")
            
        except Exception as e:
            logger.error(f"Error during seeding: {e}")
            session.rollback()
            raise

if __name__ == "__main__":
    main()
