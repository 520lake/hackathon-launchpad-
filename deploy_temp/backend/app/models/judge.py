from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class Judge(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    hackathon_id: int = Field(foreign_key="hackathon.id")
    appointed_at: datetime = Field(default_factory=datetime.utcnow)

class JudgeCreate(SQLModel):
    user_id: int
    hackathon_id: int

class JudgeRead(SQLModel):
    id: int
    user_id: int
    hackathon_id: int
    appointed_at: datetime
