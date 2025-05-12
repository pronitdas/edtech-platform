# [Database] Schema Redesign for Scalability and Performance

## Overview
Redesign our database schema to optimize for scalability, query performance, and data integrity, with special focus on analytics storage, interaction data, and content relationships.

## Background
Our current database schema has grown organically and now faces performance bottlenecks with large datasets. We need a comprehensive redesign to support future growth, improve query performance, and enable advanced analytics capabilities.

## Current Issues
1. Performance degradation with large interaction datasets
2. Inefficient schema for analytics queries
3. Lack of proper indexing strategy
4. Suboptimal relationship modeling
5. Data normalization/denormalization balance issues
6. Insufficient schema documentation
7. Missing partition strategy for large tables

## Technical Details

### Current Schema Overview
```
users
└── user_sessions
    └── user_interactions
        └── interaction_details
            └── (denormalized data)
```

### Proposed Schema Redesign

#### Core Entities
```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  user_role TEXT NOT NULL CHECK (user_role IN ('student', 'instructor', 'admin')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES users(id),
  thumbnail_url TEXT,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course Modules
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (course_id, position)
);

-- Content Items
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT CHECK (content_type IN ('video', 'quiz', 'reading', 'exercise', 'attachment')),
  position INTEGER NOT NULL,
  duration INTEGER, -- seconds, for video and audio
  is_required BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (module_id, position)
);

-- Content-specific tables for videos, quizzes, etc.
CREATE TABLE video_content (
  content_id UUID PRIMARY KEY REFERENCES content_items(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  transcript_url TEXT,
  captions_available BOOLEAN DEFAULT false,
  duration INTEGER NOT NULL, -- seconds
  encoding_details JSONB
);

CREATE TABLE quiz_content (
  content_id UUID PRIMARY KEY REFERENCES content_items(id) ON DELETE CASCADE,
  quiz_type TEXT CHECK (quiz_type IN ('assessment', 'practice', 'survey')),
  passing_score INTEGER,
  time_limit INTEGER, -- seconds, null for unlimited
  randomize_questions BOOLEAN DEFAULT false,
  show_answers BOOLEAN DEFAULT true,
  questions JSONB
);
```

#### Interaction & Tracking
```sql
-- User Sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  device_info JSONB,
  ip_address TEXT,
  metadata JSONB
);

-- Create a partitioned table for user interactions (partitioned by month)
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  content_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  is_processed BOOLEAN DEFAULT false
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for current and next few months
CREATE TABLE user_interactions_y2023m07 PARTITION OF user_interactions
  FOR VALUES FROM ('2023-07-01') TO ('2023-08-01');
  
CREATE TABLE user_interactions_y2023m08 PARTITION OF user_interactions
  FOR VALUES FROM ('2023-08-01') TO ('2023-09-01');
  
-- Video specific interactions
CREATE TABLE video_interactions (
  interaction_id UUID PRIMARY KEY REFERENCES user_interactions(id) ON DELETE CASCADE,
  video_id UUID REFERENCES video_content(content_id),
  position_seconds FLOAT,
  watched_duration FLOAT,
  playback_rate FLOAT,
  quality_level TEXT,
  is_fullscreen BOOLEAN,
  interaction_details JSONB
);

-- Quiz interactions
CREATE TABLE quiz_interactions (
  interaction_id UUID PRIMARY KEY REFERENCES user_interactions(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quiz_content(content_id),
  question_id TEXT,
  user_answer JSONB,
  is_correct BOOLEAN,
  time_taken FLOAT, -- seconds
  attempt_number INTEGER,
  score FLOAT
);
```

#### Analytics Optimized Tables
```sql
-- User Progress (materialized view or regularly updated table)
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  completed_items INTEGER DEFAULT 0,
  total_items INTEGER,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  completion_percentage FLOAT,
  time_spent INTEGER, -- minutes
  average_score FLOAT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, course_id)
);

-- Content Engagement Metrics (updated daily)
CREATE TABLE content_engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  views_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,
  average_time_spent FLOAT,
  average_score FLOAT,
  difficulty_rating FLOAT,
  engagement_score FLOAT,
  date_measured DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (content_id, date_measured)
);

-- Pre-aggregated Analytics
CREATE TABLE aggregated_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('course', 'module', 'content', 'user')),
  entity_id UUID NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value FLOAT,
  dimensions JSONB, -- for slicing data (e.g., by date, by device, etc.)
  start_date DATE,
  end_date DATE,
  granularity TEXT CHECK (granularity IN ('hour', 'day', 'week', 'month')),
  UNIQUE (entity_type, entity_id, metric_name, granularity, start_date)
);
```

### Indexing Strategy
```sql
-- User Interactions Indexes
CREATE INDEX idx_user_interactions_session ON user_interactions(session_id);
CREATE INDEX idx_user_interactions_content ON user_interactions(content_id);
CREATE INDEX idx_user_interactions_course ON user_interactions(course_id);
CREATE INDEX idx_user_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_user_interactions_date ON user_interactions(created_at);

-- Content Items Indexes
CREATE INDEX idx_content_items_module ON content_items(module_id);
CREATE INDEX idx_content_items_type ON content_items(content_type);

-- Module Indexes
CREATE INDEX idx_course_modules_course ON course_modules(course_id);

-- User Progress Indexes
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_course ON user_progress(course_id);
CREATE INDEX idx_user_progress_completion ON user_progress(completion_percentage);
CREATE INDEX idx_user_progress_last_activity ON user_progress(last_activity_at);

-- Analytics Indexes
CREATE INDEX idx_aggregated_analytics_entity ON aggregated_analytics(entity_type, entity_id);
CREATE INDEX idx_aggregated_analytics_metric ON aggregated_analytics(metric_name);
CREATE INDEX idx_aggregated_analytics_date ON aggregated_analytics(start_date, end_date);
```

### Data Migration Plan
1. Create new schema without constraints
2. Deploy migration script in stages
3. Copy and transform data from old to new schema
4. Verify data integrity
5. Apply constraints and indexes
6. Switch application to new schema
7. Archive old schema tables

## Performance Optimizations

### Query Optimizations
```sql
-- Example optimized query for user progress
EXPLAIN ANALYZE
SELECT
  u.full_name,
  c.title AS course_title,
  up.completion_percentage,
  up.time_spent,
  up.average_score,
  up.last_activity_at
FROM
  user_progress up
JOIN
  users u ON up.user_id = u.id
JOIN
  courses c ON up.course_id = c.id
WHERE
  up.completion_percentage < 100
  AND up.last_activity_at < NOW() - INTERVAL '7 days'
ORDER BY
  up.last_activity_at ASC
LIMIT 50;

-- Example optimized query for content engagement
EXPLAIN ANALYZE
SELECT
  ci.title,
  ci.content_type,
  cm.title AS module_title,
  c.title AS course_title,
  cem.views_count,
  cem.completion_count,
  cem.average_time_spent,
  cem.engagement_score
FROM
  content_engagement_metrics cem
JOIN
  content_items ci ON cem.content_id = ci.id
JOIN
  course_modules cm ON ci.module_id = cm.id
JOIN
  courses c ON cm.course_id = c.id
WHERE
  cem.date_measured = CURRENT_DATE - INTERVAL '1 day'
  AND ci.content_type = 'video'
  AND cem.views_count > 10
ORDER BY
  cem.engagement_score DESC
LIMIT 20;
```

### Additional Optimizations
1. Implement connection pooling configuration
2. Set up read replicas for analytics queries
3. Configure PgBouncer for connection management
4. Implement proper vacuum and analyze schedule
5. Configure RDS parameter groups for improved performance
6. Set up partial indexes for common queries
7. Implement proper sequence rebalancing

## Acceptance Criteria

- [ ] Schema redesign documentation completed
- [ ] Entity-relationship diagrams updated
- [ ] Indexing strategy documented
- [ ] Performance benchmarks established
- [ ] Migration plan documented
- [ ] Test database with new schema created
- [ ] Sample data migrated for testing
- [ ] Performance tests executed and documented
- [ ] Rollback plan created
- [ ] Application code updated to support new schema
- [ ] Database migration scripts created and tested
- [ ] Documentation updated for development team

## Migration Risk Assessment
1. **Data Loss Risk:**
   - Mitigation: Full database backup before migration
   - Mitigation: Verification scripts to ensure data integrity
   
2. **Downtime Risk:**
   - Mitigation: Staged migration approach
   - Mitigation: Scheduled maintenance window
   
3. **Performance Degradation:**
   - Mitigation: Benchmarking before and after
   - Mitigation: Ability to rollback if performance issues

4. **Application Compatibility:**
   - Mitigation: Comprehensive testing with new schema
   - Mitigation: Database access layer updates

## Technical Requirements
- PostgreSQL 14+ with partitioning support
- Supabase or AWS RDS compatible
- Database migration toolkit (e.g., Sqitch, Flyway, or custom)
- Database performance monitoring tools
- Schema visualization tools
- Test environment for validation

## Dependencies
- Development team availability for code updates
- DevOps support for deployment
- Production maintenance window for final migration
- QA resources for testing
- Backup and recovery infrastructure

## Estimated Effort
- Story Points: 34
- Time Estimate: 15-20 days

## Related Issues
- #007 - Real-Time Learning Analytics Dashboard
- #006 - Interactive Video Player Enhancements
- #011 - Improve Caching in Data Access Layer

## Labels
- database
- schema
- performance
- high-priority
- architecture 