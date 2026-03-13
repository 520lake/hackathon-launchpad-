"""add_hackathon_host

Revision ID: a1b2c3d4e5f6
Revises: ec39197b631e
Create Date: 2026-03-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'ec39197b631e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create the hackathonhost table for storing multiple hosts per hackathon
    op.create_table(
        'hackathonhost',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('hackathon_id', sa.Integer(), sa.ForeignKey('hackathon.id'), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=25), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('logo', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )
    op.create_index('ix_hackathonhost_hackathon_id', 'hackathonhost', ['hackathon_id'])

    # Migrate existing organizer_name data into the new table so no data is lost.
    # Each hackathon with a non-null organizer_name gets one host row (display_order=0).
    op.execute(
        "INSERT INTO hackathonhost (hackathon_id, name, display_order) "
        "SELECT id, organizer_name, 0 FROM hackathon "
        "WHERE organizer_name IS NOT NULL AND organizer_name != ''"
    )


def downgrade() -> None:
    op.drop_index('ix_hackathonhost_hackathon_id', table_name='hackathonhost')
    op.drop_table('hackathonhost')
