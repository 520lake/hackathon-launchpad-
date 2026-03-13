from typing import Optional
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field


class HackathonStatus(str, Enum):
    """Lifecycle status of a hackathon."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    ENDED = "ended"


class RegistrationType(str, Enum):
    """Whether participants register as individuals or as teams."""
    INDIVIDUAL = "individual"
    TEAM = "team"


class HackathonFormat(str, Enum):
    """Physical format of the hackathon event."""
    ONLINE = "online"
    OFFLINE = "offline"


# ---------------------------------------------------------------------------
# Base schema – shared fields between the DB model and request/response DTOs.
# Only contains the lean core fields per the section-based architecture:
# all rich content (descriptions, awards, rules, etc.) lives in the
# `sections` table; schedule dates live in the `schedules` table.
# ---------------------------------------------------------------------------

class HackathonBase(SQLModel):
    title: str
    cover_image: Optional[str] = None

    registration_type: RegistrationType = Field(default=RegistrationType.TEAM)
    format: HackathonFormat = Field(default=HackathonFormat.ONLINE)

    # Core dates – only the overall event window.
    # Granular phase dates (registration, submission, judging) are stored
    # as schedule rows in the `schedules` table.
    start_date: datetime
    end_date: datetime

    # Structured geographic location (China province/city/district cascade).
    # All NULL means online-only; populated for offline events.
    province: Optional[str] = Field(default=None, max_length=50)
    city: Optional[str] = Field(default=None, max_length=50)
    district: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = None
    # When True, the detailed `address` text is hidden from users who
    # have not been approved for the hackathon.
    is_address_hidden: bool = Field(default=False)

    status: HackathonStatus = Field(default=HackathonStatus.DRAFT)


class Hackathon(HackathonBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Denormalized creator reference – the same user also gets an "owner"
    # row in hackathon_organizers for permission checks.
    created_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[int] = Field(default=None, foreign_key="user.id")


class HackathonCreate(SQLModel):
    """Payload for creating a new hackathon (step 1 of the wizard)."""
    title: str
    cover_image: Optional[str] = None
    registration_type: RegistrationType = RegistrationType.TEAM
    format: HackathonFormat = HackathonFormat.ONLINE
    start_date: datetime
    end_date: datetime
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    is_address_hidden: bool = False


class HackathonUpdate(SQLModel):
    """Partial-update payload – only set fields that changed."""
    title: Optional[str] = None
    cover_image: Optional[str] = None
    registration_type: Optional[RegistrationType] = None
    format: Optional[HackathonFormat] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    address: Optional[str] = None
    is_address_hidden: Optional[bool] = None
    status: Optional[HackathonStatus] = None


class HackathonRead(HackathonBase):
    """Response schema for a hackathon (without nested relations)."""
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    updated_by: Optional[int] = None
