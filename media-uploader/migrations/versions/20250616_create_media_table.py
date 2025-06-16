"""create media table

Revision ID: 202506160002
Revises: 202506160001
Create Date: 2025-06-16 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '202506160002'
down_revision = '202506160001'
branch_labels = None
depends_on = None


def upgrade():
    # Create media table
    op.create_table(
        'media',
        sa.Column('id', sa.Integer(), nullable=False),
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
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('NOW()'), nullable=True),
        sa.ForeignKeyConstraint(['knowledge_id'], ['knowledge.id'], ),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for performance
    op.create_index('ix_media_knowledge_id', 'media', ['knowledge_id'])
    op.create_index('ix_media_uploaded_by', 'media', ['uploaded_by'])
    op.create_index('ix_media_upload_status', 'media', ['upload_status'])


def downgrade():
    op.drop_index('ix_media_upload_status', 'media')
    op.drop_index('ix_media_uploaded_by', 'media')
    op.drop_index('ix_media_knowledge_id', 'media')
    op.drop_table('media') 