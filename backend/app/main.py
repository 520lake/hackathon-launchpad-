from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Ensure uploads directory exists
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 1. API Router (Must be first)
app.include_router(api_router, prefix=settings.API_V1_STR)

# 2. Uploads (Static)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# 3. Frontend Static Files (Root)
# Determine path to frontend/dist relative to this file
# backend/app/main.py -> backend/app -> backend -> frontend/dist
current_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dist = os.path.join(current_dir, "..", "..", "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")

@app.get("/health")
def health_check():
    return {"status": "ok"}

