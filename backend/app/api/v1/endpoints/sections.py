"""
CRUD endpoints for hackathon sections and their child entities
(schedules, prizes, judging criteria).

All routes are nested under /hackathons/{hackathon_id}/sections.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime

from app.db.session import get_session
from app.api.deps import get_current_user, get_current_organizer
from app.models.user import User
from app.models.hackathon import Hackathon
from app.models.hackathon_organizer import HackathonOrganizer, OrganizerRole, OrganizerStatus
from app.models.section import (
    Section, SectionCreate, SectionUpdate, SectionRead, SectionType,
)
from app.models.schedule import Schedule, ScheduleCreate, ScheduleUpdate, ScheduleRead
from app.models.prize import Prize, PrizeCreate, PrizeUpdate, PrizeRead
from app.models.judging_criteria import (
    JudgingCriteria, JudgingCriteriaCreate, JudgingCriteriaUpdate, JudgingCriteriaRead,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_hackathon_or_404(session: Session, hackathon_id: int) -> Hackathon:
    """Fetch a hackathon by ID or raise 404."""
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return hackathon


def _check_organizer_permission(session: Session, hackathon_id: int, user_id: int) -> None:
    """
    Verify the user is an owner or accepted admin for this hackathon.
    Raises 403 if the user lacks permission.
    """
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


def _get_section_or_404(session: Session, section_id: int, hackathon_id: int) -> Section:
    """Fetch a section and verify it belongs to the given hackathon."""
    section = session.get(Section, section_id)
    if not section or section.hackathon_id != hackathon_id:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


def _validate_section_type(section: Section, expected: SectionType) -> None:
    """Ensure a section is the correct type for the child entity being added."""
    if section.section_type != expected:
        raise HTTPException(
            status_code=400,
            detail=f"Section type must be '{expected.value}', got '{section.section_type.value}'",
        )


# ===================================================================
# SECTION CRUD
# ===================================================================

@router.get("/{hackathon_id}/sections", response_model=List[SectionRead])
def list_sections(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
):
    """List all sections for a hackathon, ordered by display_order."""
    _get_hackathon_or_404(session, hackathon_id)
    sections = session.exec(
        select(Section)
        .where(Section.hackathon_id == hackathon_id)
        .order_by(Section.display_order)
    ).all()
    return sections


@router.post("/{hackathon_id}/sections", response_model=SectionRead)
def create_section(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_in: SectionCreate,
    current_user: User = Depends(get_current_organizer),
):
    """Add a new section to a hackathon."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)

    # Auto-assign display_order if not provided (append to end)
    if section_in.display_order == 0:
        last = session.exec(
            select(Section)
            .where(Section.hackathon_id == hackathon_id)
            .order_by(Section.display_order.desc())
        ).first()
        section_in.display_order = (last.display_order + 1) if last else 0

    now = datetime.utcnow()
    section = Section(
        **section_in.dict(),
        hackathon_id=hackathon_id,
        created_at=now,
        created_by=current_user.id,
        updated_at=now,
        updated_by=current_user.id,
    )
    session.add(section)
    session.commit()
    session.refresh(section)
    return section


@router.patch("/{hackathon_id}/sections/{section_id}", response_model=SectionRead)
def update_section(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
    section_in: SectionUpdate,
    current_user: User = Depends(get_current_organizer),
):
    """Partially update a section (title, content, display_order)."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)
    section = _get_section_or_404(session, section_id, hackathon_id)

    update_data = section_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(section, key, value)
    section.updated_at = datetime.utcnow()
    section.updated_by = current_user.id

    session.add(section)
    session.commit()
    session.refresh(section)
    return section


@router.delete(
    "/{hackathon_id}/sections/{section_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_section(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
    current_user: User = Depends(get_current_organizer),
):
    """Delete a section and its child entities (cascaded by DB)."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)
    section = _get_section_or_404(session, section_id, hackathon_id)

    session.delete(section)
    session.commit()
    return None


@router.put("/{hackathon_id}/sections/reorder")
def reorder_sections(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_ids: List[int],
    current_user: User = Depends(get_current_organizer),
):
    """
    Bulk-update display_order for all sections.
    Accepts an ordered list of section IDs; position becomes display_order.
    """
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)

    for order, sid in enumerate(section_ids):
        section = _get_section_or_404(session, sid, hackathon_id)
        section.display_order = order
        session.add(section)

    session.commit()
    sections = session.exec(
        select(Section)
        .where(Section.hackathon_id == hackathon_id)
        .order_by(Section.display_order)
    ).all()
    return [SectionRead.from_orm(s).dict() for s in sections]


# ===================================================================
# SCHEDULE CRUD (child of schedules-type section)
# ===================================================================

@router.get(
    "/{hackathon_id}/sections/{section_id}/schedules",
    response_model=List[ScheduleRead],
)
def list_schedules(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
):
    """List all schedule entries within a section, ordered by display_order."""
    _get_hackathon_or_404(session, hackathon_id)
    _get_section_or_404(session, section_id, hackathon_id)

    schedules = session.exec(
        select(Schedule)
        .where(Schedule.section_id == section_id)
        .order_by(Schedule.display_order)
    ).all()
    return schedules


@router.post(
    "/{hackathon_id}/sections/{section_id}/schedules",
    response_model=ScheduleRead,
)
def create_schedule(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
    schedule_in: ScheduleCreate,
    current_user: User = Depends(get_current_organizer),
):
    """Add a schedule entry to a schedules-type section."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)
    section = _get_section_or_404(session, section_id, hackathon_id)
    _validate_section_type(section, SectionType.SCHEDULES)

    now = datetime.utcnow()
    schedule = Schedule(
        **schedule_in.dict(),
        hackathon_id=hackathon_id,
        section_id=section_id,
        created_at=now,
        created_by=current_user.id,
        updated_at=now,
        updated_by=current_user.id,
    )
    session.add(schedule)
    session.commit()
    session.refresh(schedule)
    return schedule


@router.patch(
    "/{hackathon_id}/sections/{section_id}/schedules/{schedule_id}",
    response_model=ScheduleRead,
)
def update_schedule(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
    schedule_id: int,
    schedule_in: ScheduleUpdate,
    current_user: User = Depends(get_current_organizer),
):
    """Partially update a schedule entry."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)
    _get_section_or_404(session, section_id, hackathon_id)

    schedule = session.get(Schedule, schedule_id)
    if not schedule or schedule.section_id != section_id:
        raise HTTPException(status_code=404, detail="Schedule not found")

    update_data = schedule_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(schedule, key, value)
    schedule.updated_at = datetime.utcnow()
    schedule.updated_by = current_user.id

    session.add(schedule)
    session.commit()
    session.refresh(schedule)
    return schedule


@router.delete(
    "/{hackathon_id}/sections/{section_id}/schedules/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_schedule(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
    schedule_id: int,
    current_user: User = Depends(get_current_organizer),
):
    """Delete a schedule entry."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)
    _get_section_or_404(session, section_id, hackathon_id)

    schedule = session.get(Schedule, schedule_id)
    if not schedule or schedule.section_id != section_id:
        raise HTTPException(status_code=404, detail="Schedule not found")

    session.delete(schedule)
    session.commit()
    return None


# ===================================================================
# PRIZE CRUD (child of prizes-type section)
# ===================================================================

@router.get(
    "/{hackathon_id}/sections/{section_id}/prizes",
    response_model=List[PrizeRead],
)
def list_prizes(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
):
    """List all prizes within a section, ordered by display_order."""
    _get_hackathon_or_404(session, hackathon_id)
    _get_section_or_404(session, section_id, hackathon_id)

    prizes = session.exec(
        select(Prize)
        .where(Prize.section_id == section_id)
        .order_by(Prize.display_order)
    ).all()
    return prizes


@router.post(
    "/{hackathon_id}/sections/{section_id}/prizes",
    response_model=PrizeRead,
)
def create_prize(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
    prize_in: PrizeCreate,
    current_user: User = Depends(get_current_organizer),
):
    """Add a prize to a prizes-type section."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)
    section = _get_section_or_404(session, section_id, hackathon_id)
    _validate_section_type(section, SectionType.PRIZES)

    now = datetime.utcnow()
    prize = Prize(
        **prize_in.dict(),
        hackathon_id=hackathon_id,
        section_id=section_id,
        created_at=now,
        created_by=current_user.id,
        updated_at=now,
        updated_by=current_user.id,
    )
    session.add(prize)
    session.commit()
    session.refresh(prize)
    return prize


@router.patch(
    "/{hackathon_id}/sections/{section_id}/prizes/{prize_id}",
    response_model=PrizeRead,
)
def update_prize(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
    prize_id: int,
    prize_in: PrizeUpdate,
    current_user: User = Depends(get_current_organizer),
):
    """Partially update a prize."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)
    _get_section_or_404(session, section_id, hackathon_id)

    prize = session.get(Prize, prize_id)
    if not prize or prize.section_id != section_id:
        raise HTTPException(status_code=404, detail="Prize not found")

    update_data = prize_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(prize, key, value)
    prize.updated_at = datetime.utcnow()
    prize.updated_by = current_user.id

    session.add(prize)
    session.commit()
    session.refresh(prize)
    return prize


@router.delete(
    "/{hackathon_id}/sections/{section_id}/prizes/{prize_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_prize(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
    prize_id: int,
    current_user: User = Depends(get_current_organizer),
):
    """Delete a prize."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)
    _get_section_or_404(session, section_id, hackathon_id)

    prize = session.get(Prize, prize_id)
    if not prize or prize.section_id != section_id:
        raise HTTPException(status_code=404, detail="Prize not found")

    session.delete(prize)
    session.commit()
    return None


# ===================================================================
# JUDGING CRITERIA CRUD (child of judging_criteria-type section)
# ===================================================================

@router.get(
    "/{hackathon_id}/sections/{section_id}/judging-criteria",
    response_model=List[JudgingCriteriaRead],
)
def list_judging_criteria(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
):
    """List all judging criteria within a section, ordered by display_order."""
    _get_hackathon_or_404(session, hackathon_id)
    _get_section_or_404(session, section_id, hackathon_id)

    criteria = session.exec(
        select(JudgingCriteria)
        .where(JudgingCriteria.section_id == section_id)
        .order_by(JudgingCriteria.display_order)
    ).all()
    return criteria


@router.post(
    "/{hackathon_id}/sections/{section_id}/judging-criteria",
    response_model=JudgingCriteriaRead,
)
def create_judging_criterion(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
    criteria_in: JudgingCriteriaCreate,
    current_user: User = Depends(get_current_organizer),
):
    """Add a judging criterion to a judging_criteria-type section."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)
    section = _get_section_or_404(session, section_id, hackathon_id)
    _validate_section_type(section, SectionType.JUDGING_CRITERIA)

    now = datetime.utcnow()
    criterion = JudgingCriteria(
        **criteria_in.dict(),
        hackathon_id=hackathon_id,
        section_id=section_id,
        created_at=now,
        created_by=current_user.id,
        updated_at=now,
        updated_by=current_user.id,
    )
    session.add(criterion)
    session.commit()
    session.refresh(criterion)
    return criterion


@router.patch(
    "/{hackathon_id}/sections/{section_id}/judging-criteria/{criteria_id}",
    response_model=JudgingCriteriaRead,
)
def update_judging_criterion(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
    criteria_id: int,
    criteria_in: JudgingCriteriaUpdate,
    current_user: User = Depends(get_current_organizer),
):
    """Partially update a judging criterion."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)
    _get_section_or_404(session, section_id, hackathon_id)

    criterion = session.get(JudgingCriteria, criteria_id)
    if not criterion or criterion.section_id != section_id:
        raise HTTPException(status_code=404, detail="Judging criterion not found")

    update_data = criteria_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(criterion, key, value)
    criterion.updated_at = datetime.utcnow()
    criterion.updated_by = current_user.id

    session.add(criterion)
    session.commit()
    session.refresh(criterion)
    return criterion


@router.delete(
    "/{hackathon_id}/sections/{section_id}/judging-criteria/{criteria_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_judging_criterion(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    section_id: int,
    criteria_id: int,
    current_user: User = Depends(get_current_organizer),
):
    """Delete a judging criterion."""
    _get_hackathon_or_404(session, hackathon_id)
    _check_organizer_permission(session, hackathon_id, current_user.id)
    _get_section_or_404(session, section_id, hackathon_id)

    criterion = session.get(JudgingCriteria, criteria_id)
    if not criterion or criterion.section_id != section_id:
        raise HTTPException(status_code=404, detail="Judging criterion not found")

    session.delete(criterion)
    session.commit()
    return None
