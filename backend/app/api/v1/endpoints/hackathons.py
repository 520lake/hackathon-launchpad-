"""
CRUD endpoints for hackathons, hosts, and judges.

Hackathon detail responses use batch loading to include sections + child
data, hosts, and partners without N+1 queries.
"""
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime

from app.models.hackathon import (
    Hackathon, HackathonCreate, HackathonRead, HackathonUpdate,
    HackathonStatus, HackathonFormat,
)
from app.models.hackathon_host import (
    HackathonHost, HackathonHostCreate, HackathonHostRead, HackathonHostUpdate,
)
from app.models.hackathon_organizer import (
    HackathonOrganizer, OrganizerRole, OrganizerStatus,
)
from app.models.section import Section, SectionRead, SectionType
from app.models.schedule import Schedule, ScheduleRead
from app.models.prize import Prize, PrizeRead
from app.models.judging_criteria import JudgingCriteria, JudgingCriteriaRead
from app.models.partner import Partner, PartnerRead
from app.models.judge import Judge, JudgeCreate, JudgeRead
from app.models.score import Score, CriteriaScoreSummary, CriteriaScoreSummaryRead
from app.models.team_project import Submission
from app.db.session import get_session
from app.api.deps import get_current_user, get_current_organizer, verify_judge
from app.models.user import User, UserRead

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers: permission checks via hackathon_organizers table
# ---------------------------------------------------------------------------

def _check_organizer_permission(
    session: Session, hackathon_id: int, user_id: int,
) -> None:
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


# ---------------------------------------------------------------------------
# Helpers: batch-load full hackathon response with sections + child data
# ---------------------------------------------------------------------------

def _parse_tags(raw: str | None) -> list[str]:
    """Parse a JSON-encoded tags string into a list, defaulting to []."""
    if not raw:
        return []
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return []


def _build_full_hackathon(session: Session, hackathon: Hackathon) -> dict:
    """
    Assemble a complete hackathon response including sections (with child
    data), hosts, and partners. Uses batch loading to avoid N+1 queries:
      1. Fetch hackathon core fields
      2. Fetch all sections in one query
      3. Batch-fetch child rows (schedules, prizes, judging_criteria)
         by hackathon_id, then group by section_id
      4. Fetch hosts and partners in 2 queries
    """
    hid = hackathon.id
    data = HackathonRead.from_orm(hackathon).dict()
    data["tags"] = _parse_tags(hackathon.tags)

    # --- Sections ---
    sections = session.exec(
        select(Section).where(Section.hackathon_id == hid).order_by(Section.display_order)
    ).all()

    # Batch-load all child rows for this hackathon
    all_schedules = session.exec(
        select(Schedule).where(Schedule.hackathon_id == hid).order_by(Schedule.display_order)
    ).all()
    all_prizes = session.exec(
        select(Prize).where(Prize.hackathon_id == hid).order_by(Prize.display_order)
    ).all()
    all_criteria = session.exec(
        select(JudgingCriteria).where(JudgingCriteria.hackathon_id == hid).order_by(JudgingCriteria.display_order)
    ).all()

    # Group child rows by section_id
    schedules_map: dict[int, list] = {}
    for s in all_schedules:
        schedules_map.setdefault(s.section_id, []).append(ScheduleRead.from_orm(s).dict())
    prizes_map: dict[int, list] = {}
    for p in all_prizes:
        prizes_map.setdefault(p.section_id, []).append(PrizeRead.from_orm(p).dict())
    criteria_map: dict[int, list] = {}
    for c in all_criteria:
        criteria_map.setdefault(c.section_id, []).append(JudgingCriteriaRead.from_orm(c).dict())

    # Assemble sections with their children
    sections_out = []
    for sec in sections:
        sec_data = SectionRead.from_orm(sec).dict()
        if sec.section_type == SectionType.SCHEDULES:
            sec_data["schedules"] = schedules_map.get(sec.id, [])
        elif sec.section_type == SectionType.PRIZES:
            sec_data["prizes"] = prizes_map.get(sec.id, [])
        elif sec.section_type == SectionType.JUDGING_CRITERIA:
            sec_data["judging_criteria"] = criteria_map.get(sec.id, [])
        sections_out.append(sec_data)

    data["sections"] = sections_out

    # --- Hosts ---
    hosts = session.exec(
        select(HackathonHost)
        .where(HackathonHost.hackathon_id == hid)
        .order_by(HackathonHost.display_order)
    ).all()
    data["hosts"] = [HackathonHostRead.from_orm(h).dict() for h in hosts]

    # --- Partners ---
    partners = session.exec(
        select(Partner)
        .where(Partner.hackathon_id == hid)
        .order_by(Partner.display_order)
    ).all()
    data["partners"] = [PartnerRead.from_orm(p).dict() for p in partners]

    return data


def _build_hackathon_list_item(session: Session, hackathons: list) -> list:
    """
    Build lightweight list response: hackathon core fields + hosts + prize
    summary.  No sections or partners are loaded to keep the query fast.
    """
    if not hackathons:
        return []
    ids = [h.id for h in hackathons]

    # Batch-load hosts
    all_hosts = session.exec(
        select(HackathonHost)
        .where(HackathonHost.hackathon_id.in_(ids))
        .order_by(HackathonHost.display_order)
    ).all()
    hosts_map: dict[int, list] = {}
    for host in all_hosts:
        hosts_map.setdefault(host.hackathon_id, []).append(
            HackathonHostRead.from_orm(host).dict()
        )

    # Batch-load prizes for a lightweight cash / non-cash summary
    all_prizes = session.exec(
        select(Prize).where(Prize.hackathon_id.in_(ids))
    ).all()
    prize_summary: dict[int, dict] = {}
    for p in all_prizes:
        entry = prize_summary.setdefault(
            p.hackathon_id, {"total_cash": 0, "has_non_cash": False}
        )
        entry["total_cash"] += float(p.total_cash_amount)
        if not entry["has_non_cash"]:
            try:
                sublist = json.loads(p.awards_sublist) if p.awards_sublist else []
                if any(item.get("type") != "cash" for item in sublist if isinstance(item, dict)):
                    entry["has_non_cash"] = True
            except (json.JSONDecodeError, TypeError):
                pass

    results = []
    for h in hackathons:
        d = HackathonRead.from_orm(h).dict()
        d["tags"] = _parse_tags(h.tags)
        d["hosts"] = hosts_map.get(h.id, [])
        summary = prize_summary.get(h.id, {"total_cash": 0, "has_non_cash": False})
        d["total_cash_prize"] = summary["total_cash"]
        d["has_non_cash_prizes"] = summary["has_non_cash"]
        results.append(d)
    return results


# ---------------------------------------------------------------------------
# Hackathon CRUD
# ---------------------------------------------------------------------------

@router.post("")
def create_hackathon(
    *,
    session: Session = Depends(get_session),
    hackathon: HackathonCreate,
    current_user: User = Depends(get_current_organizer),
):
    """Create a hackathon and auto-assign the creator as the owner organizer."""
    try:
        now = datetime.utcnow()
        create_data = hackathon.dict()
        # Serialize tags list to JSON string for DB storage
        if create_data.get("tags") is not None:
            create_data["tags"] = json.dumps(create_data["tags"], ensure_ascii=False)
        db_hackathon = Hackathon(
            **create_data,
            created_by=current_user.id,
            created_at=now,
            updated_at=now,
            updated_by=current_user.id,
        )
        session.add(db_hackathon)
        session.flush()

        # Auto-create the owner organizer row
        owner = HackathonOrganizer(
            hackathon_id=db_hackathon.id,
            user_id=current_user.id,
            role=OrganizerRole.OWNER,
            status=OrganizerStatus.ACCEPTED,
            created_at=now,
            created_by=current_user.id,
            updated_at=now,
            updated_by=current_user.id,
        )
        session.add(owner)
        session.commit()
        session.refresh(db_hackathon)
        return _build_full_hackathon(session, db_hackathon)
    except Exception as e:
        session.rollback()
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
    province: Optional[str] = None,
    city: Optional[str] = None,
    district: Optional[str] = None,
    search: Optional[str] = None,
):
    """List hackathons with optional filters on status, format, and location."""
    query = select(Hackathon).where(Hackathon.status != HackathonStatus.DELETED)

    if status:
        query = query.where(Hackathon.status == status)
    if format:
        query = query.where(Hackathon.format == format)
    if province:
        query = query.where(Hackathon.province == province)
    if city:
        query = query.where(Hackathon.city == city)
    if district:
        query = query.where(Hackathon.district == district)
    if search:
        query = query.where(Hackathon.title.contains(search))

    query = query.order_by(Hackathon.created_at.desc())
    hackathons = session.exec(query.offset(offset).limit(limit)).all()
    return _build_hackathon_list_item(session, hackathons)


@router.get("/my")
def read_my_hackathons(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get hackathons where the current user is an organizer (owner or admin)."""
    org_rows = session.exec(
        select(HackathonOrganizer).where(
            HackathonOrganizer.user_id == current_user.id,
            HackathonOrganizer.status == OrganizerStatus.ACCEPTED,
        )
    ).all()
    hackathon_ids = [o.hackathon_id for o in org_rows]
    if not hackathon_ids:
        return []
    hackathons = session.exec(
        select(Hackathon).where(Hackathon.id.in_(hackathon_ids))
    ).all()
    return _build_hackathon_list_item(session, hackathons)


@router.get("/{hackathon_id}")
def read_hackathon(*, session: Session = Depends(get_session), hackathon_id: int):
    """Get a single hackathon with full detail (sections, hosts, partners)."""
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    return _build_full_hackathon(session, hackathon)


@router.patch("/{hackathon_id}")
def update_hackathon(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    hackathon_in: HackathonUpdate,
    current_user: User = Depends(get_current_organizer),
):
    """Partially update a hackathon's core fields."""
    db_hackathon = session.get(Hackathon, hackathon_id)
    if not db_hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    _check_organizer_permission(session, hackathon_id, current_user.id)

    try:
        hackathon_data = hackathon_in.dict(exclude_unset=True)
        # Serialize tags list to JSON string for DB storage
        if "tags" in hackathon_data and hackathon_data["tags"] is not None:
            hackathon_data["tags"] = json.dumps(hackathon_data["tags"], ensure_ascii=False)
        for key, value in hackathon_data.items():
            setattr(db_hackathon, key, value)
        db_hackathon.updated_at = datetime.utcnow()
        db_hackathon.updated_by = current_user.id

        session.add(db_hackathon)
        session.commit()
        session.refresh(db_hackathon)
        return _build_full_hackathon(session, db_hackathon)
    except Exception as e:
        session.rollback()
        print(f"Error updating hackathon: {e}")
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}")


@router.delete("/{hackathon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hackathon(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    current_user: User = Depends(get_current_organizer),
):
    """
    Soft-delete a hackathon by setting its status to DELETED.
    The hackathon and all child data are preserved but hidden from queries.
    """
    db_hackathon = session.get(Hackathon, hackathon_id)
    if not db_hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    _check_organizer_permission(session, hackathon_id, current_user.id)

    db_hackathon.status = HackathonStatus.DELETED
    db_hackathon.updated_at = datetime.utcnow()
    db_hackathon.updated_by = current_user.id
    session.add(db_hackathon)
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
    _check_organizer_permission(session, hackathon_id, current_user.id)

    existing = session.exec(
        select(HackathonHost)
        .where(HackathonHost.hackathon_id == hackathon_id)
        .order_by(HackathonHost.display_order.desc())
    ).first()
    next_order = (existing.display_order + 1) if existing else 0

    now = datetime.utcnow()
    host = HackathonHost(
        hackathon_id=hackathon_id,
        name=host_in.name,
        logo_url=host_in.logo_url,
        display_order=next_order,
        created_at=now,
        created_by=current_user.id,
        updated_at=now,
        updated_by=current_user.id,
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
    """Update a specific host's name, logo_url, or display_order."""
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    _check_organizer_permission(session, hackathon_id, current_user.id)

    host = session.get(HackathonHost, host_id)
    if not host or host.hackathon_id != hackathon_id:
        raise HTTPException(status_code=404, detail="Host not found")

    update_data = host_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(host, key, value)
    host.updated_at = datetime.utcnow()
    host.updated_by = current_user.id

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
    _check_organizer_permission(session, hackathon_id, current_user.id)

    host = session.get(HackathonHost, host_id)
    if not host or host.hackathon_id != hackathon_id:
        raise HTTPException(status_code=404, detail="Host not found")

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
    Accepts an ordered list of host IDs; position becomes display_order.
    """
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    _check_organizer_permission(session, hackathon_id, current_user.id)

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
# Judges Management (kept as-is; Judge table stays separate)
# ---------------------------------------------------------------------------

@router.post("/{hackathon_id}/judges", response_model=JudgeRead)
def add_judge(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    user_email: str,
    current_user: User = Depends(get_current_organizer),
):
    """Appoint a judge by email."""
    db_hackathon = session.get(Hackathon, hackathon_id)
    if not db_hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")
    _check_organizer_permission(session, hackathon_id, current_user.id)

    user = session.exec(select(User).where(User.email == user_email)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")

    existing_judge = session.exec(
        select(Judge).where(Judge.hackathon_id == hackathon_id, Judge.user_id == user.id)
    ).first()
    if existing_judge:
        raise HTTPException(status_code=400, detail="User is already a judge")

    judge = Judge(user_id=user.id, hackathon_id=hackathon_id)
    session.add(judge)
    session.commit()
    session.refresh(judge)
    return judge


@router.get("/{hackathon_id}/judges", response_model=List[UserRead])
def read_judges(*, session: Session = Depends(get_session), hackathon_id: int):
    """List all judges for a hackathon (returns user data)."""
    query = select(User).join(Judge, User.id == Judge.user_id).where(Judge.hackathon_id == hackathon_id)
    judges = session.exec(query).all()
    return judges


@router.get("/{hackathon_id}/judges/me")
def check_judge_status(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    current_user: User = Depends(get_current_user),
):
    """Check if the current user is a judge for this hackathon."""
    judge = session.exec(
        select(Judge).where(
            Judge.user_id == current_user.id,
            Judge.hackathon_id == hackathon_id,
        )
    ).first()
    return {"is_judge": judge is not None}


@router.get("/{hackathon_id}/judges/me/progress")
def judge_progress(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    current_user: User = Depends(get_current_user),
):
    """Return which submissions the current judge has scored."""
    verify_judge(session, current_user.id, hackathon_id)

    # All submissions for this hackathon
    all_submissions = session.exec(
        select(Submission.id).where(Submission.hackathon_id == hackathon_id)
    ).all()

    # Submissions this judge has scored (at least one criterion)
    scored_ids = session.exec(
        select(Score.submission_id).where(
            Score.judge_id == current_user.id,
            Score.submission_id.in_(all_submissions),
        ).distinct()
    ).all()

    return {
        "scored_submission_ids": list(scored_ids),
        "total_submissions": len(all_submissions),
    }


@router.delete("/{hackathon_id}/judges/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_judge(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
    user_id: int,
    current_user: User = Depends(get_current_organizer),
):
    """Remove a judge. Existing scores are kept for audit."""
    _check_organizer_permission(session, hackathon_id, current_user.id)

    judge = session.exec(
        select(Judge).where(
            Judge.user_id == user_id,
            Judge.hackathon_id == hackathon_id,
        )
    ).first()
    if not judge:
        raise HTTPException(status_code=404, detail="Judge not found")

    session.delete(judge)
    session.commit()
    return None


@router.get("/{hackathon_id}/leaderboard")
def hackathon_leaderboard(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int,
):
    """
    Ranked submissions by total_score with per-criteria breakdown.
    """
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    submissions = session.exec(
        select(Submission)
        .where(Submission.hackathon_id == hackathon_id)
        .order_by(Submission.total_score.desc())
    ).all()

    if not submissions:
        return []

    sub_ids = [s.id for s in submissions]

    # Per-criteria summaries
    summaries = session.exec(
        select(CriteriaScoreSummary).where(
            CriteriaScoreSummary.submission_id.in_(sub_ids)
        )
    ).all()
    summary_map: dict[int, list] = {}
    for s in summaries:
        summary_map.setdefault(s.submission_id, []).append(
            CriteriaScoreSummaryRead.from_orm(s).dict()
        )

    # Count distinct judges per submission
    judge_scores = session.exec(
        select(Score.submission_id, Score.judge_id).where(
            Score.submission_id.in_(sub_ids)
        )
    ).all()
    judge_count_map: dict[int, set] = {}
    for sub_id, judge_id in judge_scores:
        judge_count_map.setdefault(sub_id, set()).add(judge_id)

    # Criteria names for context
    criteria = session.exec(
        select(JudgingCriteria).where(JudgingCriteria.hackathon_id == hackathon_id)
    ).all()
    criteria_name_map = {c.id: c.name for c in criteria}

    result = []
    for rank, sub in enumerate(submissions, 1):
        criteria_scores = summary_map.get(sub.id, [])
        for cs in criteria_scores:
            cs["criteria_name"] = criteria_name_map.get(cs["criteria_id"], "")
        result.append({
            "rank": rank,
            "submission_id": sub.id,
            "title": sub.title,
            "team_id": sub.team_id,
            "total_score": round(sub.total_score, 2),
            "judge_count": len(judge_count_map.get(sub.id, set())),
            "criteria_scores": criteria_scores,
        })

    return result
