from typing import Optional
from datetime import datetime
from decimal import Decimal
from sqlmodel import SQLModel, Field, Column, Integer, ForeignKey


# ---------------------------------------------------------------------------
# Database model
# ---------------------------------------------------------------------------

class PrizeBase(SQLModel):
    name: str = Field(max_length=255)
    # Description of what it takes to win this prize.
    winning_standards: Optional[str] = None
    # How many winners can receive this prize (e.g. 3 for "三等奖").
    quantity: int = Field(default=1)
    # Backend-computed cache of total cash value for quick stats display.
    total_cash_amount: Decimal = Field(default=Decimal("0.00"))
    # Detailed breakdown of sub-awards (cash + non-cash items) stored as
    # a JSON array string, e.g. [{"type":"cash","amount":5000}, ...].
    awards_sublist: str = Field(default="[]")
    display_order: int = Field(default=0)


class Prize(PrizeBase, table=True):
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

class PrizeCreate(SQLModel):
    """Payload for adding a prize to a section."""
    name: str
    winning_standards: Optional[str] = None
    quantity: int = 1
    total_cash_amount: Decimal = Decimal("0.00")
    awards_sublist: str = "[]"
    display_order: int = 0


class PrizeUpdate(SQLModel):
    """Partial-update payload for an existing prize."""
    name: Optional[str] = None
    winning_standards: Optional[str] = None
    quantity: Optional[int] = None
    total_cash_amount: Optional[Decimal] = None
    awards_sublist: Optional[str] = None
    display_order: Optional[int] = None


class PrizeRead(PrizeBase):
    """Response schema returned to the frontend."""
    id: int
    hackathon_id: int
    section_id: int
    created_at: datetime
    created_by: Optional[int] = None
    updated_at: datetime
    updated_by: Optional[int] = None
