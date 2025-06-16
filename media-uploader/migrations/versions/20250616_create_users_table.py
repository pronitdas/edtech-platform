"""Create Users table

Revision ID: 20250616_users
Revises: 20250616_edtech
Create Date: 2025-06-16 14:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20250616_users'
down_revision: Union[str, None] = '20250616_edtech'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create Users table."""
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('kratos_id', sa.String(36), nullable=False),
        sa.Column('email', sa.String, nullable=False),
        sa.Column('display_name', sa.String(100)),
        sa.Column('roles', postgresql.JSON, nullable=False, server_default='[]'),
        sa.Column('verified', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('last_login', sa.DateTime),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.current_timestamp()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.current_timestamp(), onupdate=sa.func.current_timestamp()),
        sa.Column('current_jwt', sa.String),
        sa.Column('jwt_issued_at', sa.DateTime),
        sa.Column('jwt_expires_at', sa.DateTime),
        
        # Indexes for performance and constraints
        sa.Index('ix_users_email', 'email', unique=True),
        sa.Index('ix_users_kratos_id', 'kratos_id', unique=True)
    )


def downgrade() -> None:
    """Remove Users table."""
    op.drop_table('users')