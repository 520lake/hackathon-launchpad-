"""remove_user_preferences

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-03-19 00:00:00.000000

Remove deprecated user preference fields:
- theme_preference
- interests
- notification_settings
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "i9j0k1l2m3n4"
down_revision: Union[str, None] = "h8i9j0k1l2m3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("user") as batch_op:
        batch_op.drop_column("notification_settings")
        batch_op.drop_column("interests")
        batch_op.drop_column("theme_preference")


def downgrade() -> None:
    with op.batch_alter_table("user") as batch_op:
        batch_op.add_column(
            sa.Column("theme_preference", sa.String(), nullable=False, server_default="dark")
        )
        batch_op.add_column(sa.Column("interests", sa.String(), nullable=True))
        batch_op.add_column(
            sa.Column(
                "notification_settings",
                sa.String(),
                nullable=True,
                server_default='{"activity_reminder": true, "new_hackathon_push": true, "system_announcement": true, "general_notification": true}',
            )
        )
