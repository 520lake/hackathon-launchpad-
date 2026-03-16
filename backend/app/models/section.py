from typing import Optional
from datetime import datetime
from enum import Enum
from sqlmodel import SQLModel, Field, Column, Integer, ForeignKey
from sqlalchemy import String


class SectionType(str, Enum):
    """
    Determines how a section's data is stored and rendered:
      - MARKDOWN: rich text stored directly in `content` (JSON string).
      - SCHEDULES / PRIZES / JUDGING_CRITERIA: `content` is NULL or
        holds basic config; actual data lives in the dedicated child table.
    """
    MARKDOWN = "markdown"
    SCHEDULES = "schedules"
    PRIZES = "prizes"
    JUDGING_CRITERIA = "judging_criteria"


# ---------------------------------------------------------------------------
# Database model
# ---------------------------------------------------------------------------

class SectionBase(SQLModel):
    section_type: SectionType = Field(sa_type=String)
    title: Optional[str] = Field(default=None, max_length=255)
    display_order: int = Field(default=0)
    # For MARKDOWN sections this holds the rich text (JSON string).
    # For relational section types this is NULL or basic config.
    content: Optional[str] = None


class Section(SectionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hackathon_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("hackathon.id", ondelete="CASCADE"),
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

class SectionCreate(SQLModel):
    """Payload for adding a new section to a hackathon."""
    section_type: SectionType
    title: Optional[str] = None
    display_order: int = 0
    content: Optional[str] = None


class SectionUpdate(SQLModel):
    """Partial-update payload for an existing section."""
    title: Optional[str] = None
    display_order: Optional[int] = None
    content: Optional[str] = None


class SectionRead(SectionBase):
    """Response schema returned to the frontend."""
    id: int
    hackathon_id: int
    created_at: datetime
    created_by: Optional[int] = None
    updated_at: datetime
    updated_by: Optional[int] = None
