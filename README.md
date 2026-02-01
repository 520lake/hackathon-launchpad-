---
license: apache-2.0
sdk: python
app_file: app.py
title: VibeBuild Hackathon Platform
tags:
- hackathon
- collaboration
- ai
---

# VibeBuild

VibeBuild 是一个由 AI 驱动的创新协作与黑客松生态平台。

## 项目结构

- `frontend/`: React + TypeScript + Tailwind CSS (v4)
- `backend/`: FastAPI + SQLModel + PostgreSQL
- `docs/`: 项目文档 (包含 PRD)

## 快速开始 (推荐使用 Docker)

为了确保团队开发环境一致，我们推荐使用 Docker Compose 启动项目。

### 前置要求

- Docker Desktop
- Git

### 启动项目

1. 克隆项目 (如果你还没克隆):
   ```bash
   git clone <repo-url>
   cd vibebuild
   ```

2. 启动服务:
   ```bash
   docker-compose up --build
   ```

3. 访问服务:
   - 前端: http://localhost:5173
   - 后端 API 文档: http://localhost:8000/docs
   - 数据库 (PostgreSQL): localhost:5432

## 本地开发指南 (如果不使用 Docker)

### 后端 (Backend)

1. 进入后端目录:
   ```bash
   cd backend
   ```
2. 创建并激活虚拟环境 (可选):
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. 安装依赖:
   ```bash
   pip install -r requirements.txt
   ```
4. 配置环境变量 (参考 `app/core/config.py` 或创建 `.env`)
5. 运行服务:
   ```bash
   uvicorn app.main:app --reload
   ```

### 前端 (Frontend)

1. 进入前端目录:
   ```bash
   cd frontend
   ```
2. 安装依赖:
   ```bash
   npm install
   ```
3. 运行开发服务器:
   ```bash
   npm run dev
   ```

## 贡献指南

请查看 [CONTRIBUTING.md](CONTRIBUTING.md) (待创建)。
