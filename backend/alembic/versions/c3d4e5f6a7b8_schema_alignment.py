"""schema_alignment

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-14 12:00:00.000000

Aligns the SQLite schema with the current SQLModel definitions:
- Normalise enum values to lowercase (status, registration_type, format)
- Apply NOT NULL constraints to required columns
- Add missing foreign-key constraints (via table rebuild)
- Replace composite section index with single-column index
- Drop orphaned user columns (title, organization)
- Backfill NULL audit timestamps on hackathonhost & hackathonorganizer
"""
from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

NOW = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")


def _col_names(conn, table: str) -> list[str]:
    return [r[1] for r in conn.execute(sa.text(f"PRAGMA table_info({table})")).fetchall()]


def _table_exists(conn, table: str) -> bool:
    row = conn.execute(
        sa.text("SELECT name FROM sqlite_master WHERE type='table' AND name=:t"),
        {"t": table},
    ).fetchone()
    return row is not None


def _rebuild(conn, table: str, create_ddl: str, columns: list[str]) -> None:
    """Generic SQLite table rebuild: create new → copy data → drop old → rename."""
    tmp = f"{table}__new"
    conn.execute(sa.text(f"DROP TABLE IF EXISTS {tmp}"))
    conn.execute(sa.text(create_ddl.replace(f"CREATE TABLE {table}", f"CREATE TABLE {tmp}")))
    cols_csv = ", ".join(f'"{c}"' for c in columns)
    conn.execute(sa.text(f'INSERT INTO {tmp} ({cols_csv}) SELECT {cols_csv} FROM "{table}"'))
    conn.execute(sa.text(f'DROP TABLE "{table}"'))
    conn.execute(sa.text(f'ALTER TABLE {tmp} RENAME TO "{table}"'))


def upgrade() -> None:
    conn = op.get_bind()

    # ------------------------------------------------------------------
    # 0. Normalise enum values to UPPERCASE (SQLAlchemy stores str Enum by
    #    Python attribute name, not .value; e.g. HackathonStatus.DRAFT → 'DRAFT')
    # ------------------------------------------------------------------
    conn.execute(sa.text("UPDATE hackathon SET status = UPPER(status) WHERE status != UPPER(status)"))
    conn.execute(sa.text("UPDATE hackathon SET registration_type = UPPER(registration_type) WHERE registration_type != UPPER(registration_type)"))
    conn.execute(sa.text("UPDATE hackathon SET format = UPPER(format) WHERE format != UPPER(format)"))
    conn.execute(sa.text("UPDATE hackathonorganizer SET role = UPPER(role) WHERE role != UPPER(role)"))
    conn.execute(sa.text("UPDATE hackathonorganizer SET status = UPPER(status) WHERE status != UPPER(status)"))

    # ------------------------------------------------------------------
    # 1. Backfill NULL audit timestamps with current UTC time
    # ------------------------------------------------------------------
    conn.execute(sa.text(f"UPDATE hackathon SET updated_at = '{NOW}' WHERE updated_at IS NULL"))
    conn.execute(sa.text(f"UPDATE hackathonhost SET created_at = '{NOW}' WHERE created_at IS NULL"))
    conn.execute(sa.text(f"UPDATE hackathonhost SET updated_at = '{NOW}' WHERE updated_at IS NULL"))
    conn.execute(sa.text(f"UPDATE hackathonorganizer SET created_at = '{NOW}' WHERE created_at IS NULL"))
    conn.execute(sa.text(f"UPDATE hackathonorganizer SET updated_at = '{NOW}' WHERE updated_at IS NULL"))

    # ------------------------------------------------------------------
    # 2. Rebuild hackathon with NOT NULL + FK constraints
    # ------------------------------------------------------------------
    hackathon_ddl = """
    CREATE TABLE hackathon (
        id          INTEGER PRIMARY KEY NOT NULL,
        title       VARCHAR NOT NULL,
        cover_image VARCHAR,
        registration_type VARCHAR(10) NOT NULL DEFAULT 'team',
        format      VARCHAR(7) NOT NULL DEFAULT 'online',
        start_date  DATETIME NOT NULL,
        end_date    DATETIME NOT NULL,
        province    VARCHAR(50),
        city        VARCHAR(50),
        district    VARCHAR(50),
        address     VARCHAR,
        is_address_hidden BOOLEAN NOT NULL DEFAULT 0,
        status      VARCHAR(9) NOT NULL DEFAULT 'draft',
        created_by  INTEGER NOT NULL REFERENCES user(id),
        created_at  DATETIME NOT NULL,
        updated_at  DATETIME NOT NULL,
        updated_by  INTEGER REFERENCES user(id)
    )
    """
    _rebuild(conn, "hackathon", hackathon_ddl, [
        "id", "title", "cover_image", "registration_type", "format",
        "start_date", "end_date", "province", "city", "district",
        "address", "is_address_hidden", "status",
        "created_by", "created_at", "updated_at", "updated_by",
    ])

    # ------------------------------------------------------------------
    # 3. Rebuild hackathonhost with CASCADE + FK + NOT NULL audit fields
    # ------------------------------------------------------------------
    hackathonhost_ddl = """
    CREATE TABLE hackathonhost (
        id            INTEGER PRIMARY KEY NOT NULL,
        hackathon_id  INTEGER NOT NULL REFERENCES hackathon(id) ON DELETE CASCADE,
        name          VARCHAR(25) NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        logo_url      VARCHAR,
        created_at    DATETIME,
        created_by    INTEGER REFERENCES user(id),
        updated_at    DATETIME,
        updated_by    INTEGER REFERENCES user(id)
    )
    """
    _rebuild(conn, "hackathonhost", hackathonhost_ddl, [
        "id", "hackathon_id", "name", "display_order", "logo_url",
        "created_at", "created_by", "updated_at", "updated_by",
    ])

    # ------------------------------------------------------------------
    # 4. Rebuild section: fix index + NOT NULL audit
    # ------------------------------------------------------------------
    section_ddl = """
    CREATE TABLE section (
        id            INTEGER PRIMARY KEY NOT NULL,
        hackathon_id  INTEGER NOT NULL REFERENCES hackathon(id) ON DELETE CASCADE,
        section_type  VARCHAR NOT NULL,
        title         VARCHAR(255),
        display_order INTEGER NOT NULL DEFAULT 0,
        content       VARCHAR,
        created_at    DATETIME NOT NULL,
        created_by    INTEGER REFERENCES user(id),
        updated_at    DATETIME NOT NULL,
        updated_by    INTEGER REFERENCES user(id)
    )
    """
    _rebuild(conn, "section", section_ddl, [
        "id", "hackathon_id", "section_type", "title", "display_order",
        "content", "created_at", "created_by", "updated_at", "updated_by",
    ])
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_section_hackathon_id ON section(hackathon_id)"))

    # ------------------------------------------------------------------
    # 5. Rebuild schedule: NOT NULL audit
    # ------------------------------------------------------------------
    schedule_ddl = """
    CREATE TABLE schedule (
        id            INTEGER PRIMARY KEY NOT NULL,
        hackathon_id  INTEGER NOT NULL REFERENCES hackathon(id) ON DELETE CASCADE,
        section_id    INTEGER NOT NULL REFERENCES section(id) ON DELETE CASCADE,
        event_name    VARCHAR(255) NOT NULL,
        start_time    DATETIME NOT NULL,
        end_time      DATETIME NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at    DATETIME NOT NULL,
        created_by    INTEGER REFERENCES user(id),
        updated_at    DATETIME NOT NULL,
        updated_by    INTEGER REFERENCES user(id)
    )
    """
    _rebuild(conn, "schedule", schedule_ddl, [
        "id", "hackathon_id", "section_id", "event_name",
        "start_time", "end_time", "display_order",
        "created_at", "created_by", "updated_at", "updated_by",
    ])
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_schedule_hackathon_id ON schedule(hackathon_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_schedule_section_id ON schedule(section_id)"))

    # ------------------------------------------------------------------
    # 6. Rebuild prize: NOT NULL audit
    # ------------------------------------------------------------------
    prize_ddl = """
    CREATE TABLE prize (
        id                INTEGER PRIMARY KEY NOT NULL,
        hackathon_id      INTEGER NOT NULL REFERENCES hackathon(id) ON DELETE CASCADE,
        section_id        INTEGER NOT NULL REFERENCES section(id) ON DELETE CASCADE,
        name              VARCHAR(255) NOT NULL,
        winning_standards VARCHAR,
        quantity          INTEGER NOT NULL DEFAULT 1,
        total_cash_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        awards_sublist    VARCHAR NOT NULL DEFAULT '[]',
        display_order     INTEGER NOT NULL DEFAULT 0,
        created_at        DATETIME NOT NULL,
        created_by        INTEGER REFERENCES user(id),
        updated_at        DATETIME NOT NULL,
        updated_by        INTEGER REFERENCES user(id)
    )
    """
    _rebuild(conn, "prize", prize_ddl, [
        "id", "hackathon_id", "section_id", "name", "winning_standards",
        "quantity", "total_cash_amount", "awards_sublist", "display_order",
        "created_at", "created_by", "updated_at", "updated_by",
    ])
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_prize_hackathon_id ON prize(hackathon_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_prize_section_id ON prize(section_id)"))

    # ------------------------------------------------------------------
    # 7. Rebuild judgingcriteria: NOT NULL audit
    # ------------------------------------------------------------------
    judgingcriteria_ddl = """
    CREATE TABLE judgingcriteria (
        id                INTEGER PRIMARY KEY NOT NULL,
        hackathon_id      INTEGER NOT NULL REFERENCES hackathon(id) ON DELETE CASCADE,
        section_id        INTEGER NOT NULL REFERENCES section(id) ON DELETE CASCADE,
        name              VARCHAR(255) NOT NULL,
        weight_percentage INTEGER NOT NULL,
        description       VARCHAR,
        display_order     INTEGER NOT NULL DEFAULT 0,
        created_at        DATETIME NOT NULL,
        created_by        INTEGER REFERENCES user(id),
        updated_at        DATETIME NOT NULL,
        updated_by        INTEGER REFERENCES user(id)
    )
    """
    _rebuild(conn, "judgingcriteria", judgingcriteria_ddl, [
        "id", "hackathon_id", "section_id", "name", "weight_percentage",
        "description", "display_order",
        "created_at", "created_by", "updated_at", "updated_by",
    ])
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_judgingcriteria_hackathon_id ON judgingcriteria(hackathon_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_judgingcriteria_section_id ON judgingcriteria(section_id)"))

    # ------------------------------------------------------------------
    # 8. Rebuild partner: NOT NULL audit
    # ------------------------------------------------------------------
    partner_ddl = """
    CREATE TABLE partner (
        id            INTEGER PRIMARY KEY NOT NULL,
        hackathon_id  INTEGER NOT NULL REFERENCES hackathon(id) ON DELETE CASCADE,
        name          VARCHAR(255) NOT NULL,
        logo_url      VARCHAR(512),
        category      VARCHAR(50) NOT NULL,
        website_url   VARCHAR(512),
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at    DATETIME NOT NULL,
        created_by    INTEGER REFERENCES user(id),
        updated_at    DATETIME NOT NULL,
        updated_by    INTEGER REFERENCES user(id)
    )
    """
    _rebuild(conn, "partner", partner_ddl, [
        "id", "hackathon_id", "name", "logo_url", "category", "website_url",
        "display_order", "created_at", "created_by", "updated_at", "updated_by",
    ])
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_partner_hackathon_id ON partner(hackathon_id)"))

    # ------------------------------------------------------------------
    # 9. Rebuild hackathonorganizer: NOT NULL audit
    # ------------------------------------------------------------------
    hackathonorganizer_ddl = """
    CREATE TABLE hackathonorganizer (
        id            INTEGER PRIMARY KEY NOT NULL,
        hackathon_id  INTEGER NOT NULL REFERENCES hackathon(id) ON DELETE CASCADE,
        user_id       INTEGER NOT NULL REFERENCES user(id) ON DELETE CASCADE,
        role          VARCHAR NOT NULL DEFAULT 'admin',
        status        VARCHAR NOT NULL DEFAULT 'pending',
        created_at    DATETIME NOT NULL,
        created_by    INTEGER REFERENCES user(id),
        updated_at    DATETIME NOT NULL,
        updated_by    INTEGER REFERENCES user(id),
        UNIQUE(hackathon_id, user_id)
    )
    """
    _rebuild(conn, "hackathonorganizer", hackathonorganizer_ddl, [
        "id", "hackathon_id", "user_id", "role", "status",
        "created_at", "created_by", "updated_at", "updated_by",
    ])
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_hackathonorganizer_hackathon_id ON hackathonorganizer(hackathon_id)"))
    conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_hackathonorganizer_user_id ON hackathonorganizer(user_id)"))

    # ------------------------------------------------------------------
    # 10. Drop orphaned user columns (title, organization)
    # ------------------------------------------------------------------
    existing_user_cols = _col_names(conn, "user")
    if "title" in existing_user_cols or "organization" in existing_user_cols:
        keep = [c for c in existing_user_cols if c not in ("title", "organization")]
        cols_csv = ", ".join(f'"{c}"' for c in keep)

        user_ddl = f"""
        CREATE TABLE user (
            email               VARCHAR,
            full_name           VARCHAR,
            is_active           BOOLEAN NOT NULL DEFAULT 1,
            is_superuser        BOOLEAN NOT NULL DEFAULT 0,
            is_virtual          BOOLEAN NOT NULL DEFAULT 0,
            can_create_hackathon BOOLEAN NOT NULL DEFAULT 0,
            theme_preference    VARCHAR NOT NULL DEFAULT 'dark',
            skills_vector       VARCHAR,
            invitation_code     VARCHAR,
            wx_openid           VARCHAR,
            wx_unionid          VARCHAR,
            wx_test_openid      VARCHAR,
            github_id           VARCHAR,
            nickname            VARCHAR,
            avatar_url          VARCHAR,
            skills              VARCHAR,
            interests           VARCHAR,
            city                VARCHAR,
            phone               VARCHAR,
            personality         VARCHAR,
            bio                 VARCHAR,
            notification_settings VARCHAR,
            show_in_community   BOOLEAN NOT NULL DEFAULT 0,
            community_bio       VARCHAR,
            community_skills    VARCHAR,
            community_title     VARCHAR,
            id                  INTEGER PRIMARY KEY NOT NULL,
            hashed_password     VARCHAR
        )
        """
        _rebuild(conn, "user", user_ddl, keep)

        conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_user_email ON user(email)"))
        conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_user_wx_openid ON user(wx_openid)"))
        conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_user_wx_test_openid ON user(wx_test_openid)"))
        conn.execute(sa.text("CREATE UNIQUE INDEX IF NOT EXISTS ix_user_github_id ON user(github_id)"))
        conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_user_invitation_code ON user(invitation_code)"))
        conn.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_user_wx_unionid ON user(wx_unionid)"))


def downgrade() -> None:
    pass
