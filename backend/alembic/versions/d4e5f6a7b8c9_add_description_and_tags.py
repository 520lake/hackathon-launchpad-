"""add description and tags to hackathon

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-03-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table: str, column: str) -> bool:
    """Check whether a column already exists (SQLite-compatible)."""
    conn = op.get_bind()
    result = conn.execute(sa.text(f"PRAGMA table_info('{table}')"))
    columns = [row[1] for row in result]
    return column in columns


def upgrade() -> None:
    if not _column_exists("hackathon", "description"):
        op.add_column("hackathon", sa.Column("description", sa.Text(), nullable=True))
    if not _column_exists("hackathon", "tags"):
        op.add_column("hackathon", sa.Column("tags", sa.Text(), nullable=True, server_default="[]"))


def downgrade() -> None:
    if _column_exists("hackathon", "tags"):
        op.drop_column("hackathon", "tags")
    if _column_exists("hackathon", "description"):
        op.drop_column("hackathon", "description")
