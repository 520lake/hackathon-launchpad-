from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.db.session import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.hackathon import Hackathon
from app.models.enrollment import Enrollment, EnrollmentCreate, EnrollmentRead, EnrollmentStatus, EnrollmentWithHackathon

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
    results = session.exec(
        select(Enrollment, Hackathon)
        .join(Hackathon, Enrollment.hackathon_id == Hackathon.id)
        .where(Enrollment.user_id == current_user.id)
    ).all()
    
    enrollments_with_hackathon = []
    for enrollment, hackathon in results:
        enrollment_with_hackathon = EnrollmentWithHackathon.from_orm(enrollment)
        enrollment_with_hackathon.hackathon = hackathon
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
