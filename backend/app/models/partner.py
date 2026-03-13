from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, Integer, ForeignKey


# ---------------------------------------------------------------------------
# Database model
# ---------------------------------------------------------------------------

class PartnerBase(SQLModel):
    """
    Partners / sponsors for a hackathon, displayed in a user-defined order.
    Each partner belongs to a `category` (e.g. "协办方", "金牌赞助商")
    so the frontend can group them visually.
    """
    name: str = Field(max_length=255)
    logo_url: Optional[str] = None
    category: str = Field(max_length=50)
    website_url: Optional[str] = Field(default=None, max_length=512)
    display_order: int = Field(default=0)


class Partner(PartnerBase, table=True):
    """Database table: one row per partner per hackathon."""
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

class PartnerCreate(SQLModel):
    """Payload for adding a new partner to a hackathon."""
    name: str
    logo_url: Optional[str] = None
    category: str
    website_url: Optional[str] = None


class PartnerUpdate(SQLModel):
    """Partial-update payload for an existing partner."""
    name: Optional[str] = None
    logo_url: Optional[str] = None
    category: Optional[str] = None
    website_url: Optional[str] = None
    display_order: Optional[int] = None


class PartnerRead(PartnerBase):
    """Response schema returned to the frontend."""
    id: int
    hackathon_id: int
    created_at: datetime
    created_by: Optional[int] = None
    updated_at: datetime
    updated_by: Optional[int] = None
