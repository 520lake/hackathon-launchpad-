from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.db.session import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.hackathon import Hackathon
from app.models.team_project import Team, TeamCreate, TeamRead, TeamMember, TeamMemberRead, TeamReadWithMembers
from app.models.user import User

router = APIRouter()

@router.post("", response_model=TeamRead)
def create_team(*, session: Session = Depends(get_session), team_in: TeamCreate, hackathon_id: int, current_user: User = Depends(get_current_user)):
    """
    Create a team for a hackathon.
    """
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
        
    team_data = team_in.dict()
    team = Team(**team_data, hackathon_id=hackathon_id, leader_id=current_user.id)
    session.add(team)
    session.commit()
    session.refresh(team)
    
    # Add leader as member
    member = TeamMember(team_id=team.id, user_id=current_user.id)
    session.add(member)
    session.commit()
    
    return team

@router.get("/me", response_model=List[TeamReadWithMembers])
def read_my_teams(*, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """
    Get teams that the current user is a member of.
    """
    query = select(Team).join(TeamMember, Team.id == TeamMember.team_id).where(TeamMember.user_id == current_user.id)
    teams = session.exec(query).all()
    return teams

@router.get("", response_model=List[TeamReadWithMembers])
def read_teams(*, session: Session = Depends(get_session), hackathon_id: int = None, offset: int = 0, limit: int = 100):
    query = select(Team)
    if hackathon_id:
        query = query.where(Team.hackathon_id == hackathon_id)
    teams = session.exec(query.offset(offset).limit(limit)).all()
    return teams

@router.get("/{team_id}", response_model=TeamReadWithMembers)
def read_team(*, session: Session = Depends(get_session), team_id: int):
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("/{team_id}/join", response_model=TeamMemberRead)
def join_team(*, session: Session = Depends(get_session), team_id: int, current_user: User = Depends(get_current_user)):
    """
    Join a team.
    """
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    # Check if already a member
    existing = session.exec(select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == current_user.id)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already a member of this team")
        
    member = TeamMember(team_id=team_id, user_id=current_user.id)
    session.add(member)
    session.commit()
    session.refresh(member)
    return member

@router.delete("/{team_id}/leave", response_model=TeamMemberRead)
def leave_team(*, session: Session = Depends(get_session), team_id: int, current_user: User = Depends(get_current_user)):
    """
    Leave a team.
    """
    member = session.exec(select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == current_user.id)).first()
    if not member:
        raise HTTPException(status_code=404, detail="You are not a member of this team")
        
    session.delete(member)
    session.commit()
    return member

@router.get("/{team_id}/members", response_model=List[TeamMemberRead])
def read_team_members(*, session: Session = Depends(get_session), team_id: int):
    members = session.exec(select(TeamMember).where(TeamMember.team_id == team_id)).all()
    return members
