"""create_edtech_content_table

Revision ID: 46030bad9313
Revises: 9b177ea0302b
Create Date: 2025-06-16 14:27:44.681268

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '46030bad9313'
down_revision: Union[str, None] = '9b177ea0302b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
