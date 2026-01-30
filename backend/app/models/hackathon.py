from typing import Optional, List
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field

class HackathonStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    ENDED = "ended"

class HackathonBase(SQLModel):
    title: str
    description: str
    cover_image: Optional[str] = None
    theme_tags: Optional[str] = None
    professionalism_tags: Optional[str] = None
    start_date: datetime
    end_date: datetime
    registration_start_date: Optional[datetime] = None
    registration_end_date: Optional[datetime] = None
    submission_start_date: Optional[datetime] = None
    submission_end_date: Optional[datetime] = None
    judging_start_date: Optional[datetime] = None
    judging_end_date: Optional[datetime] = None
    awards_detail: Optional[str] = None
    rules_detail: Optional[str] = None
    scoring_dimensions: Optional[str] = None
    results_detail: Optional[str] = None  # JSON string for winners/results
    location: Optional[str] = None
    is_online: bool = True
    max_participants: Optional[int] = None
    status: HackathonStatus = Field(default=HackathonStatus.DRAFT)

class Hackathon(HackathonBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organizer_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class HackathonCreate(HackathonBase):
    pass

class HackathonUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    theme_tags: Optional[str] = None
    professionalism_tags: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_start_date: Optional[datetime] = None
    registration_end_date: Optional[datetime] = None
    submission_start_date: Optional[datetime] = None
    submission_end_date: Optional[datetime] = None
    judging_start_date: Optional[datetime] = None
    judging_end_date: Optional[datetime] = None
    awards_detail: Optional[str] = None
    rules_detail: Optional[str] = None
    scoring_dimensions: Optional[str] = None
    status: Optional[HackathonStatus] = None
    # Add other fields as needed

class HackathonRead(HackathonBase):
    id: int
    organizer_id: int
    created_at: datetime
