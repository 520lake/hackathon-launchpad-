from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field

class HackathonBase(SQLModel):
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    location: Optional[str] = None
    is_online: bool = True
    max_participants: Optional[int] = None

class Hackathon(HackathonBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organizer_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class HackathonCreate(HackathonBase):
    pass

class HackathonRead(HackathonBase):
    id: int
    organizer_id: int
    created_at: datetime
