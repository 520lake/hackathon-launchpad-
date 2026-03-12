from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from aura_server.api import deps
from aura_server.core.security import get_password_hash
from aura_server.db.session import get_session
from aura_server.models.user import User, UserCreate, UserRead, UserUpdate, UserUpdateAdmin

router = APIRouter()

@router.put("/me", response_model=UserRead)
def update_user_me(
    *,
    session: Session = Depends(get_session),
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_user),
):
    user_data = user_in.dict(exclude_unset=True)
    for key, value in user_data.items():
        setattr(current_user, key, value)
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

@router.get("/me", response_model=UserRead)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
):
    return current_user

@router.post("/me/verify", response_model=UserRead)
def verify_user_me(
    session: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
):
    current_user.is_verified = True
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

@router.post("", response_model=UserRead)
def create_user(*, session: Session = Depends(get_session), user_in: UserCreate):
    db_user = session.exec(select(User).where(User.email == user_in.email)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = get_password_hash(user_in.password)
    user_data = user_in.dict(exclude={"password"})
    db_user = User(**user_data, hashed_password=hashed_password)
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.get("", response_model=List[UserRead])
def read_users(*, session: Session = Depends(get_session), offset: int = 0, limit: int = 100, current_user: User = Depends(deps.get_current_active_superuser)):
    users = session.exec(select(User).offset(offset).limit(limit)).all()
    return users

@router.put("/{user_id}", response_model=UserRead)
def update_user(
    *,
    session: Session = Depends(get_session),
    user_id: int,
    user_in: UserUpdateAdmin,
    current_user: User = Depends(deps.get_current_user),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="The user doesn't have enough privileges")
    
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = user_in.dict(exclude_unset=True)
    for key, value in user_data.items():
        setattr(user, key, value)
    
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

