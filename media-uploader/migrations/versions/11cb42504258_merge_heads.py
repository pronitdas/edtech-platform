"""merge heads

Revision ID: 11cb42504258
Revises: 202506160002, 46030bad9313
Create Date: 2025-06-16 15:43:47.087782

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '11cb42504258'
down_revision: Union[str, None] = ('202506160002', '46030bad9313')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
