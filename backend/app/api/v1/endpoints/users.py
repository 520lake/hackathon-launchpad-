from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from app.api import deps
from app.core.security import get_password_hash, verify_password
from app.db.session import get_session
from app.models.user import User, UserCreate, UserRead, UserUpdate, UserUpdateAdmin, InvitationCode
from pydantic import BaseModel

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

from pydantic import BaseModel

class ActivateOrganizerRequest(BaseModel):
    code: str

@router.post("/activate-organizer", response_model=UserRead)
def activate_organizer(
    *,
    session: Session = Depends(get_session),
    req: ActivateOrganizerRequest,
    current_user: User = Depends(deps.get_current_user),
):
    if current_user.can_create_hackathon:
        return current_user
    
    invitation = session.exec(
        select(InvitationCode).where(InvitationCode.code == req.code)
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid invitation code")
    
    if invitation.is_used:
        raise HTTPException(status_code=400, detail="Invitation code already used")
    
    if invitation.expires_at and invitation.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invitation code expired")
    
    invitation.is_used = True
    invitation.used_by_user_id = current_user.id
    
    current_user.can_create_hackathon = True
    
    session.add(invitation)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return current_user

@router.get("/invitation-codes", response_model=List[dict])
def get_invitation_codes(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    codes = session.exec(select(InvitationCode).order_by(InvitationCode.created_at.desc())).all()
    return [code.model_dump() for code in codes]

@router.post("/generate-invite-code", response_model=dict)
def generate_invite_code(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_active_superuser),
):
    import secrets
    code = secrets.token_hex(4).upper()
    invitation = InvitationCode(code=code)
    session.add(invitation)
    session.commit()
    session.refresh(invitation)
    return {"code": code, "id": invitation.id}

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/me/change-password")
def change_password(
    *,
    session: Session = Depends(get_session),
    req: ChangePasswordRequest,
    current_user: User = Depends(deps.get_current_user),
):
    if not current_user.hashed_password:
        raise HTTPException(status_code=400, detail="User has no password set")
    
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    current_user.hashed_password = get_password_hash(req.new_password)
    session.add(current_user)
    session.commit()
    return {"message": "Password changed successfully"}

class UpdatePreferencesRequest(BaseModel):
    notification_settings: dict

@router.patch("/me/preferences")
def update_preferences(
    *,
    session: Session = Depends(get_session),
    req: UpdatePreferencesRequest,
    current_user: User = Depends(deps.get_current_user),
):
    if req.notification_settings:
        import json
        current_user.notification_settings = json.dumps(req.notification_settings)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return {"message": "Preferences updated successfully"}

@router.delete("/me")
def delete_user_me(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
):
    session.delete(current_user)
    session.commit()
    return {"message": "User deleted successfully"}

@router.post("/me/deactivate")
def deactivate_user_me(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Deactivate the current user account.
    Sets is_active to False, user can reactivate by logging in again.
    """
    current_user.is_active = False
    session.add(current_user)
    session.commit()
    return {"message": "Account deactivated successfully. You can reactivate by logging in again."}

