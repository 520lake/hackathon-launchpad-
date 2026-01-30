from fastapi import APIRouter

from app.api.v1.endpoints import users, hackathons, auth, enrollments, projects, teams, ai, upload

api_router = APIRouter()
api_router.include_router(auth.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(hackathons.router, prefix="/hackathons", tags=["hackathons"])
api_router.include_router(enrollments.router, prefix="/enrollments", tags=["enrollments"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
