from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship

class DiscussionBase(SQLModel):
    title: str
    content: str
    tags: Optional[str] = None  # JSON string of tags
    views: int = Field(default=0)
    is_pinned: bool = Field(default=False)
    is_announcement: bool = Field(default=False)

class Discussion(DiscussionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    author: Optional["User"] = Relationship(back_populates="discussions")
    replies: List["DiscussionReply"] = Relationship(back_populates="discussion")

class DiscussionReply(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    discussion_id: int = Field(foreign_key="discussion.id")
    author_id: int = Field(foreign_key="user.id")
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    discussion: Optional["Discussion"] = Relationship(back_populates="replies")
    author: Optional["User"] = Relationship()

class DiscussionCreate(SQLModel):
    title: str
    content: str
    tags: Optional[List[str]] = None

class DiscussionUpdate(SQLModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None

class DiscussionRead(DiscussionBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
    author_name: Optional[str] = None
    author_avatar: Optional[str] = None
    replies_count: int = 0

class DiscussionReplyCreate(SQLModel):
    content: str

class DiscussionReplyRead(SQLModel):
    id: int
    discussion_id: int
    author_id: int
    content: str
    created_at: datetime
    author_name: Optional[str] = None
    author_avatar: Optional[str] = None
