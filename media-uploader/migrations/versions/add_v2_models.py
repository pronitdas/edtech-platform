"""Add V2 models for media files and LLM usage

Revision ID: v2_models_001
Revises: [previous revision]
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'v2_models_001'
down_revision = None  # Update this with actual previous revision
branch_labels = None
depends_on = None

def upgrade() -> None:
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
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for performance
    op.create_index('ix_media_files_v2_user_id', 'media_files_v2', ['user_id'])
    op.create_index('ix_media_files_v2_created_at', 'media_files_v2', ['created_at'])
    
    # Create llm_usage_logs table
    op.create_table(
        'llm_usage_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('model', sa.String(), nullable=False),
        sa.Column('prompt_tokens', sa.Integer(), nullable=True),
        sa.Column('completion_tokens', sa.Integer(), nullable=True),
        sa.Column('total_tokens', sa.Integer(), nullable=True),
        sa.Column('cost', sa.Float(), nullable=True),
        sa.Column('request_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for analytics queries
    op.create_index('ix_llm_usage_logs_user_id', 'llm_usage_logs', ['user_id'])
    op.create_index('ix_llm_usage_logs_created_at', 'llm_usage_logs', ['created_at'])
    op.create_index('ix_llm_usage_logs_model', 'llm_usage_logs', ['model'])

def downgrade() -> None:
    # Drop tables and indexes
    op.drop_index('ix_llm_usage_logs_model', table_name='llm_usage_logs')
    op.drop_index('ix_llm_usage_logs_created_at', table_name='llm_usage_logs')
    op.drop_index('ix_llm_usage_logs_user_id', table_name='llm_usage_logs')
    op.drop_table('llm_usage_logs')
    
    op.drop_index('ix_media_files_v2_created_at', table_name='media_files_v2')
    op.drop_index('ix_media_files_v2_user_id', table_name='media_files_v2')
    op.drop_table('media_files_v2')