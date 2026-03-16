"""lowercase_enums

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-03-17 00:00:00.000000

Convert all enum columns from UPPERCASE (SQLAlchemy .name storage) to
lowercase (matching Python enum .value). After this migration, models
use sa_type=String so SQLAlchemy stores .value directly.
"""
from typing import Sequence, Union
from alembic import op

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # hackathon: status, registration_type, format
    op.execute("UPDATE hackathon SET status = LOWER(status) WHERE status != LOWER(status)")
    op.execute("UPDATE hackathon SET registration_type = LOWER(registration_type) WHERE registration_type != LOWER(registration_type)")
    op.execute("UPDATE hackathon SET format = LOWER(format) WHERE format != LOWER(format)")

    # submission: status
    op.execute("UPDATE submission SET status = LOWER(status) WHERE status != LOWER(status)")

    # enrollment: status
    op.execute("UPDATE enrollment SET status = LOWER(status) WHERE status != LOWER(status)")

    # hackathonorganizer: role, status
    op.execute("UPDATE hackathonorganizer SET role = LOWER(role) WHERE role != LOWER(role)")
    op.execute("UPDATE hackathonorganizer SET status = LOWER(status) WHERE status != LOWER(status)")

    # section: section_type  (JUDGING_CRITERIA → judging_criteria)
    op.execute("UPDATE section SET section_type = LOWER(section_type) WHERE section_type != LOWER(section_type)")


def downgrade() -> None:
    op.execute("UPDATE hackathon SET status = UPPER(status)")
    op.execute("UPDATE hackathon SET registration_type = UPPER(registration_type)")
    op.execute("UPDATE hackathon SET format = UPPER(format)")
    op.execute("UPDATE submission SET status = UPPER(status)")
    op.execute("UPDATE enrollment SET status = UPPER(status)")
    op.execute("UPDATE hackathonorganizer SET role = UPPER(role)")
    op.execute("UPDATE hackathonorganizer SET status = UPPER(status)")
    op.execute("UPDATE section SET section_type = UPPER(section_type)")
