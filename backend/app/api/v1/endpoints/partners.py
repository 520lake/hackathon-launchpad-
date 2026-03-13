"""
CRUD endpoints for hackathon partners / sponsors.
Mirrors the existing host endpoints pattern.

All routes are nested under /hackathons/{hackathon_id}/partners.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from app.db.session import get_session
from app.api.deps import get_current_organizer
from app.models.user import User
from app.models.hackathon import Hackathon
from app.models.hackathon_organizer import HackathonOrganizer, OrganizerRole, OrganizerStatus
from app.models.partner import Partner, PartnerCreate, PartnerUpdate, PartnerRead

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_hackathon_or_404(session: Session, hackathon_id: int) -> Hackathon:
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return hackathon


def _check_organizer_permission(session: Session, hackathon_id: int, user_id: int) -> None:
    org = session.exec(
        select(HackathonOrganizer).where(
            HackathonOrganizer.hackathon_id == hackathon_id,
            HackathonOrganizer.user_id == user_id,
            HackathonOrganizer.status == OrganizerStatus.ACCEPTED,
            HackathonOrganizer.role.in_([OrganizerRole.OWNER, OrganizerRole.ADMIN]),
        )
    ).first()
    if not org:
        raise HTTPException(status_code=403, detail="Not enough permissions")


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

@router.get("/{hackathon_id}/partners", response_model=List[PartnerRead])
def list_partners(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
):
    """List all partners for a hackathon, ordered by display_order."""
    _get_hackathon_or_404(session, hackathon_id)
    partners = session.exec(
        select(Partner)
        .where(Partner.hackathon_id == hackathon_id)
        .order_by(Partner.display_order)
    ).all()
    return partners


@router.post("/{hackathon_id}/partners", response_model=PartnerRead)
def add_partner(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    partner_in: PartnerCreate,
    current_user: User = Depends(get_current_organizer),
):
    """Add a partner to a hackathon. Auto-assigned next display_order."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)

    existing = session.exec(
        select(Partner)
        .where(Partner.hackathon_id == hackathon_id)
        .order_by(Partner.display_order.desc())
    ).first()
    next_order = (existing.display_order + 1) if existing else 0

    now = datetime.utcnow()
    partner = Partner(
        **partner_in.dict(),
        hackathon_id=hackathon_id,
        display_order=next_order,
        created_at=now,
        created_by=current_user.id,
        updated_at=now,
        updated_by=current_user.id,
    )
    session.add(partner)
    session.commit()
    session.refresh(partner)
    return partner


@router.patch("/{hackathon_id}/partners/{partner_id}", response_model=PartnerRead)
def update_partner(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    partner_id: int,
    partner_in: PartnerUpdate,
    current_user: User = Depends(get_current_organizer),
):
    """Partially update a partner's name, logo, category, etc."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)

    partner = session.get(Partner, partner_id)
    if not partner or partner.hackathon_id != hackathon_id:
        raise HTTPException(status_code=404, detail="Partner not found")

    update_data = partner_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(partner, key, value)
    partner.updated_at = datetime.utcnow()
    partner.updated_by = current_user.id

    session.add(partner)
    session.commit()
    session.refresh(partner)
    return partner


@router.delete(
    "/{hackathon_id}/partners/{partner_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_partner(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    partner_id: int,
    current_user: User = Depends(get_current_organizer),
):
    """Remove a partner from a hackathon."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)

    partner = session.get(Partner, partner_id)
    if not partner or partner.hackathon_id != hackathon_id:
        raise HTTPException(status_code=404, detail="Partner not found")

    session.delete(partner)
    session.commit()
    return None


@router.put("/{hackathon_id}/partners/reorder")
def reorder_partners(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    partner_ids: List[int],
    current_user: User = Depends(get_current_organizer),
):
    """
    Bulk-update display_order for all partners.
    Accepts an ordered list of partner IDs; position becomes display_order.
    """
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)

    for order, pid in enumerate(partner_ids):
        partner = session.get(Partner, pid)
        if not partner or partner.hackathon_id != hackathon_id:
            raise HTTPException(status_code=404, detail=f"Partner {pid} not found")
        partner.display_order = order
        session.add(partner)

    session.commit()

    partners = session.exec(
        select(Partner)
        .where(Partner.hackathon_id == hackathon_id)
        .order_by(Partner.display_order)
    ).all()
    return [PartnerRead.from_orm(p).dict() for p in partners]
