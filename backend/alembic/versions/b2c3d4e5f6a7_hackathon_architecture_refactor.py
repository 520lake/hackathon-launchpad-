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


def _column_exists(table, column):
    """Helper to check if a column already exists in a SQLite table."""
    from alembic import op as _op
    conn = _op.get_bind()
    result = conn.execute(sa.text(f"PRAGMA table_info({table})"))
    return column in [row[1] for row in result]


def _table_exists(table):
    """Helper to check if a table already exists in a SQLite database."""
    from alembic import op as _op
    conn = _op.get_bind()
    result = conn.execute(
        sa.text("SELECT name FROM sqlite_master WHERE type='table' AND name=:t"),
        {"t": table}
    )
    return result.fetchone() is not None


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 1. Alter hackathon table: add new columns (skip if already present
    #    from a partial prior run; use plain Integer instead of ForeignKey
    #    so SQLite's ALTER TABLE doesn't choke on constraint creation)
    # ------------------------------------------------------------------
    new_hackathon_cols = [
        ('province', sa.String(length=50), True, None),
        ('city', sa.String(length=50), True, None),
        ('district', sa.String(length=50), True, None),
        ('address', sa.Text(), True, None),
        ('is_address_hidden', sa.Boolean(), False, '0'),
        ('created_by', sa.Integer(), True, None),
        ('updated_at', sa.DateTime(), True, None),
        ('updated_by', sa.Integer(), True, None),
    ]
    for col_name, col_type, nullable, default in new_hackathon_cols:
        if not _column_exists('hackathon', col_name):
            kw = {}
            if default is not None:
                kw['server_default'] = default
            op.add_column('hackathon', sa.Column(col_name, col_type, nullable=nullable, **kw))

    # Migrate organizer_id data to created_by before dropping
    conn.execute(sa.text(
        "UPDATE hackathon SET created_by = organizer_id "
        "WHERE organizer_id IS NOT NULL AND created_by IS NULL"
    ))

    # ------------------------------------------------------------------
    # 2. Alter hackathon table: drop removed columns via copy-and-move
    #    (raw DROP COLUMN can't remove FK-constrained cols in SQLite,
    #    so we rebuild the table keeping only the desired columns)
    # ------------------------------------------------------------------
    keep_cols = [
        'id', 'title', 'cover_image', 'registration_type', 'format',
        'start_date', 'end_date', 'status', 'created_at',
        'province', 'city', 'district', 'address', 'is_address_hidden',
        'created_by', 'updated_at', 'updated_by',
    ]
    existing = [r[1] for r in conn.execute(sa.text("PRAGMA table_info(hackathon)")).fetchall()]
    cols_to_copy = [c for c in keep_cols if c in existing]
    cols_csv = ', '.join(f'"{c}"' for c in cols_to_copy)

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
    needs_rebuild = any(_column_exists('hackathon', c) for c in columns_to_drop)
    if needs_rebuild:
        conn.execute(sa.text(
            f"CREATE TABLE hackathon_new ("
            f"  id INTEGER PRIMARY KEY NOT NULL,"
            f"  title VARCHAR, cover_image VARCHAR,"
            f"  registration_type VARCHAR(10), format VARCHAR(7),"
            f"  start_date DATETIME, end_date DATETIME,"
            f"  status VARCHAR(9), created_at DATETIME,"
            f"  province VARCHAR(50), city VARCHAR(50),"
            f"  district VARCHAR(50), address TEXT,"
            f"  is_address_hidden BOOLEAN NOT NULL DEFAULT 0,"
            f"  created_by INTEGER, updated_at DATETIME,"
            f"  updated_by INTEGER"
            f")"
        ))
        conn.execute(sa.text(f"INSERT INTO hackathon_new ({cols_csv}) SELECT {cols_csv} FROM hackathon"))
        conn.execute(sa.text("DROP TABLE hackathon"))
        conn.execute(sa.text("ALTER TABLE hackathon_new RENAME TO hackathon"))

    # ------------------------------------------------------------------
    # 3. Alter hackathonhost table: rename logo -> logo_url, add audit cols
    # ------------------------------------------------------------------
    if _column_exists('hackathonhost', 'logo'):
        conn.execute(sa.text('ALTER TABLE hackathonhost RENAME COLUMN "logo" TO "logo_url"'))
    for col_name, col_type in [
        ('created_at', sa.DateTime()),
        ('created_by', sa.Integer()),
        ('updated_at', sa.DateTime()),
        ('updated_by', sa.Integer()),
    ]:
        if not _column_exists('hackathonhost', col_name):
            op.add_column('hackathonhost', sa.Column(col_name, col_type, nullable=True))

    # ------------------------------------------------------------------
    # 4. Create section table
    # ------------------------------------------------------------------
    if not _table_exists('section'):
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
    if not _table_exists('schedule'):
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
    if not _table_exists('prize'):
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
    if not _table_exists('judgingcriteria'):
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
    if not _table_exists('partner'):
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
    # 9. Create hackathonorganizer table (unique constraint is declared
    #    inline via UniqueConstraint so SQLite doesn't need ALTER TABLE)
    # ------------------------------------------------------------------
    if not _table_exists('hackathonorganizer'):
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
            sa.UniqueConstraint('hackathon_id', 'user_id', name='uq_organizer_hackathon_user'),
        )
        op.create_index('ix_hackathonorganizer_hackathon_id', 'hackathonorganizer', ['hackathon_id'])
        op.create_index('ix_hackathonorganizer_user_id', 'hackathonorganizer', ['user_id'])

    # Migrate existing organizer_id data: create owner rows for all hackathons
    count = conn.execute(sa.text("SELECT COUNT(*) FROM hackathonorganizer")).scalar()
    if count == 0:
        conn.execute(sa.text(
            "INSERT INTO hackathonorganizer (hackathon_id, user_id, role, status) "
            "SELECT id, created_by, 'owner', 'accepted' FROM hackathon "
            "WHERE created_by IS NOT NULL"
        ))


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
