from typing import Optional, List
from datetime import datetime
from pydantic import EmailStr
from sqlmodel import SQLModel, Field, Relationship

class UserBase(SQLModel):
    email: Optional[EmailStr] = Field(unique=True, index=True)
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    is_verified: bool = False  # Real-name verification status
    
    # WeChat fields
    wx_openid: Optional[str] = Field(default=None, unique=True, index=True)
    wx_unionid: Optional[str] = Field(default=None, index=True)
    wx_test_openid: Optional[str] = Field(default=None, unique=True, index=True)
    
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # AI Matching fields
    skills: Optional[str] = None # JSON string or comma-separated
    interests: Optional[str] = None # JSON string or comma-separated
    city: Optional[str] = None # Province + City
    phone: Optional[str] = None
    personality: Optional[str] = None # MBTI or description
    bio: Optional[str] = None # Self-intro

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: Optional[str] = None # Password optional for WeChat login

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

