from typing import Optional, List
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship
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
    projects: List["Project"] = Relationship(back_populates="team")

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

class ProjectStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    GRADING = "grading"
    GRADED = "graded"

class ProjectBase(SQLModel):
    title: str
    description: str
    cover_image: Optional[str] = None
    demo_url: Optional[str] = None
    repo_url: Optional[str] = None
    video_url: Optional[str] = None
    attachment_url: Optional[str] = None

class Project(ProjectBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id")
    status: ProjectStatus = Field(default=ProjectStatus.SUBMITTED)
    total_score: Optional[float] = Field(default=0.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    team: Optional[Team] = Relationship(back_populates="projects")

class ProjectCreate(ProjectBase):
    pass

class ProjectRead(ProjectBase):
    id: int
    team_id: int
    status: ProjectStatus
    total_score: Optional[float]
    created_at: datetime

class ProjectReadWithTeam(ProjectRead):
    team: Optional[TeamRead] = None
