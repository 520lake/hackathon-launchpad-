"""
Core test fixtures: in-memory SQLite DB, FastAPI test client, user factories.

Design decisions:
  - StaticPool keeps one in-memory DB shared across all connections in a test.
  - Each test gets a nested transaction that is rolled back after the test,
    so tables are created once and every test starts with a clean slate.
  - Auth uses real JWT tokens (no mocking) so the full deps.py path is tested.
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, Session
from fastapi.testclient import TestClient

from app.db.session import get_session
from app.core.security import create_access_token, get_password_hash
from app.models.user import User
from app.models.hackathon import Hackathon, HackathonStatus, HackathonFormat, RegistrationType
from app.models.hackathon_organizer import HackathonOrganizer, OrganizerRole, OrganizerStatus
from app.models.section import Section, SectionType
from app.models.judging_criteria import JudgingCriteria


# ---------------------------------------------------------------------------
# Engine & table setup (once per session)
# ---------------------------------------------------------------------------

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(scope="session", autouse=True)
def _register_models():
    """Import all models once so SQLModel.metadata knows about them."""
    # Patch the production engine so that startup_event's init_db() uses our
    # in-memory engine instead of trying to open the real SQLite file.
    import app.db.session as session_mod
    session_mod.engine = engine

    from app.models.user import User  # noqa
    from app.models.hackathon import Hackathon  # noqa
    from app.models.team_project import Team, Submission, TeamMember  # noqa
    from app.models.project import MasterProject, ProjectCollaborator  # noqa
    from app.models.enrollment import Enrollment  # noqa
    from app.models.judge import Judge  # noqa
    from app.models.score import Score, CriteriaScoreSummary  # noqa
    from app.models.community import CommunityPost, CommunityComment  # noqa
    from app.models.hackathon_host import HackathonHost  # noqa
    from app.models.section import Section  # noqa
    from app.models.schedule import Schedule  # noqa
    from app.models.prize import Prize  # noqa
    from app.models.judging_criteria import JudgingCriteria  # noqa
    from app.models.partner import Partner  # noqa
    from app.models.hackathon_organizer import HackathonOrganizer  # noqa


@pytest.fixture(autouse=True)
def _reset_tables():
    """Drop and recreate all tables before each test for full isolation."""
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)


# ---------------------------------------------------------------------------
# Per-test session with transaction rollback isolation
# ---------------------------------------------------------------------------

@pytest.fixture()
def session():
    """Yield a plain Session bound to the in-memory engine."""
    with Session(engine) as sess:
        yield sess


# ---------------------------------------------------------------------------
# FastAPI TestClient
# ---------------------------------------------------------------------------

@pytest.fixture()
def client(session: Session):
    """TestClient that injects the test session into every endpoint."""
    from app.main import app

    def _override_get_session():
        yield session

    app.dependency_overrides[get_session] = _override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Auth helper
# ---------------------------------------------------------------------------

def auth_headers(user: User) -> dict:
    """Return Authorization header dict with a real JWT for the given user."""
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# User factories
# ---------------------------------------------------------------------------

@pytest.fixture()
def normal_user(session: Session) -> User:
    user = User(
        email="normal@test.com",
        full_name="Normal User",
        hashed_password=get_password_hash("testpass123"),
        is_active=True,
        is_superuser=False,
        can_create_hackathon=False,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture()
def organizer_user(session: Session) -> User:
    user = User(
        email="organizer@test.com",
        full_name="Organizer User",
        hashed_password=get_password_hash("testpass123"),
        is_active=True,
        is_superuser=False,
        can_create_hackathon=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture()
def superuser(session: Session) -> User:
    user = User(
        email="admin@test.com",
        full_name="Super Admin",
        hashed_password=get_password_hash("testpass123"),
        is_active=True,
        is_superuser=True,
        can_create_hackathon=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# ---------------------------------------------------------------------------
# Hackathon fixture (reused by team, submission, and hackathon tests)
# ---------------------------------------------------------------------------

@pytest.fixture()
def hackathon(session: Session, organizer_user: User) -> Hackathon:
    """Create a published hackathon with the organizer as owner."""
    now = datetime.utcnow()
    h = Hackathon(
        title="Test Hackathon",
        description="A test hackathon",
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=30),
        status=HackathonStatus.PUBLISHED,
        registration_type=RegistrationType.TEAM,
        format=HackathonFormat.ONLINE,
        created_by=organizer_user.id,
        created_at=now,
        updated_at=now,
    )
    session.add(h)
    session.commit()
    session.refresh(h)

    # Add organizer as owner
    org = HackathonOrganizer(
        hackathon_id=h.id,
        user_id=organizer_user.id,
        role=OrganizerRole.OWNER,
        status=OrganizerStatus.ACCEPTED,
        created_at=now,
        created_by=organizer_user.id,
        updated_at=now,
    )
    session.add(org)
    session.commit()
    return h


@pytest.fixture()
def hackathon_with_criteria(session: Session, hackathon: Hackathon, organizer_user: User):
    """Hackathon + a judging criteria section with two criteria (60/40 split)."""
    now = datetime.utcnow()
    section = Section(
        hackathon_id=hackathon.id,
        section_type=SectionType.JUDGING_CRITERIA,
        title="Judging",
        display_order=0,
        created_at=now,
        created_by=organizer_user.id,
        updated_at=now,
    )
    session.add(section)
    session.commit()
    session.refresh(section)

    c1 = JudgingCriteria(
        hackathon_id=hackathon.id,
        section_id=section.id,
        name="Innovation",
        weight_percentage=60,
        display_order=0,
        created_at=now,
        created_by=organizer_user.id,
        updated_at=now,
    )
    c2 = JudgingCriteria(
        hackathon_id=hackathon.id,
        section_id=section.id,
        name="Execution",
        weight_percentage=40,
        display_order=1,
        created_at=now,
        created_by=organizer_user.id,
        updated_at=now,
    )
    session.add_all([c1, c2])
    session.commit()
    session.refresh(c1)
    session.refresh(c2)
    return hackathon, [c1, c2]
