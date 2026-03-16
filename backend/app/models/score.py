from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, UniqueConstraint


class Score(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("judge_id", "submission_id", "criteria_id", name="uq_score_judge_sub_criteria"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    judge_id: int = Field(foreign_key="user.id")
    submission_id: int = Field(foreign_key="submission.id")
    criteria_id: int = Field(foreign_key="judgingcriteria.id")
    score_value: int = Field(ge=0, le=100)
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CriteriaScoreSummary(SQLModel, table=True):
    """Pre-computed average score per criterion per submission."""
    __tablename__ = "criteriascoresummary"
    __table_args__ = (
        UniqueConstraint("submission_id", "criteria_id", name="uq_criteria_summary"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    submission_id: int = Field(foreign_key="submission.id")
    criteria_id: int = Field(foreign_key="judgingcriteria.id")
    avg_score: float = Field(default=0.0)


class CriteriaScore(SQLModel):
    """One score per criterion, sent by the judge."""
    criteria_id: int
    score_value: int = Field(ge=0, le=100)
    comment: Optional[str] = None


class ScoreCreate(SQLModel):
    """Payload: array of per-criterion scores."""
    scores: list[CriteriaScore]


class ScoreRead(SQLModel):
    id: int
    judge_id: int
    submission_id: int
    criteria_id: int
    score_value: int
    comment: Optional[str]
    created_at: datetime


class CriteriaScoreSummaryRead(SQLModel):
    submission_id: int
    criteria_id: int
    avg_score: float
