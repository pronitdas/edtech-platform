"""Create EdTechContent table

Revision ID: 20250616_edtech
Revises: 9b177ea0302b
Create Date: 2025-06-16 14:28:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20250616_edtech'
down_revision: Union[str, None] = '9b177ea0302b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create EdTechContent table."""
    op.create_table(
        'edtech_content',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('knowledge_id', sa.Integer, nullable=False),
        sa.Column('chapter_id', sa.String, nullable=False),
        sa.Column('language', sa.String, nullable=False),
        sa.Column('notes', sa.Text),
        sa.Column('summary', sa.Text),
        sa.Column('quiz', postgresql.JSON),
        sa.Column('mindmap', postgresql.JSON),
        sa.Column('meta_data', postgresql.JSON),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.current_timestamp(), onupdate=sa.func.current_timestamp()),
        
        # Foreign key constraints
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['chapter_id'], ['chapters_v1.id'], ondelete='CASCADE'),
        
        # Indexes for performance
        sa.Index('ix_edtech_content_knowledge_id', 'knowledge_id'),
        sa.Index('ix_edtech_content_chapter_id', 'chapter_id'),
        sa.Index('ix_edtech_content_language', 'language')
    )
    
    # Create a unique constraint to prevent duplicate content for same chapter/language
    op.create_unique_constraint(
        'uq_edtech_content_chapter_language',
        'edtech_content',
        ['chapter_id', 'language']
    )


def downgrade() -> None:
    """Remove EdTechContent table."""
    op.drop_table('edtech_content')