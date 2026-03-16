"""softdelete_uniqueness_scoring

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-03-17 00:00:02.000000

Three changes:
1a. Soft-delete: DELETED status now a valid enum value (no schema change
    needed for SQLite VARCHAR columns).
1b. Submission uniqueness: add partial unique indexes on
    (hackathon_id, team_id) and (hackathon_id, user_id).
1c. Scoring redesign: add criteria_id to score, create
    criteriascoresummary table, add unique constraints.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "h8i9j0k1l2m3"
down_revision: Union[str, None] = "g7h8i9j0k1l2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1b. Submission uniqueness — partial unique indexes
    # SQLite supports partial indexes (WHERE clause)
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_submission_hackathon_team "
        "ON submission (hackathon_id, team_id) WHERE team_id IS NOT NULL"
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_submission_hackathon_user "
        "ON submission (hackathon_id, user_id) WHERE user_id IS NOT NULL"
    )

    # 1c. Scoring redesign
    # Add criteria_id to score table
    op.add_column("score", sa.Column("criteria_id", sa.Integer(), nullable=True))

    # For existing scores, we can't assign criteria_id retroactively.
    # Delete old scores that lack criteria_id (they used the old schema).
    op.execute("DELETE FROM score WHERE criteria_id IS NULL")

    # Now make criteria_id NOT NULL
    with op.batch_alter_table("score") as batch_op:
        batch_op.alter_column("criteria_id", nullable=False)
        # Drop the old 'details' column (replaced by per-criteria comments)
        batch_op.drop_column("details")

    # Add unique constraint for (judge_id, submission_id, criteria_id)
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_score_judge_sub_criteria "
        "ON score (judge_id, submission_id, criteria_id)"
    )

    # Create criteriascoresummary table
    op.create_table(
        "criteriascoresummary",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("submission_id", sa.Integer(), sa.ForeignKey("submission.id"), nullable=False),
        sa.Column("criteria_id", sa.Integer(), sa.ForeignKey("judgingcriteria.id"), nullable=False),
        sa.Column("avg_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.UniqueConstraint("submission_id", "criteria_id", name="uq_criteria_summary"),
    )


def downgrade() -> None:
    op.drop_table("criteriascoresummary")

    op.execute("DROP INDEX IF EXISTS uq_score_judge_sub_criteria")

    with op.batch_alter_table("score") as batch_op:
        batch_op.add_column(sa.Column("details", sa.String(), nullable=True))
        batch_op.alter_column("criteria_id", nullable=True)

    op.execute("DROP INDEX IF EXISTS uq_submission_hackathon_team")
    op.execute("DROP INDEX IF EXISTS uq_submission_hackathon_user")
