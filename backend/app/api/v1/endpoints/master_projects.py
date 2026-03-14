from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.db.session import get_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.project import (
    MasterProject, MasterProjectCreate, MasterProjectRead,
    MasterProjectReadWithCollaborators, ProjectCollaborator,
)

router = APIRouter()


@router.post("", response_model=MasterProjectRead)
def create_master_project(
    *,
    session: Session = Depends(get_session),
    project_in: MasterProjectCreate,
    current_user: User = Depends(get_current_user),
):
    project = MasterProject(
        **project_in.dict(),
        created_by=current_user.id,
    )
    session.add(project)
    session.commit()
    session.refresh(project)

    # Auto-add creator as collaborator
    collab = ProjectCollaborator(
        project_id=project.id,
        user_id=current_user.id,
        is_visible=True,
    )
    session.add(collab)
    session.commit()

    return project


@router.get("/me", response_model=List[MasterProjectReadWithCollaborators])
def read_my_master_projects(
    *,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(MasterProject)
        .join(ProjectCollaborator, MasterProject.id == ProjectCollaborator.project_id)
        .where(ProjectCollaborator.user_id == current_user.id)
    )
    projects = session.exec(query).all()
    return projects


@router.get("/{project_id}", response_model=MasterProjectReadWithCollaborators)
def read_master_project(
    *, session: Session = Depends(get_session), project_id: int
):
    project = session.get(MasterProject, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
