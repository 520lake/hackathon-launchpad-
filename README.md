---
title: Aura AI Hackathon Platform
emoji: "\U0001F680"
colorFrom: gray
colorTo: black
sdk: docker
app_port: 7860
license: apache-2.0
---

# Aura

**AI 赋能黑客松平台** —— 在一个平台上发起、参加和评审黑客松。

> 打造中国的 Devpost：粗野主义风格、全生命周期管理、AI 深度集成的黑客松创新协作平台。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19、TypeScript、Vite、Tailwind CSS、shadcn/ui、Zustand |
| 后端 | FastAPI、SQLModel、Alembic、Pydantic |
| 数据库 | SQLite（开发）、PostgreSQL（生产） |
| 认证 | JWT、邮箱密码、邮箱验证码、微信扫码、GitHub OAuth |
| AI | 通义千问 (Qwen-Plus)，经由 ModelScope（智能评分、组队匹配、内容生成） |
| 部署 | Docker Compose、Nginx |

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- Git

### 后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 初始化数据库
python -m app.initial_data   # 创建默认管理员 (admin@aura.com / admin123)

# 启动服务
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API 文档：`http://localhost:8000/docs`

### 前端

```bash
cd frontend
npm install
npm run dev
```

开发服务器运行在 `http://localhost:5173`，自动将 `/api/*` 代理到后端。

### Docker 部署（生产环境）

```bash
docker-compose up
```

后端运行在 8000 端口，前端（Nginx）运行在 80 端口。

### 填充测试数据

```bash
cd backend
.venv/bin/python3 scripts/seed_hackathons.py   # 24 场黑客松 + 用户 + 提交
.venv/bin/python3 -m app.initial_data            # 默认管理员账号
```

## 项目结构

```
hackathon-platform/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # 15 个接口模块（认证、活动、团队等）
│   │   ├── models/             # 18 个 SQLModel 数据表定义
│   │   ├── core/config.py      # 配置项与数据库 URL 逻辑
│   │   └── db/session.py       # 引擎、init_db、get_session
│   ├── alembic/                # 数据库迁移脚本
│   └── scripts/                # 数据填充脚本
├── frontend/
│   ├── src/
│   │   ├── pages/              # 路由级页面组件
│   │   ├── components/ui/      # shadcn/Radix 基础组件
│   │   ├── store/              # Zustand 认证状态管理
│   │   ├── types/              # TypeScript 类型（对应后端 Schema）
│   │   └── utils/              # 工具函数、常量、数据转换
│   └── vite.config.ts
├── docs/                       # 白皮书、PRD、技术参考
├── docker-compose.yml
└── CLAUDE.md                   # AI 助手上下文配置
```

## 系统架构

### 双轨数据模型

- **轨道 A —— 主项目（Master Projects）**：持久化的全局项目组合（`master_project` + `project_collaborator`），接口前缀 `/api/v1/projects`
- **轨道 B —— 参赛作品（Submissions）**：绑定特定活动，`hackathon_id` 必填，`team_id` 可选，接口前缀 `/api/v1/submissions`
- 参赛作品可通过 `project_id` 外键关联到主项目

### 模块化内容系统

活动详情内容存储在 `section` 表中（而非活动表的字段）。内容类型包括 Markdown、日程安排、奖项和评分维度，各有独立的子表，级联删除。

### 评分系统

评委根据可配置的评分维度（含权重）对参赛作品打分。AI 辅助评分功能可根据作品内容自动生成建议分数与评语。系统预计算每个维度的平均分摘要。

### 前端设计

粗野主义（Brutalist）美学风格，圆角全部为零，自定义 Tailwind 色彩令牌（`brand`、`void`、`surface`、`ink`），字体为 Inter + JetBrains Mono。基于 shadcn/Radix UI 组件库，搭配 Framer Motion 动画。

## 页面路由

| 路径 | 页面 |
|------|------|
| `/` | 首页 |
| `/events` | 活动列表 |
| `/events/:id` | 活动详情（内容模块、参赛作品、团队） |
| `/profile` | 个人中心 |
| `/create` | 创建活动 |
| `/admin` | 管理后台 |
| `/notifications` | 通知中心 |
| `/community` | 社区与组队大厅 |

## API 接口

所有接口前缀为 `/api/v1/`，主要模块：

- **auth** —— 登录、注册、OAuth 流程
- **hackathons** —— 活动增删改查、软删除、状态管理
- **enrollments** —— 活动报名
- **teams** —— 组队（含招募字段）
- **submissions** —— 按活动提交参赛作品
- **ai** —— AI 内容生成、评分建议、组队匹配
- **sections** —— 活动内容管理（日程、奖项、评分维度）
- **discussions** —— 活动内讨论区
- **community** —— 跨活动的组队招募看板

## 环境变量

复制 `.env.example` 为 `.env` 并配置：

| 变量 | 说明 |
|------|------|
| `SECRET_KEY` | JWT 签名密钥 |
| `DATABASE_URL` | PostgreSQL 连接地址（留空则使用 SQLite 开发默认值） |
| `BACKEND_CORS_ORIGINS` | 允许的跨域来源 |
| `MODELSCOPE_API_KEY` | AI 功能所需的 ModelScope API 密钥 |

## 文档

- [项目白皮书](docs/Aura_WhitePaper.md) —— 功能概览与技术架构
- [产品需求文档](docs/PRD.md) —— 产品需求说明
- [技术参考](docs/TECHNICAL_REFERENCE.md) —— 功能清单、用户流程、页面结构

## 许可证

[Apache License 2.0](LICENSE)
