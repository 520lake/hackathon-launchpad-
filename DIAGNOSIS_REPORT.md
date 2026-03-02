# 项目诊断报告

## 1. 技术栈摘要

### 前端 (Frontend)
- **框架**: React 19 (Vite)
- **语言**: TypeScript
- **样式**: Tailwind CSS v4 (配合 CSS Variables)
- **路由**: 目前采用 **单页应用 + 模态框 (Modal)** 的形式，无标准 URL 路由 (React Router)。
- **状态管理**: `App.tsx` 中的本地 State (`useState`)，无全局状态管理库。
- **HTTP 客户端**: Axios

### 后端 (Backend)
- **框架**: FastAPI
- **语言**: Python 3.10+
- **数据库**: PostgreSQL (使用 SQLModel/SQLAlchemy ORM)
- **迁移工具**: Alembic
- **API 规范**: RESTful API (`/api/v1`)
- **部署**: Docker, ModelScope 适配

### 核心功能模块 (MVP)
1.  **用户系统**: 注册、登录、个人仪表盘、实名认证 (`/users`, `/auth`)
2.  **黑客松管理**: 创建、列表展示、详情页 (`/hackathons`)
3.  **团队/项目**: AI 组队匹配、项目提交 (`/teams`, `/projects`, `/ai`)
4.  **评委/管理**: 管理员仪表盘、评审 (`/judge` - 代码中存在但在 API Router 中未完全确认，需检查 `judge.py` 模型)

---

## 2. 现有设计规范 (基于代码提取)

由于无法直接连接 Figma (MCP 工具限制)，以下规范提取自 `tailwind.config.js` 和 `index.css`：

- **设计风格**: Brutalist (粗犷主义) / Cyberpunk
- **圆角 (Border Radius)**: 全局 `0px` (无圆角)
- **字体 (Typography)**:
    - 主要: `JetBrains Mono` (等宽字体用于标题和正文)
    - 次要: `Inter`
- **色彩系统 (Color Palette)**:
    - **Brand (品牌色)**: `#D4A373` (Caramel Highlight)
    - **Brand Dim (暗部)**: `#8B5E3C`
    - **Brand Glow (高光)**: `#FFD6A5`
    - **Void (背景)**: `#0A0A0A`
    - **Surface (卡片)**: `#1A1A1A`
    - **Ink (文本)**: `#E5E5E5`
- **特效**:
    - 背景噪点 (Noise Overlay)
    - 文本故障效果 (Glitch Effect)

---

## 3. 功能与架构差异分析 (Gap Analysis)

| 维度 | 现有实现 (Current) | 目标/潜在需求 (Target) | 差距/行动项 (Action Items) |
| :--- | :--- | :--- | :--- |
| **路由架构** | 所有的功能页面（登录、详情、仪表盘）均为 **Modal 弹窗**，刷新页面会丢失状态。 | 通常设计稿包含独立页面 (如 `/login`, `/dashboard`)。 | **高优先级**: 引入 `react-router-dom`，将 Modal 重构为独立 Page 路由。 |
| **状态管理** | `App.tsx` 包含大量 `useState`，难以维护。 | 需要全局状态管理 (User, UI State)。 | 引入 Zustand 或 Context API 统一管理 Auth 和 UI 状态。 |
| **设计系统** | 纯 CSS 变量 + Tailwind 配置。 | Figma Token 与代码的严格对齐。 | 需人工核对 Figma 颜色/间距 Token 并更新 `index.css`。 |
| **组件化** | 组件分散，缺乏统一的基础 UI 库 (Button, Input 复用度低)。 | 建立 `design-system` 目录，封装原子组件。 | 提取 Button, Input, Card 等为独立组件。 |
| **API 完整性** | 包含基础 CRUD 和 AI 匹配。 | 未知 (需确认 Figma 中是否有新功能，如复杂图表、实时通知等)。 | **待确认**: 请检查设计稿中是否有后端未支持的数据字段。 |

## 4. 后端数据需求 (初步)

基于现有代码结构，后端支持较为完善，但需注意：
- **评委系统**: `judge.py` 模型存在，但 `api.py` 中似乎未直接暴露 `/judge` 路由 (可能集成在 `/hackathons` 或 `/projects` 中)。
- **文件上传**: `/upload` 接口已存在 (`static` 挂载)，支持基础文件服务。

## 5. 限制说明
- **Figma 连接失败**: 无法自动读取 Figma 节点和 Token。**请手动提供关键设计 Token 或截图，或确认当前代码中的 "Brutalist" 风格是否即为目标风格。**
