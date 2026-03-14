from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class Score(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    judge_id: int = Field(foreign_key="user.id")
    submission_id: int = Field(foreign_key="submission.id")
    score_value: int = Field(ge=0, le=100)
    details: Optional[str] = None
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ScoreCreate(SQLModel):
    score_value: int
    details: Optional[str] = None
    comment: Optional[str] = None

class ScoreRead(SQLModel):
    id: int
    judge_id: int
    submission_id: int
    score_value: int
    details: Optional[str]
    comment: Optional[str]
    created_at: datetime
