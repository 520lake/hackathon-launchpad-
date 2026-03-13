"""
CRUD endpoints for hackathon organizers (multi-organizer RBAC).

All routes are nested under /hackathons/{hackathon_id}/organizers.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from app.db.session import get_session
from app.api.deps import get_current_user, get_current_organizer
from app.models.user import User, UserRead
from app.models.hackathon import Hackathon
from app.models.hackathon_organizer import (
    HackathonOrganizer,
    HackathonOrganizerCreate,
    HackathonOrganizerUpdate,
    HackathonOrganizerRead,
    OrganizerRole,
    OrganizerStatus,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_hackathon_or_404(session: Session, hackathon_id: int) -> Hackathon:
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return hackathon


def _require_owner(session: Session, hackathon_id: int, user_id: int) -> None:
    """Only the hackathon owner can invite/remove organizers."""
    org = session.exec(
        select(HackathonOrganizer).where(
            HackathonOrganizer.hackathon_id == hackathon_id,
            HackathonOrganizer.user_id == user_id,
            HackathonOrganizer.role == OrganizerRole.OWNER,
            HackathonOrganizer.status == OrganizerStatus.ACCEPTED,
        )
    ).first()
    if not org:
        raise HTTPException(status_code=403, detail="Only the hackathon owner can manage organizers")


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.get("/{hackathon_id}/organizers", response_model=List[HackathonOrganizerRead])
def list_organizers(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
):
    """List all organizers for a hackathon."""
    _get_hackathon_or_404(session, hackathon_id)
    organizers = session.exec(
        select(HackathonOrganizer)
        .where(HackathonOrganizer.hackathon_id == hackathon_id)
    ).all()
    return organizers


@router.post("/{hackathon_id}/organizers", response_model=HackathonOrganizerRead)
def invite_organizer(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    user_email: str,
    organizer_in: HackathonOrganizerCreate,
    current_user: User = Depends(get_current_organizer),
):
    """
    Invite a user to be an organizer by email.
    The invitation is created with status=pending until the invitee accepts.
    """
    _get_hackathon_or_404(session, hackathon_id)
    _require_owner(session, hackathon_id, current_user.id)

    # Resolve user by email
    target_user = session.exec(select(User).where(User.email == user_email)).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User with this email not found")

    # Prevent duplicate
    existing = session.exec(
        select(HackathonOrganizer).where(
            HackathonOrganizer.hackathon_id == hackathon_id,
            HackathonOrganizer.user_id == target_user.id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already an organizer for this hackathon")

    # Cannot invite someone as owner (only the creator is owner)
    if organizer_in.role == OrganizerRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot assign owner role via invitation")

    now = datetime.utcnow()
    organizer = HackathonOrganizer(
        hackathon_id=hackathon_id,
        user_id=target_user.id,
        role=organizer_in.role,
        status=OrganizerStatus.PENDING,
        created_at=now,
        created_by=current_user.id,
        updated_at=now,
        updated_by=current_user.id,
    )
    session.add(organizer)
    session.commit()
    session.refresh(organizer)
    return organizer


@router.patch("/{hackathon_id}/organizers/{organizer_id}", response_model=HackathonOrganizerRead)
def update_organizer(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    organizer_id: int,
    organizer_in: HackathonOrganizerUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Update an organizer record. Two use cases:
    1. The invitee accepts the invitation (sets status=accepted).
    2. The owner changes an admin's role.
    """
    _get_hackathon_or_404(session, hackathon_id)

    organizer = session.get(HackathonOrganizer, organizer_id)
    if not organizer or organizer.hackathon_id != hackathon_id:
        raise HTTPException(status_code=404, detail="Organizer not found")

    update_data = organizer_in.dict(exclude_unset=True)

    # If accepting an invitation, the current user must be the invitee
    if "status" in update_data and update_data["status"] == OrganizerStatus.ACCEPTED:
        if organizer.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only the invitee can accept the invitation")

    # If changing role, the current user must be the owner
    if "role" in update_data:
        _require_owner(session, hackathon_id, current_user.id)
        if update_data["role"] == OrganizerRole.OWNER:
            raise HTTPException(status_code=400, detail="Cannot reassign owner role")

    for key, value in update_data.items():
        setattr(organizer, key, value)
    organizer.updated_at = datetime.utcnow()
    organizer.updated_by = current_user.id

    session.add(organizer)
    session.commit()
    session.refresh(organizer)
    return organizer


@router.delete(
    "/{hackathon_id}/organizers/{organizer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_organizer(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    organizer_id: int,
    current_user: User = Depends(get_current_organizer),
):
    """Remove an organizer. The owner cannot be removed."""
    _get_hackathon_or_404(session, hackathon_id)
    _require_owner(session, hackathon_id, current_user.id)

    organizer = session.get(HackathonOrganizer, organizer_id)
    if not organizer or organizer.hackathon_id != hackathon_id:
        raise HTTPException(status_code=404, detail="Organizer not found")

    if organizer.role == OrganizerRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot remove the hackathon owner")

    session.delete(organizer)
    session.commit()
    return None
