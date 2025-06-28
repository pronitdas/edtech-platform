"""merge migration heads

Revision ID: 667e821ac5b8
Revises: 487e1be75dc3, v2_models_001
Create Date: 2025-06-29 01:47:40.959397

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '667e821ac5b8'
down_revision: Union[str, None] = ('487e1be75dc3', 'v2_models_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
