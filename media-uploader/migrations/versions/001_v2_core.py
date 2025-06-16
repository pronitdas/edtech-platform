"""v2_core_schema

Revision ID: 001_v2_core
Revises: 
Create Date: 2025-06-16 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_v2_core'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add user_id and timestamps to knowledge table
    op.add_column('knowledge', sa.Column('user_id', sa.Integer(), nullable=True))
    op.add_column('knowledge', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('knowledge', sa.Column('updated_at', sa.DateTime(), nullable=True))
    op.create_foreign_key('fk_knowledge_user', 'knowledge', 'users', ['user_id'], ['id'])
    
    # Add constraint to media table for cascade delete
    op.create_foreign_key('media_knowledge_fk', 'media', 'knowledge', ['knowledge_id'], ['id'], ondelete='CASCADE')
    
    # Add language column to chapters
    op.add_column('chapters_v1', sa.Column('language', sa.String(48), nullable=True, server_default='English'))
    op.create_index('idx_chapters_kid', 'chapters_v1', ['knowledge_id'])
    
    # Create roleplay_scenarios table
    op.create_table('roleplay_scenarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.String(64), nullable=True),
        sa.Column('language', sa.String(48), nullable=True, server_default='English'),
        sa.Column('topic', sa.Text(), nullable=True),
        sa.Column('prompt', sa.Text(), nullable=True),
        sa.Column('response', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create user_sessions table
    op.create_table('user_sessions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True, server_default=sa.text('now()')),
        sa.Column('ended_at', sa.DateTime(), nullable=True),
        sa.Column('duration_sec', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create user_events table
    op.create_table('user_events',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=True),
        sa.Column('chapter_id', sa.String(64), nullable=True),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.Column('event_type', sa.String(64), nullable=False),
        sa.Column('content_id', sa.String(64), nullable=True),
        sa.Column('ts', sa.DateTime(), nullable=True, server_default=sa.text('now()')),
        sa.Column('data', sa.JSON().with_variant(postgresql.JSONB(), "postgresql"), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['session_id'], ['user_sessions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for user_events
    op.create_index('idx_user_events_user_ts', 'user_events', ['user_id', 'ts'])
    
    # Create GIN index for JSONB data
    op.execute('CREATE INDEX idx_user_events_data_gin ON user_events USING gin (data)')
    
    # Create materialized view for user progress
    op.execute("""
        CREATE MATERIALIZED VIEW user_progress AS
        SELECT  
            user_id,
            knowledge_id,
            COUNT(DISTINCT chapter_id) AS chapters_viewed,
            MAX(ts) AS last_access,
            (COUNT(*) FILTER (WHERE event_type='chapter_complete'))::FLOAT /
            NULLIF(COUNT(DISTINCT chapter_id),0) * 100 AS progress_percent
        FROM user_events
        WHERE knowledge_id IS NOT NULL AND chapter_id IS NOT NULL
        GROUP BY user_id, knowledge_id;
    """)
    
    # Create index on materialized view
    op.create_index('idx_user_progress_user_knowledge', 'user_progress', ['user_id', 'knowledge_id'])


def downgrade() -> None:
    # Drop materialized view
    op.execute("DROP MATERIALIZED VIEW IF EXISTS user_progress")
    
    # Drop indexes
    op.execute('DROP INDEX IF EXISTS idx_user_events_data_gin')
    op.drop_index('idx_user_events_user_ts', 'user_events')
    op.drop_index('idx_chapters_kid', 'chapters_v1')
    
    # Drop tables
    op.drop_table('user_events')
    op.drop_table('user_sessions')
    op.drop_table('roleplay_scenarios')
    
    # Remove columns from knowledge
    op.drop_constraint('fk_knowledge_user', 'knowledge', type_='foreignkey')
    op.drop_column('knowledge', 'updated_at')
    op.drop_column('knowledge', 'created_at')
    op.drop_column('knowledge', 'user_id')
    
    # Remove language column from chapters
    op.drop_column('chapters_v1', 'language')
    
    # Remove media constraint
    op.drop_constraint('media_knowledge_fk', 'media', type_='foreignkey')
