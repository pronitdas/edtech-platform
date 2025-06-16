"""v2_backend_schema

Revision ID: 5a55b0db5000
Revises: 6ae623a19442
Create Date: 2025-06-16 18:09:14.192739

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '5a55b0db5000'
down_revision: Union[str, None] = '6ae623a19442'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema for V2 backend."""
    
    # Add user_id and timestamps to knowledge table if they don't exist
    try:
        op.add_column('knowledge', sa.Column('user_id', sa.Integer(), nullable=True))
    except Exception:
        pass  # Column might already exist
    
    try:
        op.add_column('knowledge', sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('now()')))
    except Exception:
        pass
    
    try:
        op.add_column('knowledge', sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('now()')))
    except Exception:
        pass
    
    # Create foreign key if it doesn't exist
    try:
        op.create_foreign_key('fk_knowledge_user', 'knowledge', 'users', ['user_id'], ['id'])
    except Exception:
        pass
    
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
    
    # Create user_events table with JSONB for better performance
    op.create_table('user_events',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=True),
        sa.Column('chapter_id', sa.String(64), nullable=True),
        sa.Column('session_id', sa.String(), nullable=True),
        sa.Column('event_type', sa.String(64), nullable=False),
        sa.Column('content_id', sa.String(64), nullable=True),
        sa.Column('ts', sa.DateTime(), nullable=True, server_default=sa.text('now()')),
        sa.Column('data', postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['session_id'], ['user_sessions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for user_events
    op.create_index('idx_user_events_user_ts', 'user_events', ['user_id', 'ts'])
    op.create_index('idx_user_events_data_gin', 'user_events', ['data'], postgresql_using='gin')
    
    # Create materialized view for user progress (if not exists)
    op.execute("""
        CREATE MATERIALIZED VIEW IF NOT EXISTS user_progress AS
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
    try:
        op.create_index('idx_user_progress_user_knowledge', 'user_progress', ['user_id', 'knowledge_id'])
    except Exception:
        pass


def downgrade() -> None:
    """Downgrade schema for V2 backend."""
    
    # Drop materialized view
    op.execute("DROP MATERIALIZED VIEW IF EXISTS user_progress")
    
    # Drop indexes
    try:
        op.drop_index('idx_user_events_data_gin', 'user_events')
    except Exception:
        pass
    try:
        op.drop_index('idx_user_events_user_ts', 'user_events')
    except Exception:
        pass
    
    # Drop tables
    op.drop_table('user_events')
    op.drop_table('user_sessions')
    op.drop_table('roleplay_scenarios')
    
    # Remove columns from knowledge (optional - be careful in production)
    # op.drop_constraint('fk_knowledge_user', 'knowledge', type_='foreignkey')
    # op.drop_column('knowledge', 'updated_at')
    # op.drop_column('knowledge', 'created_at')
    # op.drop_column('knowledge', 'user_id')
