"""Create empty initial revision

Revision ID: 8e6111bd417a
Revises: faeff710babb
Create Date: 2025-06-16 13:26:54.141458

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8e6111bd417a'
down_revision: Union[str, None] = 'faeff710babb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
