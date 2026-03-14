from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


class ProjectCollaborator(SQLModel, table=True):
    __tablename__ = "project_collaborator"
    project_id: int = Field(foreign_key="master_project.id", primary_key=True)
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    is_visible: bool = Field(default=True)


class MasterProject(SQLModel, table=True):
    __tablename__ = "master_project"
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: Optional[str] = None
    repo_url: Optional[str] = None
    created_by: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    collaborators: List[ProjectCollaborator] = Relationship()


class MasterProjectCreate(SQLModel):
    title: str
    description: Optional[str] = None
    repo_url: Optional[str] = None


class ProjectCollaboratorRead(SQLModel):
    project_id: int
    user_id: int
    is_visible: bool


class MasterProjectRead(SQLModel):
    id: int
    title: str
    description: Optional[str] = None
    repo_url: Optional[str] = None
    created_by: int
    created_at: datetime


class MasterProjectReadWithCollaborators(MasterProjectRead):
    collaborators: List[ProjectCollaboratorRead] = []
