from typing import Optional, List
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field

class HackathonStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    ENDED = "ended"

class RegistrationType(str, Enum):
    INDIVIDUAL = "individual"
    TEAM = "team"

class HackathonFormat(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"

class HackathonBase(SQLModel):
    title: str
    subtitle: Optional[str] = None
    description: str
    cover_image: Optional[str] = None
    theme_tags: Optional[str] = None
    professionalism_tags: Optional[str] = None
    
    # Registration & Format
    registration_type: RegistrationType = Field(default=RegistrationType.TEAM)
    format: HackathonFormat = Field(default=HackathonFormat.ONLINE)
    location: Optional[str] = None
    
    # Organizer Info
    organizer_name: Optional[str] = None
    contact_info: Optional[str] = None # JSON string for contact details
    
    # Time Schedule
    start_date: datetime
    end_date: datetime
    registration_start_date: Optional[datetime] = None
    registration_end_date: Optional[datetime] = None
    submission_start_date: Optional[datetime] = None
    submission_end_date: Optional[datetime] = None
    judging_start_date: Optional[datetime] = None
    judging_end_date: Optional[datetime] = None
    
    # Details
    awards_detail: Optional[str] = None # JSON string for awards
    rules_detail: Optional[str] = None
    requirements: Optional[str] = None # Work requirements
    resource_detail: Optional[str] = None # Resources and support
    scoring_dimensions: Optional[str] = None # JSON string for scoring
    results_detail: Optional[str] = None  # JSON string for winners/results
    
    is_online: bool = True # Keep for backward compatibility, sync with format
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
    subtitle: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    theme_tags: Optional[str] = None
    professionalism_tags: Optional[str] = None
    registration_type: Optional[RegistrationType] = None
    format: Optional[HackathonFormat] = None
    location: Optional[str] = None
    organizer_name: Optional[str] = None
    contact_info: Optional[str] = None
    requirements: Optional[str] = None
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
    resource_detail: Optional[str] = None
    status: Optional[HackathonStatus] = None
    is_online: Optional[bool] = None

class HackathonRead(HackathonBase):
    id: int
    organizer_id: int
    created_at: datetime
