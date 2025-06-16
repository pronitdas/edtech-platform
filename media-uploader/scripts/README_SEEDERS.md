# Database Seeding Guide

This directory contains comprehensive database seeding scripts for the EdTech platform.

## Overview

The seeding system creates realistic test data including:
- **15 dummy users** with realistic profiles and authentication data
- **20 knowledge entries** covering various topics (ML, Web Dev, Data Science, etc.)
- **50 chapters per knowledge entry** (1000 total chapters)
- **Educational content** in multiple languages (notes, summaries, quizzes, mindmaps)
- **Media files** with realistic metadata
- **Analytics data** (content analytics, engagement metrics, performance stats)
- **User sessions and events** for realistic usage patterns
- **Roleplay scenarios** for interactive learning

## Files

### Core Seeders
- `seed_comprehensive.py` - Full-featured seeder using Faker library for realistic data
- `seed_simple.py` - Self-contained seeder with no external dependencies
- `run_seeders.sh` - Helper script to run seeders in Docker environment

### Database Initialization
- `init-db-enhanced.sh` - Enhanced PostgreSQL initialization script
- `init-db.sh` - Simple database initialization script
- `wait-for-postgres.sh` - Utility script for waiting for PostgreSQL

## Usage

### Method 1: Direct Python Execution (Recommended)

After your containers are running:

```bash
# Install dependencies if not already installed
pip install faker sqlalchemy psycopg2-binary

# Run the comprehensive seeder (with realistic fake data)
python scripts/seed_comprehensive.py

# OR run the simple seeder (no external dependencies)
python scripts/seed_simple.py
```

### Method 2: Using the Helper Script

```bash
# Make the script executable
chmod +x scripts/run_seeders.sh

# Run the seeder via Docker
./scripts/run_seeders.sh
```

### Method 3: Manual Docker Execution

```bash
# Wait for containers to be ready
docker compose up -d

# Run seeder inside the application container
docker compose exec media-uploader python scripts/seed_simple.py
```

## Generated Data Structure

### Users (15 total)
- Realistic email addresses and names
- Various roles: student, teacher, admin, content_creator, analyst
- JWT session data and authentication info
- Creation and login timestamps

### Knowledge Entries (20 total)
Topics include:
- Machine Learning Fundamentals
- Web Development with React
- Data Science Essentials
- Cloud Computing with AWS
- Mobile App Development
- Cybersecurity Basics
- And 14 more technical topics

Each knowledge entry includes:
- Difficulty levels (beginner/intermediate/advanced/expert)
- Target audience and prerequisites
- Content metadata (duration, instructor, ratings, views)
- Associated user ownership

### Chapters (1000 total - 50 per knowledge)
- Sequential chapter numbering
- Realistic titles and content
- Learning objectives and key concepts
- Estimated duration and difficulty

### Educational Content
- **Multi-language support**: English, Spanish, French, German, Japanese, Chinese
- **Notes**: Detailed explanatory content
- **Summaries**: Concise overviews
- **Quizzes**: Multiple-choice questions with explanations
- **Mindmaps**: Structured topic hierarchies

### Media Files
- **File types**: Video (MP4), Documents (PDF), Audio (MP3), Images (JPEG), Presentations (PPT)
- **Realistic metadata**: File sizes, durations, resolutions
- **Upload status tracking**: completed, pending, failed
- **Storage paths** and bucket organization

### Analytics Data
- **Content Analytics**: Generation times, success rates, error tracking
- **Engagement Metrics**: Views, completions, time spent per chapter
- **Performance Stats**: System operation performance data

### User Activity Data
- **User Sessions**: Realistic session durations and patterns
- **User Events**: Content views, chapter completions, quiz attempts
- **Device and browser tracking**: Desktop/mobile/tablet usage patterns

## Configuration

### Constants (in seed scripts)
- `NUM_USERS = 15` - Number of users to create
- `NUM_KNOWLEDGE = 20` - Number of knowledge entries
- `CHAPTERS_PER_KNOWLEDGE = 50` - Chapters per knowledge entry
- `LANGUAGES = [...]` - Supported languages for content
- `CONTENT_TYPES = [...]` - Supported content types

### Database Connection
The seeders use the `DATABASE_URL` from `database.py`. Ensure your PostgreSQL container is running and accessible.

## Safety Features

### Data Isolation
- All seeded data is marked with `seeded=True` flag
- Seeder clears only previously seeded data before creating new data
- Production data is protected from accidental deletion

### Error Handling
- Comprehensive error logging
- Transaction rollback on failures
- Graceful handling of constraint violations

### Idempotent Operations
- Safe to run multiple times
- Clears previous seeded data automatically
- Maintains data consistency

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```
   Error: could not connect to server
   ```
   Solution: Ensure PostgreSQL container is running and accessible

2. **Import Errors**
   ```
   ModuleNotFoundError: No module named 'faker'
   ```
   Solution: Install dependencies or use `seed_simple.py`

3. **Permission Errors**
   ```
   permission denied for relation
   ```
   Solution: Ensure database user has proper permissions

### Verification

Check seeded data:
```sql
-- Count seeded records
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'knowledge', COUNT(*) FROM knowledge WHERE seeded = true
UNION ALL  
SELECT 'chapters', COUNT(*) FROM chapters_v1
UNION ALL
SELECT 'edtech_content', COUNT(*) FROM edtech_content;
```

## Development Notes

### Extending the Seeders
- Add new data generators following existing patterns
- Maintain referential integrity between related tables
- Use realistic data distributions and relationships
- Test with various data volumes

### Performance Considerations
- Seeders use batch operations for efficiency
- Consider chunking for very large datasets
- Monitor memory usage with large data volumes

### Data Quality
- Realistic distributions (not just random data)
- Proper foreign key relationships
- Meaningful content relationships
- Chronologically consistent timestamps
