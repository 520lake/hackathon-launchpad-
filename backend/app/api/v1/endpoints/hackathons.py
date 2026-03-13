from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime
from app.models.hackathon import Hackathon, HackathonCreate, HackathonRead, HackathonUpdate, HackathonStatus, HackathonFormat
from app.models.hackathon_host import HackathonHost, HackathonHostCreate, HackathonHostRead, HackathonHostUpdate
from app.db.session import get_session
from app.api.deps import get_current_user, get_current_organizer
from app.models.user import User, UserRead
from app.models.judge import Judge, JudgeCreate, JudgeRead
from app.models.enrollment import Enrollment
from app.models.team_project import Team, TeamMember, Project
from app.models.score import Score

router = APIRouter()


# ---------------------------------------------------------------------------
# Helper: attach hosts array to a hackathon dict so every GET response
# includes hosts sorted by display_order.
# ---------------------------------------------------------------------------

def _hackathon_with_hosts(session: Session, hackathon: Hackathon) -> dict:
    """Convert a Hackathon ORM object to a dict that includes its hosts."""
    hosts = session.exec(
        select(HackathonHost)
        .where(HackathonHost.hackathon_id == hackathon.id)
        .order_by(HackathonHost.display_order)
    ).all()
    data = hackathon.dict()
    data["hosts"] = [HackathonHostRead.from_orm(h).dict() for h in hosts]
    return data


def _hackathons_with_hosts(session: Session, hackathons: list) -> list:
    """Batch-attach hosts for a list of hackathons."""
    if not hackathons:
        return []
    ids = [h.id for h in hackathons]
    all_hosts = session.exec(
        select(HackathonHost)
        .where(HackathonHost.hackathon_id.in_(ids))
        .order_by(HackathonHost.display_order)
    ).all()
    # Group hosts by hackathon_id
    hosts_map: dict[int, list] = {}
    for host in all_hosts:
        hosts_map.setdefault(host.hackathon_id, []).append(
            HackathonHostRead.from_orm(host).dict()
        )
    results = []
    for h in hackathons:
        data = h.dict()
        data["hosts"] = hosts_map.get(h.id, [])
        results.append(data)
    return results


# ---------------------------------------------------------------------------
# Hackathon CRUD
# ---------------------------------------------------------------------------

@router.post("")
def create_hackathon(*, session: Session = Depends(get_session), hackathon: HackathonCreate, current_user: User = Depends(get_current_organizer)):
    try:
        hackathon_data = hackathon.dict()
        db_hackathon = Hackathon(**hackathon_data, organizer_id=current_user.id)
        session.add(db_hackathon)
        session.commit()
        session.refresh(db_hackathon)
        return _hackathon_with_hosts(session, db_hackathon)
    except Exception as e:
        print(f"Error creating hackathon: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("")
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
        
    query = query.order_by(Hackathon.created_at.desc())
    
    hackathons = session.exec(query.offset(offset).limit(limit)).all()
    return _hackathons_with_hosts(session, hackathons)

@router.get("/my")
def read_my_hackathons(*, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    """Get hackathons created by current user."""
    hackathons = session.exec(select(Hackathon).where(Hackathon.organizer_id == current_user.id)).all()
    return _hackathons_with_hosts(session, hackathons)

@router.get("/{hackathon_id}")
def read_hackathon(*, session: Session = Depends(get_session), hackathon_id: int):
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return _hackathon_with_hosts(session, hackathon)

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
    
    if reg_start and now < reg_start:
        status_label = "报名未开始"
    elif reg_start and reg_end and reg_start <= now < reg_end:
        status_label = "报名进行中"
    elif reg_end and now >= reg_end:
        if now < act_start:
            status_label = "等待活动开始"
        elif now >= act_start and now < act_end:
            status_label = "活动进行中"
        else:
            status_label = "活动已结束"
            
    return {
        "status": status_label,
        "hackathon_status": hackathon.status,
        "time_status": {
            "registration_open": reg_start <= now < reg_end if reg_start and reg_end else False,
            "activity_ongoing": act_start <= now < act_end,
            "ended": now >= act_end
        }
    }

@router.patch("/{hackathon_id}")
def update_hackathon(*, session: Session = Depends(get_session), hackathon_id: int, hackathon_in: HackathonUpdate, current_user: User = Depends(get_current_organizer)):
    db_hackathon = session.get(Hackathon, hackathon_id)
    if not db_hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if db_hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        hackathon_data = hackathon_in.dict(exclude_unset=True)
        print(f"Updating hackathon {hackathon_id} with data: {hackathon_data}")
        
        for key, value in hackathon_data.items():
            setattr(db_hackathon, key, value)
            
        session.add(db_hackathon)
        session.commit()
        session.refresh(db_hackathon)
        return _hackathon_with_hosts(session, db_hackathon)
    except Exception as e:
        session.rollback()
        print(f"Error updating hackathon: {e}")
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}")

@router.delete("/{hackathon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hackathon(*, session: Session = Depends(get_session), hackathon_id: int, current_user: User = Depends(get_current_organizer)):
    db_hackathon = session.get(Hackathon, hackathon_id)
    if not db_hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if db_hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    # Cascade delete manually
    teams = session.exec(select(Team).where(Team.hackathon_id == hackathon_id)).all()
    team_ids = [t.id for t in teams]
    if team_ids:
        projects = session.exec(select(Project).where(Project.team_id.in_(team_ids))).all()
        project_ids = [p.id for p in projects]
        
        if project_ids:
            scores = session.exec(select(Score).where(Score.project_id.in_(project_ids))).all()
            for s in scores:
                session.delete(s)
            for p in projects:
                session.delete(p)
        
        members = session.exec(select(TeamMember).where(TeamMember.team_id.in_(team_ids))).all()
        for m in members:
            session.delete(m)
        for t in teams:
            session.delete(t)
            
    enrollments = session.exec(select(Enrollment).where(Enrollment.hackathon_id == hackathon_id)).all()
    for e in enrollments:
        session.delete(e)
        
    judges = session.exec(select(Judge).where(Judge.hackathon_id == hackathon_id)).all()
    for j in judges:
        session.delete(j)

    # Delete all hosts for this hackathon
    hosts = session.exec(select(HackathonHost).where(HackathonHost.hackathon_id == hackathon_id)).all()
    for h in hosts:
        session.delete(h)
        
    session.delete(db_hackathon)
    session.commit()
    return None


# ---------------------------------------------------------------------------
# Host CRUD — nested under /{hackathon_id}/hosts
# ---------------------------------------------------------------------------

@router.get("/{hackathon_id}/hosts", response_model=List[HackathonHostRead])
def read_hosts(*, session: Session = Depends(get_session), hackathon_id: int):
    """List all hosts for a hackathon, ordered by display_order."""
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    hosts = session.exec(
        select(HackathonHost)
        .where(HackathonHost.hackathon_id == hackathon_id)
        .order_by(HackathonHost.display_order)
    ).all()
    return hosts


@router.post("/{hackathon_id}/hosts", response_model=HackathonHostRead)
def add_host(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    host_in: HackathonHostCreate,
    current_user: User = Depends(get_current_organizer),
):
    """Add a host to a hackathon. Automatically assigned the next display_order."""
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Determine the next display_order value
    existing = session.exec(
        select(HackathonHost)
        .where(HackathonHost.hackathon_id == hackathon_id)
        .order_by(HackathonHost.display_order.desc())
    ).first()
    next_order = (existing.display_order + 1) if existing else 0

    host = HackathonHost(
        hackathon_id=hackathon_id,
        name=host_in.name,
        logo=host_in.logo,
        display_order=next_order,
    )
    session.add(host)
    session.commit()
    session.refresh(host)
    return host


@router.patch("/{hackathon_id}/hosts/{host_id}", response_model=HackathonHostRead)
def update_host(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    host_id: int,
    host_in: HackathonHostUpdate,
    current_user: User = Depends(get_current_organizer),
):
    """Update a specific host's name, logo, or display_order."""
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    host = session.get(HackathonHost, host_id)
    if not host or host.hackathon_id != hackathon_id:
        raise HTTPException(status_code=404, detail="Host not found")

    update_data = host_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(host, key, value)

    session.add(host)
    session.commit()
    session.refresh(host)
    return host


@router.delete("/{hackathon_id}/hosts/{host_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_host(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    host_id: int,
    current_user: User = Depends(get_current_organizer),
):
    """Remove a host. At least one host must remain."""
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    host = session.get(HackathonHost, host_id)
    if not host or host.hackathon_id != hackathon_id:
        raise HTTPException(status_code=404, detail="Host not found")

    # Ensure at least one host remains
    host_count = len(session.exec(
        select(HackathonHost).where(HackathonHost.hackathon_id == hackathon_id)
    ).all())
    if host_count <= 1:
        raise HTTPException(status_code=400, detail="每个活动至少需要一个主办方")

    session.delete(host)
    session.commit()
    return None


@router.put("/{hackathon_id}/hosts/reorder")
def reorder_hosts(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    host_ids: List[int],
    current_user: User = Depends(get_current_organizer),
):
    """
    Bulk-update display_order for all hosts of a hackathon.
    Accepts an ordered list of host IDs; the position in the list becomes the display_order.
    """
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    for order, hid in enumerate(host_ids):
        host = session.get(HackathonHost, hid)
        if not host or host.hackathon_id != hackathon_id:
            raise HTTPException(status_code=404, detail=f"Host {hid} not found")
        host.display_order = order
        session.add(host)

    session.commit()

    hosts = session.exec(
        select(HackathonHost)
        .where(HackathonHost.hackathon_id == hackathon_id)
        .order_by(HackathonHost.display_order)
    ).all()
    return [HackathonHostRead.from_orm(h).dict() for h in hosts]


# ---------------------------------------------------------------------------
# Judges Management
# ---------------------------------------------------------------------------

@router.post("/{hackathon_id}/judges", response_model=JudgeRead)
def add_judge(*, session: Session = Depends(get_session), hackathon_id: int, user_email: str, current_user: User = Depends(get_current_organizer)):
    """Appoint a judge by email."""
    db_hackathon = session.get(Hackathon, hackathon_id)
    if not db_hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    if db_hackathon.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    user = session.exec(select(User).where(User.email == user_email)).first()
    if not user:
         raise HTTPException(status_code=404, detail="User with this email not found")
         
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
    query = select(User).join(Judge, User.id == Judge.user_id).where(Judge.hackathon_id == hackathon_id)
    judges = session.exec(query).all()
    return judges
