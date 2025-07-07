"""Add API keys table for user profile management

Revision ID: add_api_keys_table
Revises: 
Create Date: 2025-01-03 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_api_keys_table'
down_revision = '3a91fac28ea8'  # Latest head revision
depends_on = None


def upgrade():
    # Create API keys table
    op.create_table('user_api_keys',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('provider_name', sa.String(length=50), nullable=False),
    sa.Column('api_key_encrypted', sa.Text(), nullable=False),
    sa.Column('api_key_hash', sa.String(length=64), nullable=False),  # For verification
    sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.Column('last_used_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'provider_name', name='unique_user_provider')
    )
    
    # Create index for faster lookups
    op.create_index('idx_user_api_keys_user_provider', 'user_api_keys', ['user_id', 'provider_name'])
    
    # Add profile settings column to users table
    op.add_column('users', sa.Column('profile_settings', sa.JSON(), nullable=True, default=dict))


def downgrade():
    # Remove profile settings column
    op.drop_column('users', 'profile_settings')
    
    # Drop indexes and table
    op.drop_index('idx_user_api_keys_user_provider', table_name='user_api_keys')
    op.drop_table('user_api_keys')