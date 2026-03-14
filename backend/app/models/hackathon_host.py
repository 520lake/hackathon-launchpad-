from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, Integer, ForeignKey


# ---------------------------------------------------------------------------
# Database model
# ---------------------------------------------------------------------------

class HackathonHostBase(SQLModel):
    """
    Shared fields for a hackathon host (organizer / co-organizer).
    Each hackathon can have multiple hosts displayed in a user-defined order.
    """
    name: str = Field(max_length=25)
    display_order: int = Field(default=0)
    logo_url: Optional[str] = None


class HackathonHost(HackathonHostBase, table=True):
    """Database table: one row per host per hackathon."""
    id: Optional[int] = Field(default=None, primary_key=True)
    hackathon_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("hackathon.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )

    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    created_by: Optional[int] = Field(default=None, foreign_key="user.id")
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_by: Optional[int] = Field(default=None, foreign_key="user.id")


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class HackathonHostCreate(SQLModel):
    """Payload for adding a new host to a hackathon."""
    name: str = Field(max_length=25)
    logo_url: Optional[str] = None


class HackathonHostRead(HackathonHostBase):
    """Response schema returned to the frontend."""
    id: int
    hackathon_id: int
    created_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_at: Optional[datetime] = None
    updated_by: Optional[int] = None


class HackathonHostUpdate(SQLModel):
    """Partial-update payload for an existing host."""
    name: Optional[str] = Field(default=None, max_length=25)
    display_order: Optional[int] = None
    logo_url: Optional[str] = None
