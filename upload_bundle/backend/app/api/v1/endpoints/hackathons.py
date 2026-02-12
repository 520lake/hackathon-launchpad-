from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from app.models.hackathon import Hackathon, HackathonCreate, HackathonRead, HackathonUpdate, HackathonStatus, HackathonFormat
from app.db.session import get_session
from app.api.deps import get_current_user
from app.models.user import User, UserRead
from app.models.judge import Judge, JudgeCreate, JudgeRead
from app.models.enrollment import Enrollment
from app.models.team_project import Team, TeamMember, Project
from app.models.score import Score

router = APIRouter()

@router.post("", response_model=HackathonRead)
def create_hackathon(*, session: Session = Depends(get_session), hackathon: HackathonCreate, current_user: User = Depends(get_current_user)):
    try:
        hackathon_data = hackathon.dict()
        db_hackathon = Hackathon(**hackathon_data, organizer_id=current_user.id)
        session.add(db_hackathon)
        session.commit()
        session.refresh(db_hackathon)
        return db_hackathon
    except Exception as e:
        print(f"Error creating hackathon: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[HackathonRead])
def read_hackathons(
    *,
    session: Session = Depends(get_session),
    offset: int = 0,
    limit: int = 100,
    status: Optional[HackathonStatus] = None,
    format: Optional[HackathonFormat] = None,
    location: Optional[str] = None,
    search: Optional[str] = None
):
    query = select(Hackathon)
    
    if status:
        query = query.where(Hackathon.status == status)
    if format:
        query = query.where(Hackathon.format == format)
    if location:
        query = query.where(Hackathon.location.contains(location))
    if search:
        query = query.where(
            (Hackathon.title.contains(search)) | 
            (Hackathon.description.contains(search))
        )
        
    # Default sort by created_at desc
    query = query.order_by(Hackathon.created_at.desc())
    
    hackathons = session.exec(query.offset(offset).limit(limit)).all()
    return hackathons

@router.get("/my", response_model=List[HackathonRead])
def read_my_hackathons(*, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """
    Get hackathons created by current user.
    """
    hackathons = session.exec(select(Hackathon).where(Hackathon.organizer_id == current_user.id)).all()
    return hackathons

@router.get("/{hackathon_id}", response_model=HackathonRead)
def read_hackathon(*, session: Session = Depends(get_session), hackathon_id: int):
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return hackathon

@router.get("/{hackathon_id}/status")
def get_hackathon_status(*, session: Session = Depends(get_session), hackathon_id: int):
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
        
    now = datetime.now()
    
    status_label = "unknown"
    
    reg_start = hackathon.registration_start_date
    reg_end = hackathon.registration_end_date
    act_start = hackathon.start_date
    act_end = hackathon.end_date
    
    # Logic from user:
    # IF now < registration_start: 状态 = '报名未开始'
    if reg_start and now < reg_start:
        status_label = "报名未开始"
    # ELIF registration_start <= now < registration_end: 状态 = '报名进行中'
    elif reg_start and reg_end and reg_start <= now < reg_end:
        status_label = "报名进行中"
    # ELIF now >= registration_end: 状态 = '报名已截止'（含子状态）
    elif reg_end and now >= reg_end:
        if now < act_start:
            status_label = "等待活动开始"
        elif now >= act_start and now < act_end:
            status_label = "活动进行中"
        else:
            status_label = "活动已结束"
            
    return {
        "status": status_label,
        "hackathon_status": hackathon.status, # DB status
        "time_status": {
            "registration_open": reg_start <= now < reg_end if reg_start and reg_end else False,
            "activity_ongoing": act_start <= now < act_end,
            "ended": now >= act_end
        }
    }

@router.patch("/{hackathon_id}", response_model=HackathonRead)
def update_hackathon(*, session: Session = Depends(get_session), hackathon_id: int, hackathon_in: HackathonUpdate, current_user: User = Depends(get_current_user)):
    db_hackathon = session.get(Hackathon, hackathon_id)
    if not db_hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if db_hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    hackathon_data = hackathon_in.dict(exclude_unset=True)
    for key, value in hackathon_data.items():
        setattr(db_hackathon, key, value)
        
    session.add(db_hackathon)
    session.commit()
    session.refresh(db_hackathon)
    return db_hackathon

@router.delete("/{hackathon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hackathon(*, session: Session = Depends(get_session), hackathon_id: int, current_user: User = Depends(get_current_user)):
    db_hackathon = session.get(Hackathon, hackathon_id)
    if not db_hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if db_hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    # Cascade delete manually
    # 1. Delete Scores (linked to Projects)
    # Find all teams -> projects -> scores
    teams = session.exec(select(Team).where(Team.hackathon_id == hackathon_id)).all()
    team_ids = [t.id for t in teams]
    if team_ids:
        projects = session.exec(select(Project).where(Project.team_id.in_(team_ids))).all()
        project_ids = [p.id for p in projects]
        
        if project_ids:
            # Delete Scores
            scores = session.exec(select(Score).where(Score.project_id.in_(project_ids))).all()
            for s in scores:
                session.delete(s)
            
            # Delete Projects
            for p in projects:
                session.delete(p)
        
        # Delete Team Members
        members = session.exec(select(TeamMember).where(TeamMember.team_id.in_(team_ids))).all()
        for m in members:
            session.delete(m)
            
        # Delete Teams
        for t in teams:
            session.delete(t)
            
    # 2. Delete Enrollments
    enrollments = session.exec(select(Enrollment).where(Enrollment.hackathon_id == hackathon_id)).all()
    for e in enrollments:
        session.delete(e)
        
    # 3. Delete Judges
    judges = session.exec(select(Judge).where(Judge.hackathon_id == hackathon_id)).all()
    for j in judges:
        session.delete(j)
        
    # 4. Delete Hackathon
    session.delete(db_hackathon)
    session.commit()
    return None

# Judges Management
@router.post("/{hackathon_id}/judges", response_model=JudgeRead)
def add_judge(*, session: Session = Depends(get_session), hackathon_id: int, user_email: str, current_user: User = Depends(get_current_user)):
    """
    Appoint a judge by email.
    """
    db_hackathon = session.get(Hackathon, hackathon_id)
    if not db_hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if db_hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    # Verify user exists
    user = session.exec(select(User).where(User.email == user_email)).first()
    if not user:
         raise HTTPException(status_code=404, detail="User with this email not found")
         
    # Check if already judge
    existing_judge = session.exec(select(Judge).where(Judge.hackathon_id == hackathon_id, Judge.user_id == user.id)).first()
    if existing_judge:
        raise HTTPException(status_code=400, detail="User is already a judge")
        
    judge = Judge(user_id=user.id, hackathon_id=hackathon_id)
    session.add(judge)
    session.commit()
    session.refresh(judge)
    return judge

@router.get("/{hackathon_id}/judges", response_model=List[UserRead])
def read_judges(*, session: Session = Depends(get_session), hackathon_id: int):
    # Join Judge and User to return full user details
    query = select(User).join(Judge, User.id == Judge.user_id).where(Judge.hackathon_id == hackathon_id)
    judges = session.exec(query).all()
    return judges
