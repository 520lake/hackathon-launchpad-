from typing import Optional
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field, Column, Integer, ForeignKey, UniqueConstraint


class OrganizerRole(str, Enum):
    """
    Permission level within a hackathon's management team.
    - OWNER: full control, created the hackathon.
    - ADMIN: can edit content and manage participants (invited by owner).
    """
    OWNER = "owner"
    ADMIN = "admin"


class OrganizerStatus(str, Enum):
    """Invitation workflow status."""
    PENDING = "pending"
    ACCEPTED = "accepted"


# ---------------------------------------------------------------------------
# Database model
# ---------------------------------------------------------------------------

class HackathonOrganizerBase(SQLModel):
    role: OrganizerRole = Field(default=OrganizerRole.ADMIN)
    status: OrganizerStatus = Field(default=OrganizerStatus.PENDING)


class HackathonOrganizer(HackathonOrganizerBase, table=True):
    """
    Maps users to hackathons with a role-based permission level.
    The unique constraint on (hackathon_id, user_id) prevents duplicate
    organizer entries at the DB level.
    """
    __table_args__ = (
        UniqueConstraint("hackathon_id", "user_id", name="uq_organizer_hackathon_user"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    hackathon_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("hackathon.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    user_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )

    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: Optional[int] = Field(default=None, foreign_key="user.id")


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class HackathonOrganizerCreate(SQLModel):
    """Payload for inviting a new organizer (by email, resolved in endpoint)."""
    role: OrganizerRole = OrganizerRole.ADMIN


class HackathonOrganizerUpdate(SQLModel):
    """Partial-update payload (accept invitation or change role)."""
    role: Optional[OrganizerRole] = None
    status: Optional[OrganizerStatus] = None


class HackathonOrganizerRead(HackathonOrganizerBase):
    """Response schema returned to the frontend."""
    id: int
    hackathon_id: int
    user_id: int
    created_at: datetime
    created_by: Optional[int] = None
    updated_at: datetime
    updated_by: Optional[int] = None
