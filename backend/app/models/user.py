from typing import Optional, List
from datetime import datetime
from pydantic import EmailStr
from sqlmodel import SQLModel, Field, Relationship

class UserBase(SQLModel):
    email: Optional[EmailStr] = Field(unique=True, index=True)
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    is_virtual: bool = Field(default=False)  # 标记虚拟用户
    
    # New Fields for the platform
    can_create_hackathon: bool = Field(default=False)  # Organizer permission
    skills_vector: Optional[str] = None  # For AI matching (stored as text for now)
    invitation_code: Optional[str] = Field(default=None, index=True)  # 邀请码
    
    # WeChat fields
    wx_openid: Optional[str] = Field(default=None, unique=True, index=True)
    wx_unionid: Optional[str] = Field(default=None, index=True)
    wx_test_openid: Optional[str] = Field(default=None, unique=True, index=True)
    
    # GitHub fields
    github_id: Optional[str] = Field(default=None, unique=True, index=True)
    
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # AI Matching fields
    skills: Optional[str] = None
    interests: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    personality: Optional[str] = None
    bio: Optional[str] = None
    
    # Community Hall settings
    show_in_community: bool = Field(default=False)  # 是否展现在社区大厅
    community_bio: Optional[str] = None  # 社区大厅独立简介
    community_skills: Optional[str] = None  # 社区大厅独立技能展示
    community_title: Optional[str] = None  # 社区大厅头衔/称号

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: Optional[str] = None # Password optional for WeChat login
    notifications: List["Notification"] = Relationship(back_populates="user")
    discussions: List["Discussion"] = Relationship(back_populates="author")

class UserCreate(UserBase):
    password: Optional[str] = None

class UserUpdate(SQLModel):
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    skills: Optional[str] = None
    interests: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    personality: Optional[str] = None
    bio: Optional[str] = None
    can_create_hackathon: Optional[bool] = None
    skills_vector: Optional[str] = None
    invitation_code: Optional[str] = None
    # Community Hall settings
    show_in_community: Optional[bool] = None
    community_bio: Optional[str] = None
    community_skills: Optional[str] = None
    community_title: Optional[str] = None

class UserUpdateAdmin(UserUpdate):
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None
    is_verified: Optional[bool] = None

class UserRead(UserBase):
    id: int

class VerificationCode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True)
    code: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_used: bool = Field(default=False)

class InvitationCode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True)
    is_used: bool = Field(default=False)
    used_by_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
