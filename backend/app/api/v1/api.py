from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    hackathons,
    sections,
    partners,
    organizers,
    teams,
    submissions,
    master_projects,
    enrollments,
    upload,
    ai,
    community,
    notifications,
    discussions,
)

api_router = APIRouter()

@api_router.get("/version")
def get_version():
    return {
        "version": "v3.0-DUAL-TRACK",
        "description": "Dual-track architecture: submissions + master projects"
    }

api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(hackathons.router, prefix="/hackathons", tags=["hackathons"])
api_router.include_router(sections.router, prefix="/hackathons", tags=["sections"])
api_router.include_router(partners.router, prefix="/hackathons", tags=["partners"])
api_router.include_router(organizers.router, prefix="/hackathons", tags=["organizers"])
api_router.include_router(enrollments.router, prefix="/enrollments", tags=["enrollments"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
api_router.include_router(master_projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(community.router, prefix="/community", tags=["community"])
api_router.include_router(discussions.router, prefix="/discussions", tags=["discussions"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])
