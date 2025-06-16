"""merge_heads

Revision ID: 6ae623a19442
Revises: 001_v2_core, ffe7f8d5024d
Create Date: 2025-06-16 17:48:26.457928

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6ae623a19442'
down_revision: Union[str, None] = ('001_v2_core', 'ffe7f8d5024d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
