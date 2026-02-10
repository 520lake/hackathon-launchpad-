import gradio as gr
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys

# 关键：将当前目录添加到系统路径
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import init_db

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# 魔搭创空间需要挂载 Gradio 才能正常显示界面（作为 Keep-alive）
def greet(name):
    return "Hello " + name + "!"

demo = gr.Interface(fn=greet, inputs="text", outputs="text", title="Aura Hackathon Platform")

# 挂载 Gradio 到 /gradio 路径（避免抢占根路径）
app = gr.mount_gradio_app(app, demo, path="/gradio")

# 数据库初始化
import logging
logger = logging.getLogger("uvicorn")
@app.on_event("startup")
async def startup_event():
    logger.info("--- AURA API STARTUP: VERSION 2026-02-10-MODEL-SCOPE-DEPLOY-v1.7-FRONTEND-FIX ---")
    init_db()

# CORS 设置
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# 1. API 路由
app.include_router(api_router, prefix=settings.API_V1_STR)

# 2. 静态资源托管（JS/CSS/Images）
# 假设你的前端 build 产物在 /app/frontend
if os.path.exists("/app/frontend/assets"):
    app.mount("/assets", StaticFiles(directory="/app/frontend/assets"), name="assets")

# 3. 根路由 & SPA 路由兜底
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # 排除 API 和 Gradio 路径
    if full_path.startswith("api") or full_path.startswith("gradio") or full_path.startswith("static"):
        return {"error": "Not Found", "path": full_path}
    
    # 尝试返回对应的静态文件（如 favicon.ico）
    potential_file = os.path.join("/app/frontend", full_path)
    if os.path.exists(potential_file) and os.path.isfile(potential_file):
        return FileResponse(potential_file)

    # 默认返回 index.html
    index_path = "/app/frontend/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {"error": "Frontend not found at /app/frontend"}