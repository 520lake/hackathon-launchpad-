# VibeBuild 前端开发指南

本文档旨在为前端开发者提供 VibeBuild 项目的开发概览、架构说明及 API 集成指南。

## 1. 项目概览

VibeBuild 是一个 AI 驱动的黑客松协作平台。前端采用 React + TypeScript + Tailwind CSS (v4) 构建，通过 Vite 进行开发和构建。

### 技术栈
- **核心框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS v4
- **HTTP 客户端**: Axios
- **路由**: 单页应用 (SPA)，目前主要通过模态框 (Modals) 进行页面交互，未引入 React Router。

## 2. 环境搭建

### 前置要求
- Node.js (推荐 v18+)
- npm 或 yarn/pnpm

### 启动步骤
1. 进入前端目录：
   ```bash
   cd frontend
   ```
2. 安装依赖：
   ```bash
   npm install
   ```
3. 启动开发服务器：
   ```bash
   npm run dev
   ```
   默认运行在 `http://localhost:5173`。

## 3. 目录结构

```
frontend/src/
├── assets/          # 静态资源 (图片, SVG)
├── components/      # React 组件 (主要是功能性模态框)
│   ├── CreateHackathonModal.tsx  # 创建黑客松 (含 AI 生成)
│   ├── HackathonDetailModal.tsx  # 黑客松详情与报名
│   ├── HackathonListModal.tsx    # 黑客松列表与筛选
│   ├── LoginModal.tsx            # 登录 (微信/邮箱)
│   ├── UserDashboardModal.tsx    # 用户个人中心
│   └── ...
├── App.tsx          # 主入口，包含布局和模态框状态管理
├── App.css          # 全局样式
└── main.tsx         # 应用挂载点
```

## 4. API 集成指南

### 代理配置
在开发环境中，`vite.config.ts` 已配置代理，将 `/api` 开头的请求转发至后端 `http://localhost:8000`。

### 认证机制 (JWT)
- **登录**: 用户登录成功后，后端返回 `access_token`。
- **存储**: Token 需存储在 `localStorage.getItem('token')`。
- **请求头**: 发起需要认证的请求时，请自行在 Header 中添加：
  ```javascript
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
  ```
  *(注：目前部分组件已内联实现了此逻辑，建议后续封装统一的 Axios 拦截器)*

### 主要 API 端点
所有 API 均以 `/api/v1` 为前缀：

#### 认证 (Auth)
- `POST /login/access-token`: 邮箱/密码登录
- `POST /wechat/qr`: 获取微信登录二维码
- `POST /email-code`: 发送邮箱验证码

#### 黑客松 (Hackathons)
- `GET /hackathons/`: 获取列表 (支持筛选)
- `POST /hackathons/`: 创建黑客松 (需认证)
- `GET /hackathons/{id}`: 获取详情
- `PUT /hackathons/{id}`: 更新详情
- `POST /hackathons/{id}/publish`: 发布黑客松
- `POST /hackathons/{id}/enroll`: 报名参加

#### AI 功能
- `POST /ai/generate`: 通用 AI 生成接口
  - `type="hackathon"`: 生成黑客松方案
  - `type="project"`: 优化项目文档
  - `type="matching"`: 推荐队友

## 5. 核心组件说明

### 模态框管理 (App.tsx)
目前应用采用“全模态框”设计。所有主要功能（登录、详情、列表）都作为 Modal 挂载在 `App.tsx` 底部。
- **Z-Index 注意事项**: `HackathonListModal` 的 z-index 已调整为 `200`，以防止被其他元素遮挡。新增 Modal 时请注意层级管理。

### AI 生成 (CreateHackathonModal)
集成了 ModelScope AI。用户输入主题后，调用 `handleAIGenerate` 方法请求后端，自动填充表单（标题、描述、规则等）。

### 用户仪表盘 (UserDashboardModal)
展示用户“创建的活动”和“参与的活动”。包含实名认证入口，认证状态通过 `user.is_verified` 判断。

## 6. 部署

构建生产环境代码：
```bash
npm run build
```
构建产物位于 `frontend/dist` 目录。

## 7. 常见问题
- **页面被遮挡？** 检查 `App.tsx` 中 Modal 的放置顺序（应在最底部）以及组件自身的 `z-index`。
- **跨域错误 (CORS)？** 确保通过 `http://localhost:5173` 访问，利用 Vite 代理转发请求。如果直接访问后端端口可能会遇到 CORS 问题。
