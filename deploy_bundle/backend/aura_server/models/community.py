from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from aura_server.models.user import User

class CommunityPostBase(SQLModel):
    title: str
    content: str
    type: str = Field(default="discussion") # discussion, question, sharing, resource
    hackathon_id: int = Field(foreign_key="hackathon.id")

class CommunityPost(CommunityPostBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    likes: int = Field(default=0)
    views: int = Field(default=0)
    
    # Relationships
    author: Optional[User] = Relationship()

class CommunityPostCreate(CommunityPostBase):
    pass

class CommunityPostRead(CommunityPostBase):
    id: int
    author_id: int
    created_at: datetime
    likes: int
    views: int
    author: Optional[User] = None

class CommunityCommentBase(SQLModel):
    content: str
    post_id: int = Field(foreign_key="communitypost.id")

class CommunityComment(CommunityCommentBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    author_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    author: Optional[User] = Relationship()

class CommunityCommentCreate(CommunityCommentBase):
    pass

class CommunityCommentRead(CommunityCommentBase):
    id: int
    author_id: int
    created_at: datetime
    author: Optional[User] = None
