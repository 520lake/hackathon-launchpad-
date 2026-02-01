---
title: Aura AI Hackathon Platform
emoji: 🚀
colorFrom: gray
colorTo: black
sdk: docker
app_port: 7860
license: Apache-2.0
---

# Aura - AI-Empowered Hackathon Platform (AI 赋能黑客松平台)

> **China's Devpost** —— A brutalist-styled, AI-empowered platform for hackathon organizers, participants, and judges.
>
> 打造中国的 Devpost：一个极具“粗野主义”风格、由 AI 深度赋能的黑客松创新协作平台。

📄 **[阅读项目白皮书 (Project White Paper)](docs/Aura_WhitePaper.md)** - 包含详细的功能介绍与技术架构说明。

---

## 🚀 最新更新 (What's New)

本次更新主要包含以下核心功能与改进：

1.  **魔搭 (ModelScope) 深度集成**:
    - 支持**单容器全栈部署** (FastAPI 托管前端静态资源)，端口适配 7860。
    - 实现**数据持久化**，自动识别 `/mnt/workspace` 挂载点，确保 SQLite 数据不丢失。
2.  **个人中心 (User Dashboard)**:
    - 新增用户活动追踪面板，可查看“我发起的”和“我参与的”活动。
    - 支持技能标签与个人资料管理，为 AI 组队提供数据基础。
3.  **视觉风格重构 (Brutalist UI)**:
    - 全面实施 "No AI Flavor" 粗野主义设计语言：高对比度、硬朗边框、大字体。
    - 修复了所有模态框 (Modals) 的主题不一致问题。
4.  **多语言支持 (i18n)**:
    - 核心界面实现中英文无缝切换，适配国内与国际化需求。

---

## ✨ 核心特性 (Key Features)

*   **🤖 AI-Native**: 
    - 基于 ModelScope (Qwen-Plus) 的活动一键策划、智能组队匹配与项目润色。
*   **🎨 Brutalist Design**: 
    - 独特的极客审美，拒绝平庸，强调内容与代码的硬核本质。
*   **🔄 Full Lifecycle**: 
    - 覆盖活动发布、报名审核、组队协作、项目提交、评委打分的全流程。
*   **🔐 Dual Auth**: 
    - 支持微信（测试号）扫码与邮箱验证码双重登录。

---

## 🛠️ 快速开始 (Getting Started)

### 推荐：Docker 部署 (Recommended)

为了确保环境一致性，推荐使用 Docker Compose 启动。

```bash
# 克隆项目
git clone https://github.com/520lake/hackathon-launchpad-.git
cd hackathon-launchpad-

# 启动服务 (包含前后端与数据库)
docker-compose up --build
```
- **前端**: http://localhost:5173
- **后端 API**: http://localhost:8000/docs

### 本地开发 (Local Development)

**后端 (Backend)**:
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

**前端 (Frontend)**:
```bash
cd frontend
npm install
npm run dev
```

---

## 📂 项目结构 (Project Structure)

```
.
├── backend/                 # FastAPI 后端
│   ├── app/                 # 应用核心代码
│   ├── alembic/             # 数据库迁移脚本
│   └── start_modelscope.sh  # 魔搭启动脚本
├── frontend/                # React + Tailwind v4 前端
├── docs/                    # 项目文档
│   ├── Aura_WhitePaper.md   # 项目白皮书
│   └── PRD.md               # 产品需求文档
└── Dockerfile               # ModelScope 部署文件
```

---

## 🤝 贡献 (Contributing)

欢迎提交 Issue 和 Pull Request！让我们一起打造最好的黑客松平台。

License: Apache-2.0
