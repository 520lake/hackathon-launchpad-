"""hackathon_architecture_refactor

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-13 12:00:00.000000

Major refactor: slim hackathon table, add sections-based block system,
dedicated schedule/prize/judging_criteria tables, partner table,
hackathon_organizer RBAC table.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------
    # 1. Alter hackathon table: add new columns
    # ------------------------------------------------------------------
    op.add_column('hackathon', sa.Column('province', sa.String(length=50), nullable=True))
    op.add_column('hackathon', sa.Column('city', sa.String(length=50), nullable=True))
    op.add_column('hackathon', sa.Column('district', sa.String(length=50), nullable=True))
    op.add_column('hackathon', sa.Column('address', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('is_address_hidden', sa.Boolean(), nullable=False, server_default='0'))
    op.add_column('hackathon', sa.Column('created_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True))
    op.add_column('hackathon', sa.Column('updated_at', sa.DateTime(), nullable=True))
    op.add_column('hackathon', sa.Column('updated_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True))

    # Migrate organizer_id data to created_by before dropping
    op.execute("UPDATE hackathon SET created_by = organizer_id WHERE organizer_id IS NOT NULL")

    # ------------------------------------------------------------------
    # 2. Alter hackathon table: drop removed columns
    # ------------------------------------------------------------------
    columns_to_drop = [
        'subtitle', 'description', 'theme_tags', 'professionalism_tags',
        'organizer_name', 'contact_info',
        'registration_start_date', 'registration_end_date',
        'submission_start_date', 'submission_end_date',
        'judging_start_date', 'judging_end_date',
        'awards_detail', 'rules_detail', 'requirements',
        'resource_detail', 'scoring_dimensions',
        'sponsors_detail', 'results_detail',
        'is_online', 'max_participants', 'location',
        'organizer_id',
    ]
    for col in columns_to_drop:
        op.drop_column('hackathon', col)

    # ------------------------------------------------------------------
    # 3. Alter hackathonhost table: rename logo -> logo_url, add audit cols
    # ------------------------------------------------------------------
    op.alter_column('hackathonhost', 'logo', new_column_name='logo_url')
    op.add_column('hackathonhost', sa.Column('created_at', sa.DateTime(), nullable=True))
    op.add_column('hackathonhost', sa.Column('created_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True))
    op.add_column('hackathonhost', sa.Column('updated_at', sa.DateTime(), nullable=True))
    op.add_column('hackathonhost', sa.Column('updated_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True))

    # ------------------------------------------------------------------
    # 4. Create section table
    # ------------------------------------------------------------------
    op.create_table(
        'section',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('hackathon_id', sa.Integer(), sa.ForeignKey('hackathon.id', ondelete='CASCADE'), nullable=False),
        sa.Column('section_type', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('updated_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
    )
    op.create_index('ix_section_hackathon_order', 'section', ['hackathon_id', 'display_order'])

    # ------------------------------------------------------------------
    # 5. Create schedule table
    # ------------------------------------------------------------------
    op.create_table(
        'schedule',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('hackathon_id', sa.Integer(), sa.ForeignKey('hackathon.id', ondelete='CASCADE'), nullable=False),
        sa.Column('section_id', sa.Integer(), sa.ForeignKey('section.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_name', sa.String(length=255), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('updated_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
    )
    op.create_index('ix_schedule_hackathon_id', 'schedule', ['hackathon_id'])
    op.create_index('ix_schedule_section_id', 'schedule', ['section_id'])

    # ------------------------------------------------------------------
    # 6. Create prize table
    # ------------------------------------------------------------------
    op.create_table(
        'prize',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('hackathon_id', sa.Integer(), sa.ForeignKey('hackathon.id', ondelete='CASCADE'), nullable=False),
        sa.Column('section_id', sa.Integer(), sa.ForeignKey('section.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('winning_standards', sa.Text(), nullable=True),
        sa.Column('quantity', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('total_cash_amount', sa.Numeric(precision=10, scale=2), nullable=False, server_default='0.00'),
        sa.Column('awards_sublist', sa.Text(), nullable=False, server_default='[]'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('updated_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
    )
    op.create_index('ix_prize_hackathon_id', 'prize', ['hackathon_id'])
    op.create_index('ix_prize_section_id', 'prize', ['section_id'])

    # ------------------------------------------------------------------
    # 7. Create judgingcriteria table
    # ------------------------------------------------------------------
    op.create_table(
        'judgingcriteria',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('hackathon_id', sa.Integer(), sa.ForeignKey('hackathon.id', ondelete='CASCADE'), nullable=False),
        sa.Column('section_id', sa.Integer(), sa.ForeignKey('section.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('weight_percentage', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('updated_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
    )
    op.create_index('ix_judgingcriteria_hackathon_id', 'judgingcriteria', ['hackathon_id'])
    op.create_index('ix_judgingcriteria_section_id', 'judgingcriteria', ['section_id'])

    # ------------------------------------------------------------------
    # 8. Create partner table
    # ------------------------------------------------------------------
    op.create_table(
        'partner',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('hackathon_id', sa.Integer(), sa.ForeignKey('hackathon.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('logo_url', sa.String(length=512), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('website_url', sa.String(length=512), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('updated_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
    )
    op.create_index('ix_partner_hackathon_id', 'partner', ['hackathon_id'])

    # ------------------------------------------------------------------
    # 9. Create hackathonorganizer table
    # ------------------------------------------------------------------
    op.create_table(
        'hackathonorganizer',
        sa.Column('id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('hackathon_id', sa.Integer(), sa.ForeignKey('hackathon.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('user.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='admin'),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('updated_by', sa.Integer(), sa.ForeignKey('user.id'), nullable=True),
    )
    op.create_index('ix_hackathonorganizer_hackathon_id', 'hackathonorganizer', ['hackathon_id'])
    op.create_index('ix_hackathonorganizer_user_id', 'hackathonorganizer', ['user_id'])
    op.create_unique_constraint('uq_organizer_hackathon_user', 'hackathonorganizer', ['hackathon_id', 'user_id'])

    # Migrate existing organizer_id data: create owner rows for all hackathons
    op.execute(
        "INSERT INTO hackathonorganizer (hackathon_id, user_id, role, status) "
        "SELECT id, created_by, 'owner', 'accepted' FROM hackathon "
        "WHERE created_by IS NOT NULL"
    )


def downgrade() -> None:
    # Drop new tables in reverse dependency order
    op.drop_table('hackathonorganizer')
    op.drop_table('partner')
    op.drop_table('judgingcriteria')
    op.drop_table('prize')
    op.drop_table('schedule')
    op.drop_table('section')

    # Restore hackathonhost columns
    op.drop_column('hackathonhost', 'updated_by')
    op.drop_column('hackathonhost', 'updated_at')
    op.drop_column('hackathonhost', 'created_by')
    op.drop_column('hackathonhost', 'created_at')
    op.alter_column('hackathonhost', 'logo_url', new_column_name='logo')

    # Restore hackathon columns (add back removed columns)
    op.add_column('hackathon', sa.Column('organizer_id', sa.Integer(), nullable=True))
    op.execute("UPDATE hackathon SET organizer_id = created_by WHERE created_by IS NOT NULL")

    op.add_column('hackathon', sa.Column('subtitle', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('theme_tags', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('professionalism_tags', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('organizer_name', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('contact_info', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('registration_start_date', sa.DateTime(), nullable=True))
    op.add_column('hackathon', sa.Column('registration_end_date', sa.DateTime(), nullable=True))
    op.add_column('hackathon', sa.Column('submission_start_date', sa.DateTime(), nullable=True))
    op.add_column('hackathon', sa.Column('submission_end_date', sa.DateTime(), nullable=True))
    op.add_column('hackathon', sa.Column('judging_start_date', sa.DateTime(), nullable=True))
    op.add_column('hackathon', sa.Column('judging_end_date', sa.DateTime(), nullable=True))
    op.add_column('hackathon', sa.Column('awards_detail', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('rules_detail', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('requirements', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('resource_detail', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('scoring_dimensions', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('sponsors_detail', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('results_detail', sa.Text(), nullable=True))
    op.add_column('hackathon', sa.Column('is_online', sa.Boolean(), nullable=True, server_default='1'))
    op.add_column('hackathon', sa.Column('max_participants', sa.Integer(), nullable=True))
    op.add_column('hackathon', sa.Column('location', sa.Text(), nullable=True))

    # Drop new hackathon columns
    op.drop_column('hackathon', 'updated_by')
    op.drop_column('hackathon', 'updated_at')
    op.drop_column('hackathon', 'created_by')
    op.drop_column('hackathon', 'is_address_hidden')
    op.drop_column('hackathon', 'address')
    op.drop_column('hackathon', 'district')
    op.drop_column('hackathon', 'city')
    op.drop_column('hackathon', 'province')
