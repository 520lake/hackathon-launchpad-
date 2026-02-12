from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from aura_server.db.session import get_session
from aura_server.api.deps import get_current_user
from aura_server.models.user import User
from aura_server.models.hackathon import Hackathon
from aura_server.models.enrollment import Enrollment, EnrollmentCreate, EnrollmentRead, EnrollmentStatus, EnrollmentWithHackathon

from aura_server.models.team_project import Team, TeamMember

router = APIRouter()

@router.post("/", response_model=EnrollmentRead)
def create_enrollment(*, session: Session = Depends(get_session), enrollment_in: EnrollmentCreate, current_user: User = Depends(get_current_user)):
    """
    User enrolls in a hackathon.
    """
    # Check if hackathon exists
    hackathon = session.get(Hackathon, enrollment_in.hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
        
    # Check if already enrolled
    existing = session.exec(select(Enrollment).where(
        Enrollment.hackathon_id == enrollment_in.hackathon_id,
        Enrollment.user_id == current_user.id
    )).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")
        
    enrollment = Enrollment(
        user_id=current_user.id,
        hackathon_id=enrollment_in.hackathon_id,
        status=EnrollmentStatus.PENDING # Default pending, can be auto-approved based on hackathon settings
    )
    session.add(enrollment)
    session.commit()
    session.refresh(enrollment)
    return enrollment

@router.delete("/{hackathon_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_enrollment(*, session: Session = Depends(get_session), hackathon_id: int, current_user: User = Depends(get_current_user)):
    """
    Cancel enrollment for a hackathon.
    """
    enrollment = session.exec(select(Enrollment).where(
        Enrollment.hackathon_id == hackathon_id,
        Enrollment.user_id == current_user.id
    )).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
        
    session.delete(enrollment)
    session.commit()
    return None

@router.get("/me", response_model=List[EnrollmentWithHackathon])
def read_my_enrollments(*, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """
    Get current user's enrollments with hackathon details.
    """
    # Self-Repair: Check for missing enrollments from Team Membership
    # Find all hackathons where user is a team member
    team_memberships = session.exec(
        select(TeamMember, Team)
        .join(Team, TeamMember.team_id == Team.id)
        .where(TeamMember.user_id == current_user.id)
    ).all()
    
    for member, team in team_memberships:
        # Check if enrollment exists
        exists = session.exec(select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.hackathon_id == team.hackathon_id
        )).first()
        
        if not exists:
            # Create missing enrollment
            new_enrollment = Enrollment(
                user_id=current_user.id,
                hackathon_id=team.hackathon_id,
                status=EnrollmentStatus.APPROVED # Team members are approved
            )
            session.add(new_enrollment)
            session.commit()
    
    results = session.exec(
        select(Enrollment, Hackathon)
        .join(Hackathon, Enrollment.hackathon_id == Hackathon.id)
        .where(Enrollment.user_id == current_user.id)
    ).all()
    
    enrollments_with_hackathon = []
    for enrollment, hackathon in results:
        # Pydantic v2 validates immediately, so we must provide hackathon during initialization
        data = enrollment.model_dump()
        data["hackathon"] = hackathon
        enrollment_with_hackathon = EnrollmentWithHackathon.model_validate(data)
        enrollments_with_hackathon.append(enrollment_with_hackathon)
        
    return enrollments_with_hackathon

@router.get("/{hackathon_id}", response_model=List[EnrollmentRead])
def read_hackathon_enrollments(*, session: Session = Depends(get_session), hackathon_id: int, current_user: User = Depends(get_current_user)):
    """
    Get enrollments for a hackathon (Organizer only).
    """
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    enrollments = session.exec(select(Enrollment).where(Enrollment.hackathon_id == hackathon_id)).all()
    return enrollments

@router.patch("/{enrollment_id}/status", response_model=EnrollmentRead)
def update_enrollment_status(*, session: Session = Depends(get_session), enrollment_id: int, status: EnrollmentStatus, current_user: User = Depends(get_current_user)):
    """
    Organizer approves/rejects enrollment.
    """
    enrollment = session.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
        
    hackathon = session.get(Hackathon, enrollment.hackathon_id)
    if hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    enrollment.status = status
    session.add(enrollment)
    session.commit()
    session.refresh(enrollment)
    return enrollment

from pydantic import BaseModel
from typing import Optional
import json

class ParticipantRead(BaseModel):
    user_id: int
    nickname: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    skills: Optional[List[str]]
    enrollment_status: str

@router.get("/public/{hackathon_id}", response_model=List[ParticipantRead])
def read_public_participants(
    *, 
    session: Session = Depends(get_session), 
    hackathon_id: int
):
    """
    Get public list of participants for a hackathon.
    """
    results = session.exec(
        select(Enrollment, User)
        .join(User, Enrollment.user_id == User.id)
        .where(Enrollment.hackathon_id == hackathon_id)
    ).all()
    
    participants = []
    for enrollment, user in results:
        skills_list = []
        if user.skills:
            try:
                # Try JSON first
                parsed = json.loads(user.skills)
                if isinstance(parsed, list):
                    skills_list = parsed
                else:
                    skills_list = [str(parsed)]
            except:
                # Fallback to comma-separated
                skills_list = [s.strip() for s in user.skills.split(',') if s.strip()]

        participants.append({
            "user_id": user.id,
            "nickname": user.nickname or user.full_name,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "skills": skills_list,
            "enrollment_status": enrollment.status
        })
    return participants
