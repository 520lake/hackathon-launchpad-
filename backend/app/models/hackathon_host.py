from typing import Optional
from sqlmodel import SQLModel, Field


class HackathonHostBase(SQLModel):
    """
    Shared fields for a hackathon host (organizer / co-organizer).
    Each hackathon can have multiple hosts displayed in a user-defined order.
    """
    name: str = Field(max_length=25)
    display_order: int = Field(default=0)
    # Path to the uploaded logo image, e.g. "/static/uuid.png"
    logo: Optional[str] = None


class HackathonHost(HackathonHostBase, table=True):
    """Database table: one row per host per hackathon."""
    id: Optional[int] = Field(default=None, primary_key=True)
    hackathon_id: int = Field(foreign_key="hackathon.id", index=True)


class HackathonHostCreate(SQLModel):
    """Payload for adding a new host to a hackathon."""
    name: str = Field(max_length=25)
    logo: Optional[str] = None


class HackathonHostRead(HackathonHostBase):
    """Response schema returned to the frontend."""
    id: int
    hackathon_id: int


class HackathonHostUpdate(SQLModel):
    """Partial-update payload for an existing host."""
    name: Optional[str] = Field(default=None, max_length=25)
    display_order: Optional[int] = None
    logo: Optional[str] = None
