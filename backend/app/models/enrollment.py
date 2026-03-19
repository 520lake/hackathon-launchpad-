from typing import Optional
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field
from sqlalchemy import String

class EnrollmentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    WAITLISTED = "waitlisted"

class Enrollment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    hackathon_id: int = Field(foreign_key="hackathon.id")
    status: EnrollmentStatus = Field(default=EnrollmentStatus.APPROVED, sa_type=String)
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class EnrollmentCreate(SQLModel):
    user_id: int
    hackathon_id: int

class EnrollmentRead(SQLModel):
    id: int
    user_id: int
    hackathon_id: int
    status: EnrollmentStatus
    joined_at: datetime

from .hackathon import HackathonRead
from .hackathon_host import HackathonHostRead

class HackathonReadWithHosts(HackathonRead):
    """HackathonRead + hosts list for enrollment responses."""
    hosts: list[HackathonHostRead] = []

class EnrollmentWithHackathon(EnrollmentRead):
    hackathon: HackathonReadWithHosts
