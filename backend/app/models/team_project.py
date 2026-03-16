from typing import Optional, List
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import String
from app.models.user import User, UserRead


class TeamBase(SQLModel):
    name: str
    description: Optional[str] = None
    looking_for: Optional[str] = None

class Team(TeamBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hackathon_id: int = Field(foreign_key="hackathon.id")
    leader_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    members: List["TeamMember"] = Relationship(back_populates="team")
    submissions: List["Submission"] = Relationship(back_populates="team")
    recruitments: List["Recruitment"] = Relationship(back_populates="team")

class TeamMember(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id")
    user_id: int = Field(foreign_key="user.id")
    joined_at: datetime = Field(default_factory=datetime.utcnow)

    team: Optional[Team] = Relationship(back_populates="members")
    user: Optional[User] = Relationship()

class TeamMemberRead(SQLModel):
    id: int
    team_id: int
    user_id: int
    joined_at: datetime

class TeamMemberReadWithUser(TeamMemberRead):
    user: Optional[UserRead] = None

class TeamCreate(TeamBase):
    pass

class TeamRead(TeamBase):
    id: int
    hackathon_id: int
    leader_id: int
    created_at: datetime

class TeamReadWithMembers(TeamRead):
    members: List[TeamMemberReadWithUser] = []
    recruitments: List["RecruitmentRead"] = []


class SubmissionStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"

class SubmissionBase(SQLModel):
    title: str
    description: str
    tech_stack: Optional[str] = None
    cover_image: Optional[str] = None
    demo_url: Optional[str] = None
    repo_url: Optional[str] = None
    video_url: Optional[str] = None
    attachment_url: Optional[str] = None

class Submission(SubmissionBase, table=True):
    __tablename__ = "submission"
    id: Optional[int] = Field(default=None, primary_key=True)
    hackathon_id: int = Field(foreign_key="hackathon.id")
    team_id: Optional[int] = Field(default=None, foreign_key="team.id")
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    project_id: Optional[int] = Field(default=None, foreign_key="master_project.id")
    status: SubmissionStatus = Field(default=SubmissionStatus.DRAFT, sa_type=String)
    total_score: Optional[float] = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    team: Optional[Team] = Relationship(back_populates="submissions")

class SubmissionCreate(SubmissionBase):
    pass

class SubmissionRead(SubmissionBase):
    id: int
    hackathon_id: int
    team_id: Optional[int]
    user_id: Optional[int]
    project_id: Optional[int]
    status: SubmissionStatus
    total_score: Optional[float]
    created_at: datetime

class SubmissionReadWithTeam(SubmissionRead):
    team: Optional[TeamRead] = None

# Keep backward-compat aliases for imports that haven't migrated
ProjectStatus = SubmissionStatus
ProjectBase = SubmissionBase
Project = Submission
ProjectCreate = SubmissionCreate
ProjectRead = SubmissionRead
ProjectReadWithTeam = SubmissionReadWithTeam


# Recruitment Models
class RecruitmentBase(SQLModel):
    role: str
    skills: str
    count: int = 1
    description: Optional[str] = None
    contact_info: Optional[str] = None
    status: str = "open"

class Recruitment(RecruitmentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    team: Optional[Team] = Relationship(back_populates="recruitments")

class RecruitmentCreate(RecruitmentBase):
    pass

class RecruitmentRead(RecruitmentBase):
    id: int
    team_id: int
    created_at: datetime

class TeamReadWithSubmissions(TeamRead):
    submissions: List[SubmissionRead] = []

# Backward-compat alias
TeamReadWithProjects = TeamReadWithSubmissions

class RecruitmentReadWithTeam(RecruitmentRead):
    team: Optional[TeamReadWithSubmissions] = None
