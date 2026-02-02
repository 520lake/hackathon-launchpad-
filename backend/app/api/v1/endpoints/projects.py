from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.db.session import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.hackathon import Hackathon
from app.models.team_project import Project, ProjectCreate, ProjectRead, ProjectStatus, Team
from app.models.judge import Judge
from app.models.score import Score, ScoreCreate, ScoreRead

router = APIRouter()

@router.post("", response_model=ProjectRead)
def create_project(*, session: Session = Depends(get_session), project_in: ProjectCreate, team_id: int, current_user: User = Depends(get_current_user)):
    """
    Submit a project (Team Leader only).
    """
    team = session.get(Team, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only team leader can submit project")
        
    project_data = project_in.dict()
    project = Project(**project_data, team_id=team_id, status=ProjectStatus.SUBMITTED)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(*, session: Session = Depends(get_session), project_id: int, project_in: ProjectCreate, current_user: User = Depends(get_current_user)):
    """
    Update project submission.
    """
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    team = session.get(Team, project.team_id)
    if team.leader_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only team leader can update project")
        
    project_data = project_in.dict(exclude_unset=True)
    for key, value in project_data.items():
        setattr(project, key, value)
        
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@router.get("", response_model=List[ProjectRead])
def read_projects(*, session: Session = Depends(get_session), offset: int = 0, limit: int = 100, sort_by_score: bool = False):
    query = select(Project)
    if sort_by_score:
        query = query.order_by(Project.total_score.desc())
    projects = session.exec(query.offset(offset).limit(limit)).all()
    return projects

@router.get("/{project_id}", response_model=ProjectRead)
def read_project(*, session: Session = Depends(get_session), project_id: int):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

# Scoring
@router.post("/{project_id}/score", response_model=ScoreRead)
def score_project(*, session: Session = Depends(get_session), project_id: int, score_in: ScoreCreate, current_user: User = Depends(get_current_user)):
    """
    Judge scores a project.
    """
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    team = session.get(Team, project.team_id)
    hackathon_id = team.hackathon_id
    
    # Verify Judge
    judge = session.exec(select(Judge).where(Judge.user_id == current_user.id, Judge.hackathon_id == hackathon_id)).first()
    if not judge:
        raise HTTPException(status_code=403, detail="You are not a judge for this hackathon")
        
    # Create Score
    # We ignore judge_id and project_id from input if they are there, and use context
    score = Score(
        judge_id=current_user.id,
        project_id=project_id,
        score_value=score_in.score_value,
        comment=score_in.comment
    )
    session.add(score)
    
    # Update Project Status
    project.status = ProjectStatus.GRADING
    session.add(project)
    
    session.commit()
    session.refresh(score)
    
    # Recalculate total score (average)
    scores = session.exec(select(Score).where(Score.project_id == project_id)).all()
    total = sum([s.score_value for s in scores])
    project.total_score = total / len(scores) if scores else 0
    session.add(project)
    session.commit()
    session.refresh(project)
    
    return score
