from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, Integer, ForeignKey


# ---------------------------------------------------------------------------
# Database model
# ---------------------------------------------------------------------------

class ScheduleBase(SQLModel):
    event_name: str = Field(max_length=255)
    start_time: datetime
    end_time: datetime
    display_order: int = Field(default=0)


class Schedule(ScheduleBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Redundant hackathon FK enables cross-section global queries without
    # joining through the sections table.
    hackathon_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("hackathon.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
    )
    section_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("section.id", ondelete="CASCADE"),
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

class ScheduleCreate(SQLModel):
    """Payload for adding a schedule entry to a section."""
    event_name: str
    start_time: datetime
    end_time: datetime
    display_order: int = 0


class ScheduleUpdate(SQLModel):
    """Partial-update payload for an existing schedule entry."""
    event_name: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    display_order: Optional[int] = None


class ScheduleRead(ScheduleBase):
    """Response schema returned to the frontend."""
    id: int
    hackathon_id: int
    section_id: int
    created_at: datetime
    created_by: Optional[int] = None
    updated_at: datetime
    updated_by: Optional[int] = None
