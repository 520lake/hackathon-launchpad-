from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime

from app.db.session import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.hackathon import Hackathon, RegistrationType
from app.models.team_project import (
    Submission, SubmissionCreate, SubmissionRead, SubmissionStatus,
    SubmissionReadWithTeam, Team, TeamMember,
)
from app.models.project import MasterProject, ProjectCollaborator
from app.models.judge import Judge
from app.models.score import Score, ScoreCreate, ScoreRead

router = APIRouter()


@router.post("", response_model=SubmissionRead)
def create_submission(
    *,
    session: Session = Depends(get_session),
    submission_in: SubmissionCreate,
    hackathon_id: int,
    team_id: Optional[int] = None,
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
):
    hackathon = session.get(Hackathon, hackathon_id)
    if not hackathon:
        raise HTTPException(status_code=404, detail="Hackathon not found")

    # Validate team vs individual
    if hackathon.registration_type == RegistrationType.TEAM:
        if not team_id:
            raise HTTPException(status_code=400, detail="team_id required for team hackathons")
        team = session.get(Team, team_id)
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        if team.hackathon_id != hackathon_id:
            raise HTTPException(status_code=400, detail="Team does not belong to this hackathon")
        # Only team leader can submit
        if team.leader_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only team leader can create submission")
        user_id = None
    else:
        # Individual hackathon
        if team_id:
            raise HTTPException(status_code=400, detail="team_id must be null for individual hackathons")
        team_id = None
        user_id = current_user.id

    # Validate optional master project link
    if project_id:
        master_project = session.get(MasterProject, project_id)
        if not master_project:
            raise HTTPException(status_code=404, detail="Master project not found")

    submission = Submission(
        **submission_in.dict(),
        hackathon_id=hackathon_id,
        team_id=team_id,
        user_id=user_id,
        project_id=project_id,
        status=SubmissionStatus.DRAFT,
    )
    session.add(submission)
    session.commit()
    session.refresh(submission)
    return submission


@router.patch("/{submission_id}", response_model=SubmissionRead)
def update_submission(
    *,
    session: Session = Depends(get_session),
    submission_id: int,
    submission_in: SubmissionCreate,
    current_user: User = Depends(get_current_user),
):
    submission = session.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Deadline lock
    hackathon = session.get(Hackathon, submission.hackathon_id)
    if hackathon and hackathon.end_date < datetime.utcnow():
        raise HTTPException(status_code=403, detail="Hackathon deadline has passed")

    # Auth: team leader or individual owner
    if submission.team_id:
        team = session.get(Team, submission.team_id)
        if team.leader_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only team leader can update submission")
    elif submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this submission")

    for key, value in submission_in.dict(exclude_unset=True).items():
        setattr(submission, key, value)

    session.add(submission)
    session.commit()
    session.refresh(submission)
    return submission


@router.post("/{submission_id}/finalize", response_model=SubmissionRead)
def finalize_submission(
    *,
    session: Session = Depends(get_session),
    submission_id: int,
    current_user: User = Depends(get_current_user),
):
    submission = session.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Deadline lock
    hackathon = session.get(Hackathon, submission.hackathon_id)
    if hackathon and hackathon.end_date < datetime.utcnow():
        raise HTTPException(status_code=403, detail="Hackathon deadline has passed")

    # Auth
    if submission.team_id:
        team = session.get(Team, submission.team_id)
        if team.leader_id != current_user.id:
            raise HTTPException(status_code=403, detail="Only team leader can finalize submission")
    elif submission.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    submission.status = SubmissionStatus.SUBMITTED
    session.add(submission)

    # If linked to a master project, sync collaborators
    if submission.project_id:
        if submission.team_id:
            members = session.exec(
                select(TeamMember).where(TeamMember.team_id == submission.team_id)
            ).all()
            user_ids = [m.user_id for m in members]
        else:
            user_ids = [submission.user_id]

        for uid in user_ids:
            existing = session.exec(
                select(ProjectCollaborator).where(
                    ProjectCollaborator.project_id == submission.project_id,
                    ProjectCollaborator.user_id == uid,
                )
            ).first()
            if not existing:
                collab = ProjectCollaborator(
                    project_id=submission.project_id, user_id=uid
                )
                session.add(collab)

    session.commit()
    session.refresh(submission)
    return submission


@router.get("/me", response_model=List[SubmissionReadWithTeam])
def read_my_submissions(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    # Team submissions (via team membership)
    team_query = (
        select(Submission)
        .join(Team, Submission.team_id == Team.id)
        .join(TeamMember, Team.id == TeamMember.team_id)
        .where(TeamMember.user_id == current_user.id)
    )
    team_submissions = session.exec(team_query).all()

    # Individual submissions
    individual_query = select(Submission).where(Submission.user_id == current_user.id)
    individual_submissions = session.exec(individual_query).all()

    # Merge and deduplicate
    seen = set()
    result = []
    for s in list(team_submissions) + list(individual_submissions):
        if s.id not in seen:
            seen.add(s.id)
            result.append(s)

    return result


@router.get("", response_model=List[SubmissionReadWithTeam])
@router.get("/", response_model=List[SubmissionReadWithTeam], include_in_schema=False)
def read_submissions(
    *,
    session: Session = Depends(get_session),
    hackathon_id: int = None,
    offset: int = 0,
    limit: int = 100,
    sort_by_score: bool = False,
):
    query = select(Submission)
    if hackathon_id:
        query = query.where(Submission.hackathon_id == hackathon_id)

    if sort_by_score:
        query = query.order_by(Submission.total_score.desc())

    submissions = session.exec(query.offset(offset).limit(limit)).all()
    return submissions


@router.get("/{submission_id}", response_model=SubmissionReadWithTeam)
def read_submission(*, session: Session = Depends(get_session), submission_id: int):
    submission = session.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return submission


@router.post("/{submission_id}/score", response_model=ScoreRead)
def score_submission(
    *,
    session: Session = Depends(get_session),
    submission_id: int,
    score_in: ScoreCreate,
    current_user: User = Depends(get_current_user),
):
    submission = session.get(Submission, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    hackathon_id = submission.hackathon_id

    # Verify Judge
    judge = session.exec(
        select(Judge).where(
            Judge.user_id == current_user.id,
            Judge.hackathon_id == hackathon_id,
        )
    ).first()
    if not judge:
        raise HTTPException(status_code=403, detail="You are not a judge for this hackathon")

    score = Score(
        judge_id=current_user.id,
        submission_id=submission_id,
        score_value=score_in.score_value,
        details=score_in.details,
        comment=score_in.comment,
    )
    session.add(score)
    session.commit()
    session.refresh(score)

    # Recalculate average score
    scores = session.exec(
        select(Score).where(Score.submission_id == submission_id)
    ).all()
    total = sum(s.score_value for s in scores)
    submission.total_score = total / len(scores) if scores else 0
    session.add(submission)
    session.commit()

    return score
