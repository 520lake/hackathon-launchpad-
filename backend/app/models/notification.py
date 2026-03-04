from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
import json

class NotificationBase(SQLModel):
    user_id: int = Field(foreign_key="user.id", index=True)
    title: str
    content: str
    type: str = Field(default="info", index=True)  # info, success, warning, error, system
    is_read: bool = Field(default=False, index=True)
    data: Optional[str] = Field(default=None)

class Notification(NotificationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user: "User" = Relationship(back_populates="notifications")

class NotificationRead(NotificationBase):
    id: int
    created_at: datetime

class NotificationCreate(SQLModel):
    title: str
    content: str
    type: str = "info"
    data: Optional[str] = None

class NotificationCount(SQLModel):
    unread_count: int
