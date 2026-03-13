from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, Integer, ForeignKey


# ---------------------------------------------------------------------------
# Database model
# ---------------------------------------------------------------------------

class JudgingCriteriaBase(SQLModel):
    name: str = Field(max_length=255)
    # Weight expressed as a whole-number percentage (e.g. 30 means 30%).
    weight_percentage: int
    description: Optional[str] = None
    display_order: int = Field(default=0)


class JudgingCriteria(JudgingCriteriaBase, table=True):
    """
    One row per judging dimension within a judging_criteria section.
    The sum of weight_percentage across all rows in a section should
    typically equal 100, but this is not enforced at the DB level.
    """
    id: Optional[int] = Field(default=None, primary_key=True)

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

class JudgingCriteriaCreate(SQLModel):
    """Payload for adding a judging criterion to a section."""
    name: str
    weight_percentage: int
    description: Optional[str] = None
    display_order: int = 0


class JudgingCriteriaUpdate(SQLModel):
    """Partial-update payload for an existing judging criterion."""
    name: Optional[str] = None
    weight_percentage: Optional[int] = None
    description: Optional[str] = None
    display_order: Optional[int] = None


class JudgingCriteriaRead(JudgingCriteriaBase):
    """Response schema returned to the frontend."""
    id: int
    hackathon_id: int
    section_id: int
    created_at: datetime
    created_by: Optional[int] = None
    updated_at: datetime
    updated_by: Optional[int] = None
