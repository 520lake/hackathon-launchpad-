from typing import Optional, List
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship

class TeamBase(SQLModel):
    name: str
    description: Optional[str] = None
    looking_for: Optional[str] = None

class Team(TeamBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hackathon_id: int = Field(foreign_key="hackathon.id")
    leader_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TeamMember(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id")
    user_id: int = Field(foreign_key="user.id")
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class TeamMemberRead(SQLModel):
    id: int
    team_id: int
    user_id: int
    joined_at: datetime

class TeamCreate(TeamBase):
    pass

class TeamRead(TeamBase):
    id: int
    hackathon_id: int
    leader_id: int
    created_at: datetime

class ProjectStatus(str, Enum):
    SUBMITTED = "submitted"
    GRADING = "grading"
    GRADED = "graded"

class ProjectBase(SQLModel):
    title: str
    description: str
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

class ProjectCreate(ProjectBase):
    pass

class ProjectRead(ProjectBase):
    id: int
    team_id: int
    status: ProjectStatus
    total_score: Optional[float]
    created_at: datetime
