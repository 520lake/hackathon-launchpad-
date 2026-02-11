from typing import Optional, List
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship
from aura_server.models.user import User

class RecruitmentStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"

class RecruitmentBase(SQLModel):
    team_id: int = Field(foreign_key="team.id")
    role: str  # e.g., Frontend, Backend, Designer
    skills: str  # JSON string or comma-separated
    count: int = 1
    description: Optional[str] = None
    contact_info: Optional[str] = None
    status: RecruitmentStatus = Field(default=RecruitmentStatus.OPEN)

class Recruitment(RecruitmentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    team: Optional["Team"] = Relationship(back_populates="recruitments")

class RecruitmentCreate(RecruitmentBase):
    pass

class RecruitmentRead(RecruitmentBase):
    id: int
    created_at: datetime
