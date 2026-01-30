from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.db.session import get_session
from app.models.hackathon import Hackathon, HackathonCreate, HackathonRead

router = APIRouter()

@router.post("/", response_model=HackathonRead)
def create_hackathon(*, session: Session = Depends(get_session), hackathon: HackathonCreate):
    # Mock organizer ID for now
    db_hackathon = Hackathon.from_orm(hackathon)
    db_hackathon.organizer_id = 1 
    session.add(db_hackathon)
    session.commit()
    session.refresh(db_hackathon)
    return db_hackathon

@router.get("/", response_model=List[HackathonRead])
def read_hackathons(*, session: Session = Depends(get_session), offset: int = 0, limit: int = 100):
    hackathons = session.exec(select(Hackathon).offset(offset).limit(limit)).all()
    return hackathons
