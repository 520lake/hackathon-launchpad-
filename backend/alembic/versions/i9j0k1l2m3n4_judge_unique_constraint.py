"""judge unique constraint

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-03-17

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "i9j0k1l2m3n4"
down_revision = "h8i9j0k1l2m3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_unique_constraint("uq_judge_user_hackathon", "judge", ["user_id", "hackathon_id"])


def downgrade() -> None:
    op.drop_constraint("uq_judge_user_hackathon", "judge", type_="unique")
