"""Complete schema - create all tables for production use

Revision ID: 20250628_complete
Revises: 
Create Date: 2025-06-28 12:00:00.000000

"""
from datetime import datetime
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '20250628_complete'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table first (other tables depend on it)
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('kratos_id', sa.String(36), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(100), nullable=True),
        sa.Column('password_hash', sa.String(256), nullable=True),
        sa.Column('roles', postgresql.JSON(), server_default='[]', nullable=False),
        sa.Column('verified', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('current_jwt', sa.String(), nullable=True),
        sa.Column('jwt_issued_at', sa.DateTime(), nullable=True),
        sa.Column('jwt_expires_at', sa.DateTime(), nullable=True),
        sa.Column('onboarding_completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('grade_level', sa.String(50), nullable=True),
        sa.Column('subjects_of_interest', postgresql.JSON(), nullable=True),
        sa.Column('learning_goals', sa.Text(), nullable=True),
        sa.Column('preferred_difficulty', sa.String(20), server_default='medium', nullable=True),
        sa.Column('school_name', sa.String(200), nullable=True),
        sa.Column('subjects_taught', postgresql.JSON(), nullable=True),
        sa.Column('grade_levels_taught', postgresql.JSON(), nullable=True),
        sa.Column('years_experience', sa.Integer(), nullable=True),
        sa.Column('classroom_size', sa.Integer(), nullable=True),
        sa.Column('profile_settings', postgresql.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('kratos_id'),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_kratos_id', 'users', ['kratos_id'], unique=False)
    op.create_index('ix_users_email', 'users', ['email'], unique=False)

    # Create user_api_keys table
    op.create_table(
        'user_api_keys',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('provider_name', sa.String(50), nullable=False),
        sa.Column('api_key_encrypted', sa.Text(), nullable=False),
        sa.Column('api_key_hash', sa.String(64), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create knowledge table
    op.create_table(
        'knowledge',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('content_type', sa.String(), nullable=True),
        sa.Column('difficulty_level', sa.String(), nullable=True),
        sa.Column('target_audience', postgresql.JSON(), nullable=True),
        sa.Column('prerequisites', postgresql.JSON(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('video_url', sa.String(), nullable=True),
        sa.Column('has_transcript', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('meta_data', postgresql.JSON(), nullable=True),
        sa.Column('retry_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('seeded', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_knowledge_id', 'knowledge', ['id'], unique=False)

    # Create chapters_v1 table
    op.create_table(
        'chapters_v1',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('meta_data', postgresql.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create retry_history table
    op.create_table(
        'retry_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create edtech_content table
    op.create_table(
        'edtech_content',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.String(), nullable=False),
        sa.Column('language', sa.String(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('quiz', postgresql.JSON(), nullable=True),
        sa.Column('mindmap', postgresql.JSON(), nullable=True),
        sa.Column('meta_data', postgresql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters_v1.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create media table
    op.create_table(
        'media',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=True),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('bucket_name', sa.String(), nullable=False),
        sa.Column('upload_status', sa.String(), server_default='pending', nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('meta_data', postgresql.JSON(), nullable=True),
        sa.Column('uploaded_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create media_files_v2 table
    op.create_table(
        'media_files_v2',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_media_files_v2_user_id', 'media_files_v2', ['user_id'], unique=False)
    op.create_index('ix_media_files_v2_created_at', 'media_files_v2', ['created_at'], unique=False)

    # Create llm_usage_logs table
    op.create_table(
        'llm_usage_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('model', sa.String(), nullable=False),
        sa.Column('prompt_tokens', sa.Integer(), nullable=True),
        sa.Column('completion_tokens', sa.Integer(), nullable=True),
        sa.Column('total_tokens', sa.Integer(), nullable=True),
        sa.Column('cost', sa.Float(), nullable=True),
        sa.Column('request_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_llm_usage_logs_user_id', 'llm_usage_logs', ['user_id'], unique=False)
    op.create_index('ix_llm_usage_logs_created_at', 'llm_usage_logs', ['created_at'], unique=False)
    op.create_index('ix_llm_usage_logs_model', 'llm_usage_logs', ['model'], unique=False)

    # Create roleplay_scenarios table
    op.create_table(
        'roleplay_scenarios',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.String(64), nullable=True),
        sa.Column('language', sa.String(48), server_default='English', nullable=True),
        sa.Column('topic', sa.Text(), nullable=True),
        sa.Column('prompt', sa.Text(), nullable=True),
        sa.Column('response', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create user_sessions table
    op.create_table(
        'user_sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('duration_sec', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create user_events table
    op.create_table(
        'user_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=True),
        sa.Column('chapter_id', sa.String(64), nullable=True),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.Column('event_type', sa.String(64), nullable=False),
        sa.Column('content_id', sa.String(64), nullable=True),
        sa.Column('ts', sa.DateTime(), nullable=True),
        sa.Column('data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['session_id'], ['user_sessions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_events_user_ts', 'user_events', ['user_id', 'ts'], unique=False)

    # Create content_analytics table
    op.create_table(
        'content_analytics',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=True),
        sa.Column('content_type', sa.String(50), nullable=True),
        sa.Column('language', sa.String(50), nullable=True),
        sa.Column('generation_time', sa.Float(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create engagement_metrics table
    op.create_table(
        'engagement_metrics',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=True),
        sa.Column('chapter_id', sa.String(50), nullable=True),
        sa.Column('views', sa.Integer(), server_default='0', nullable=True),
        sa.Column('completions', sa.Integer(), server_default='0', nullable=True),
        sa.Column('avg_time_spent', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create performance_stats table
    op.create_table(
        'performance_stats',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('operation_type', sa.String(50), nullable=True),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=True),
        sa.Column('error_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('performance_stats')
    op.drop_table('engagement_metrics')
    op.drop_table('content_analytics')
    op.drop_table('user_events')
    op.drop_table('user_sessions')
    op.drop_table('roleplay_scenarios')
    op.drop_table('llm_usage_logs')
    op.drop_table('media_files_v2')
    op.drop_table('media')
    op.drop_table('edtech_content')
    op.drop_table('retry_history')
    op.drop_table('chapters_v1')
    op.drop_table('knowledge')
    op.drop_table('user_api_keys')
    op.drop_table('users')
