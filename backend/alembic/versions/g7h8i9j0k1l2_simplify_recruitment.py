"""simplify_recruitment

Revision ID: g7h8i9j0k1l2
Revises: f6a7b8c9d0e1
Create Date: 2026-03-17 00:00:01.000000

Merge recruitment into team: drop recruitment table, remove looking_for
column, add recruitment_roles/recruitment_contact/recruitment_status to team.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "g7h8i9j0k1l2"
down_revision: Union[str, None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new recruitment fields to team
    op.add_column("team", sa.Column("recruitment_roles", sa.String(), nullable=True))
    op.add_column("team", sa.Column("recruitment_contact", sa.String(), nullable=True))
    op.add_column("team", sa.Column("recruitment_status", sa.String(), nullable=False, server_default="closed"))

    # Migrate recruitment data into team.recruitment_roles as JSON
    # Build a JSON array from each team's recruitment rows
    op.execute("""
        UPDATE team SET recruitment_roles = (
            SELECT '[' || GROUP_CONCAT(
                '{"role":"' || REPLACE(r.role, '"', '\\"') ||
                '","skills":"' || REPLACE(r.skills, '"', '\\"') ||
                '","count":' || r.count ||
                ',"description":"' || COALESCE(REPLACE(r.description, '"', '\\"'), '') || '"}'
            ) || ']'
            FROM recruitment r WHERE r.team_id = team.id
        ),
        recruitment_contact = (
            SELECT r.contact_info FROM recruitment r WHERE r.team_id = team.id LIMIT 1
        ),
        recruitment_status = CASE
            WHEN EXISTS (SELECT 1 FROM recruitment r WHERE r.team_id = team.id AND LOWER(r.status) = 'open')
            THEN 'open' ELSE 'closed'
        END
        WHERE EXISTS (SELECT 1 FROM recruitment r WHERE r.team_id = team.id)
    """)

    # Drop looking_for column (SQLite requires table rebuild)
    with op.batch_alter_table("team") as batch_op:
        batch_op.drop_column("looking_for")

    # Drop recruitment table
    op.drop_table("recruitment")


def downgrade() -> None:
    # Recreate recruitment table
    op.create_table(
        "recruitment",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("team_id", sa.Integer(), sa.ForeignKey("team.id"), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("skills", sa.String(), nullable=False),
        sa.Column("count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("contact_info", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    # Re-add looking_for column
    with op.batch_alter_table("team") as batch_op:
        batch_op.add_column(sa.Column("looking_for", sa.String(), nullable=True))

    # Drop new columns
    with op.batch_alter_table("team") as batch_op:
        batch_op.drop_column("recruitment_roles")
        batch_op.drop_column("recruitment_contact")
        batch_op.drop_column("recruitment_status")
