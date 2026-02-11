"""merge heads

Revision ID: 09c4966accd6
Revises: e45b12a8901c, eb69f6288567
Create Date: 2026-02-10 15:04:22.467443

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '09c4966accd6'
down_revision: Union[str, None] = ('e45b12a8901c', 'eb69f6288567')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
