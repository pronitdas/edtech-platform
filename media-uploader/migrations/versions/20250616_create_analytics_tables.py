"""create analytics tables

Revision ID: 202506160001
Revises: 20250616_create_users_table
Create Date: 2025-06-16 14:53:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '202506160001'
down_revision = '20250616_create_users_table'
branch_labels = None
depends_on = None


def upgrade():
    # Create content_analytics table
    op.create_table(
        'content_analytics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=True),
        sa.Column('content_type', sa.String(length=50), nullable=True),
        sa.Column('language', sa.String(length=50), nullable=True),
        sa.Column('generation_time', sa.Float(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('NOW()'), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create engagement_metrics table
    op.create_table(
        'engagement_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('knowledge_id', sa.Integer(), nullable=True),
        sa.Column('chapter_id', sa.String(length=50), nullable=True),
        sa.Column('views', sa.Integer(), server_default='0', nullable=True),
        sa.Column('completions', sa.Integer(), server_default='0', nullable=True),
        sa.Column('avg_time_spent', sa.Float(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('NOW()'), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create performance_stats table
    op.create_table(
        'performance_stats',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('operation_type', sa.String(length=50), nullable=True),
        sa.Column('duration', sa.Float(), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=True),
        sa.Column('error_count', sa.Integer(), server_default='0', nullable=True),
        sa.Column('timestamp', sa.TIMESTAMP(), server_default=sa.text('NOW()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('performance_stats')
    op.drop_table('engagement_metrics')
    op.drop_table('content_analytics')