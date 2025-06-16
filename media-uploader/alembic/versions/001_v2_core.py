"""v2 core schema

Revision ID: 001_v2_core
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001_v2_core'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create new tables
    op.create_table('roleplay_scenarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=False),
        sa.Column('chapter_id', sa.String(64), nullable=True),
        sa.Column('language', sa.String(48), nullable=True, default='English'),
        sa.Column('topic', sa.Text(), nullable=True),
        sa.Column('prompt', sa.Text(), nullable=True),
        sa.Column('response', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('user_sessions',
        sa.Column('id', postgresql.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('ended_at', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('duration_sec', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('user_events',
        sa.Column('id', sa.BigInteger(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=True),
        sa.Column('chapter_id', sa.String(64), nullable=True),
        sa.Column('session_id', postgresql.UUID(), nullable=True),
        sa.Column('event_type', sa.String(64), nullable=False),
        sa.Column('content_id', sa.String(64), nullable=True),
        sa.Column('ts', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()')),
        sa.Column('data', postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['session_id'], ['user_sessions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('idx_user_events_data_gin', 'user_events', ['data'], postgresql_using='gin')
    op.create_index('idx_user_events_user_ts', 'user_events', ['user_id', 'ts'])
    op.create_index('idx_chapters_kid', 'chapters', ['knowledge_id'])

    # Modify existing tables
    op.drop_column('knowledge', 'filename')
    op.add_column('knowledge', sa.Column('name', sa.Text(), nullable=True))
    op.add_column('knowledge', sa.Column('content_type', sa.String(32), server_default='mixed'))
    op.add_column('chapters', sa.Column('language', sa.String(48), server_default='English'))

    # Add foreign key constraint to media table
    op.create_foreign_key('media_knowledge_fk', 'media', 'knowledge', ['knowledge_id'], ['id'], ondelete='CASCADE')

    # Create materialized view
    op.execute("""
        CREATE MATERIALIZED VIEW user_progress AS
        SELECT  user_id,
                knowledge_id,
                COUNT(DISTINCT chapter_id) AS chapters_viewed,
                MAX(ts) AS last_access,
                (COUNT(*) FILTER (WHERE event_type='chapter_complete'))::FLOAT /
                NULLIF(COUNT(DISTINCT chapter_id),0) * 100 AS progress_percent
        FROM    user_events
        GROUP BY user_id, knowledge_id;
    """)

def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS user_progress")
    op.drop_constraint('media_knowledge_fk', 'media', type_='foreignkey')
    op.drop_column('chapters', 'language')
    op.drop_column('knowledge', 'content_type')
    op.drop_column('knowledge', 'name')
    op.add_column('knowledge', sa.Column('filename', sa.String(), nullable=True))
    op.drop_index('idx_chapters_kid')
    op.drop_index('idx_user_events_user_ts')
    op.drop_index('idx_user_events_data_gin')
    op.drop_table('user_events')
    op.drop_table('user_sessions')
    op.drop_table('roleplay_scenarios')
