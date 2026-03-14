"""dual track architecture - submission and master project

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-03-14 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create master_project table
    op.create_table(
        'master_project',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('repo_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # 2. Create project_collaborator table
    op.create_table(
        'project_collaborator',
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('is_visible', sa.Boolean(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['project_id'], ['master_project.id']),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('project_id', 'user_id'),
    )

    # 3. Rename project table → submission
    op.rename_table('project', 'submission')

    # 4. Add new columns to submission (SQLite batch mode)
    with op.batch_alter_table('submission', schema=None) as batch_op:
        batch_op.add_column(sa.Column('hackathon_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('project_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))

    # 5. Data migration: populate hackathon_id from team.hackathon_id
    op.execute(
        "UPDATE submission SET hackathon_id = ("
        "  SELECT hackathon_id FROM team WHERE team.id = submission.team_id"
        ")"
    )

    # 6. Map old statuses: GRADING/GRADED → SUBMITTED
    op.execute(
        "UPDATE submission SET status = 'SUBMITTED' WHERE status IN ('GRADING', 'GRADED')"
    )

    # 7. Make hackathon_id non-nullable and make team_id nullable (batch recreate)
    with op.batch_alter_table('submission', schema=None) as batch_op:
        batch_op.alter_column('hackathon_id', nullable=False)
        batch_op.alter_column('team_id', nullable=True)
        batch_op.create_foreign_key('fk_submission_hackathon', 'hackathon', ['hackathon_id'], ['id'])
        batch_op.create_foreign_key('fk_submission_master_project', 'master_project', ['project_id'], ['id'])
        batch_op.create_foreign_key('fk_submission_user', 'user', ['user_id'], ['id'])

    # 8. Update score table: rename project_id → submission_id
    with op.batch_alter_table('score', schema=None) as batch_op:
        batch_op.alter_column('project_id', new_column_name='submission_id')


def downgrade() -> None:
    # Reverse score column rename
    with op.batch_alter_table('score', schema=None) as batch_op:
        batch_op.alter_column('submission_id', new_column_name='project_id')

    # Remove new columns and restore team_id as non-nullable
    with op.batch_alter_table('submission', schema=None) as batch_op:
        batch_op.alter_column('team_id', nullable=False)
        batch_op.drop_column('user_id')
        batch_op.drop_column('project_id')
        batch_op.drop_column('hackathon_id')

    # Rename back
    op.rename_table('submission', 'project')

    # Drop new tables
    op.drop_table('project_collaborator')
    op.drop_table('master_project')
