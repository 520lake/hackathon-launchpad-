# Aura Platform Technical Reference (技术参考文档)

## 1. Function List (功能清单)

### Core Modules (核心模块)
- **Authentication (认证系统)**: 
  - 支持双重登录（微信模拟/邮箱验证码）。
  - 基于 JWT 的会话管理，支持跨域 Cookie 回退。
- **Hackathon Management (活动管理)**:
  - 全生命周期支持（草稿 -> 发布 -> 报名 -> 提交 -> 评审 -> 结果）。
  - 可自定义 JSON 字段（奖项、合作伙伴、评分维度）。
- **Participation System (参赛系统)**:
  - 报名状态追踪（待审核、已批准）。
  - **[新] 即时解锁**: 报名成功后立即解锁“我的项目”空间。
  - 战队管理（创建、加入、退出、踢人）。
  - 项目提交（标题、简介、技术栈、Repo/Demo 链接、封面图）。
- **Recruitment System (招募系统)**:
  - 项目内发布招募信息。
  - **[新] 社区大厅**: 招募信息自动同步至社区，支持按角色/技能/团队筛选。
  - 一键联系队长（通过联系方式）。
- **AI Integration (AI 整合)**:
  - **AI 智能组队**: 基于性格 (MBTI) 和技能的队友推荐。
  - **AI 项目助手**: 创意生成、招募文案生成、描述润色。
  - **AI 社区洞察**: 自动分析参赛者画像与热门话题。

## 2. User Flow (用户流程)

### Participant Journey (参赛者路径)
1.  **发现 (Browse)**: 访问 `HackathonList` -> 按状态/标签筛选 -> 点击卡片。
2.  **报名 (Register)**:
    - 未登录 -> 提示登录。
    - 已登录 -> 点击“立即报名” -> 创建报名记录。
    - **[优化]** 状态立即更新为“已报名”，自动跳转至“我的项目”标签。
3.  **战队/项目 (Team/Project)**:
    - 导航至“我的项目”标签。
    - **个人**: 点击“开始个人项目” -> 自动创建战队与项目空间。
    - **团队**: 点击“创建战队”或通过“参赛者”标签加入现有战队。
4.  **开发与辅助 (Development)**:
    - **AI 辅助**: 使用 AI 助手生成项目创意或润色描述。
    - **提交**: 填写项目详情（Repo, Demo, Video） -> 提交。
5.  **招募 (Recruitment)**:
    - 在“我的项目”中点击“发布招募”。
    - 填写角色/技能/人数/描述（可由 AI 生成）。
    - 招募信息出现在“参赛者” -> “招募大厅”及全局社区板块。
6.  **个人中心 (Dashboard)**:
    - 随时查看参与的活动与创建的项目。
    - 点击项目卡片 -> **[新]** 自动跳转回对应活动的“我的项目”标签。

## 3. Page Structure (页面结构)

### Key Components (核心组件)
- **UserDashboardModal (个人中心)**:
  - `My Profile`: 用户基本信息、AI 简历。
  - `My Activities`: 报名活动列表（链接至 `HackathonDetailModal`）。
  - `My Projects`: 已创建项目列表（**[新]** 链接至 `HackathonDetailModal` 的 `my_project` 标签）。
- **HackathonDetailModal (活动详情页)**:
  - `Overview`: 基本信息、日程、奖项。
  - `Participants`: 战队列表、**招募大厅**、**AI 社区洞察**。
  - `Gallery`: 项目展示墙。
  - `My Project`: **AI 助手**、战队管理、项目编辑、**招募发布**。
- **SubmitProjectModal (项目提交弹窗)**:
  - 支持接收 AI 润色后的初始数据。

### Data Sync (数据同步策略)
- **即时性**: 报名、提交、发布招募等操作后，立即触发 `fetchHackathon` 刷新局部状态。
- **关联性**: 个人中心通过 `initialTab` 参数引导 `HackathonDetailModal` 进入特定视图。

## 4. API Interface (API 接口清单)

### Auth & Users
- `POST /api/v1/auth/login`: 登录/注册。
- `GET /api/v1/users/me`: 获取当前用户信息。
- `PUT /api/v1/users/me`: 更新个人资料（含 AI 简历）。

### Hackathons & Enrollments
- `GET /api/v1/hackathons`: 活动列表。
- `GET /api/v1/hackathons/{id}`: 活动详情。
- `POST /api/v1/enrollments/`: 报名活动。
- `GET /api/v1/enrollments/me`: 我的报名记录。

### Teams & Projects
- `POST /api/v1/teams`: 创建战队。
- `POST /api/v1/teams/{id}/join`: 加入战队。
- `GET /api/v1/projects/me`: 我的项目列表。
- `POST /api/v1/projects`: 创建/更新项目。
- `POST /api/v1/teams/{id}/recruitments`: 发布招募。
- `GET /api/v1/teams/recruitments/all`: 招募大厅数据。

### AI Services
- `POST /api/v1/ai/generate`: 通用 AI 生成接口（支持创意、文案、润色）。
- `POST /api/v1/ai/team_match`: 队友匹配推荐。
- `GET /api/v1/community/insights`: 社区洞察分析。

## 5. Database Structure (数据库表结构)

### Core Tables
- **User**: 用户表（ID, Email, 技能, 简介, 性格 MBTI, AI 简历 JSON, 认证状态）。
- **Hackathon**: 活动表（ID, 标题, 状态, 时间线 JSON, 奖项 JSON, 合作伙伴 JSON, 封面图）。
- **Enrollment**: 报名表（User_ID, Hackathon_ID, 状态, 报名时间）。
- **Team**: 战队表（ID, Hackathon_ID, 队长_ID, 名称, 描述, 招募状态）。
- **TeamMember**: 成员表（Team_ID, User_ID, 加入时间）。
- **Project**: 项目表（ID, Team_ID, 标题, 描述, 技术栈 tags, Repo_URL, Demo_URL, 视频链接, 封面图, 状态, 评分）。
- **Recruitment**: 招募表（ID, Team_ID, 角色, 技能要求, 招募人数, 详细描述, 联系方式, 状态 open/closed）。

## 6. Deployment (部署说明)

### Environment Variables (.env)
```bash
DATABASE_URL=sqlite:///./vibebuild.db
SECRET_KEY=your_secret_key
# AI 模型配置 (ModelScope / OpenAI)
MODELSCOPE_API_TOKEN=your_token
VITE_API_URL=http://localhost:8000
```

### Start Commands (启动命令)
**Backend (FastAPI)**:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Frontend (Vite)**:
```bash
cd frontend
npm install
npm run dev
```
