from fastapi import FastAPI, HTTPException
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

# Debug log to verify deployment
import logging
logger = logging.getLogger("uvicorn")
@app.on_event("startup")
async def startup_event():
    logger.info("--- AURA API STARTUP: VERSION 2026-02-10-MODEL-SCOPE-DEPLOY-v1.4-HEAD-MERGE-FIX ---")
    # 确保数据库表已创建 (通常由 alembic 处理，这里作为双重检查或本地开发用)
    # SQLModel.metadata.create_all(engine)

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
# In Docker/Production, we will copy dist to a local 'static_dist' folder
current_dir = os.path.dirname(os.path.abspath(__file__))
# Check local Docker path first
local_dist = os.path.join(current_dir, "..", "static_dist")
# Fallback to dev path
dev_dist = os.path.join(current_dir, "..", "..", "frontend", "dist")

dist_path = local_dist if os.path.exists(local_dist) else dev_dist

if os.path.exists(dist_path):
    # SPA Catch-all route for history mode
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API requests to pass through
        if full_path.startswith("api/") or full_path.startswith("static/") or full_path.startswith("health"):
            raise HTTPException(status_code=404)
            
        # Check if file exists
        file_path = os.path.join(dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Otherwise return index.html
        return FileResponse(os.path.join(dist_path, "index.html"))

@app.get("/health")
def health_check():
    return {"status": "ok"}

