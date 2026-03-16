from sqlmodel import create_engine, SQLModel, Session
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=True)

def init_db():
    # Import all models so SQLModel registers them in metadata
    from app.models.user import User  # noqa: F401
    from app.models.hackathon import Hackathon  # noqa: F401
    from app.models.team_project import Team, Submission, TeamMember  # noqa: F401
    from app.models.project import MasterProject, ProjectCollaborator  # noqa: F401
    from app.models.enrollment import Enrollment  # noqa: F401
    from app.models.judge import Judge  # noqa: F401
    from app.models.score import Score, CriteriaScoreSummary  # noqa: F401
    from app.models.community import CommunityPost, CommunityComment  # noqa: F401
    from app.models.hackathon_host import HackathonHost  # noqa: F401
    from app.models.section import Section  # noqa: F401
    from app.models.schedule import Schedule  # noqa: F401
    from app.models.prize import Prize  # noqa: F401
    from app.models.judging_criteria import JudgingCriteria  # noqa: F401
    from app.models.partner import Partner  # noqa: F401
    from app.models.hackathon_organizer import HackathonOrganizer  # noqa: F401
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
