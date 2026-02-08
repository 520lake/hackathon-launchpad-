# Aura Frontend Guide

> **System Status**: Online
> **Version**: 2.6.0 (Secure + Mock Auth)
> **Access Level**: Developer

---

## 1. System Overview // 系统概览

VibeBuild 前端采用 **React 18 + TypeScript** 构建，搭载 **Tailwind CSS v4** 样式引擎。整个系统基于 **SPA (Single Page Application)** 架构，通过高频交互的 **模态框 (Modals)** 实现流式体验。

### ⚡ Tech Stack Matrix
*   **Core**: React 18 (Concurrent Features enabled)
*   **Type Safety**: TypeScript
*   **Build Engine**: Vite (HMR enabled)
*   **Styling**: Tailwind CSS v4
*   **Data Link**: Axios
*   **Auth Persistence**: Hybrid (LocalStorage + Cookie Fallback)

---

## 2. Environment Sync // 环境同步

### Prerequisites
*   Node.js v18+
*   Package Manager (npm/yarn/pnpm)

### Initialization Sequence
```bash
# 1. Access Directory
cd frontend

# 2. Install Modules
npm install

# 3. Ignite Dev Server
npm run dev
```
> 🟢 **Server Output**: `http://localhost:5173`

---

## 3. Directory Structure // 目录映射

```
frontend/src/
├── 📂 assets/          # Static Assets (Images, SVGs)
├── 📂 components/      # UI Modules (Functional Modals)
│   ├── 🧩 CreateHackathonModal.tsx  # [Module] AI-Powered Creation
│   ├── 🧩 HackathonDetailModal.tsx  # [Module] Event Intelligence
│   ├── 🧩 HackathonListModal.tsx    # [Module] Discovery Grid
│   ├── 🔐 LoginModal.tsx            # [Module] Auth Gate (WeChat/Email)
│   └── 👤 UserDashboardModal.tsx    # [Module] User Matrix (w/ Mock Verify)
├── ⚛️ App.tsx          # Root Logic & State Orchestration
├── 🎨 App.css          # Global Styles
└── 🚀 main.tsx         # DOM Injection Point
```

---

## 4. Data Uplink // API 集成协议

### 📡 Proxy Configuration
开发环境下，所有 `/api/*` 信号通过 `vite.config.ts` 自动转发至后端节点 `http://localhost:8000`。

### 🔐 Auth Protocol (Hybrid)
为兼容 ModelScope 的 iframe 环境，系统实现了双重 Token 存储机制：
1.  **Primary**: `localStorage.getItem('token')`
2.  **Fallback**: `document.cookie` (HttpOnly support via Backend)
3.  **Header Injection**:
    ```typescript
    Authorization: `Bearer ${token}`
    ```

### 📡 Endpoint Registry (`/api/v1`)

| Module | Endpoint | Action |
| :--- | :--- | :--- |
| **Auth** | `/login/access-token` | User Identification |
| **Auth** | `/wechat/qr` | QR Matrix Generation (Supports Mock) |
| **Core** | `/hackathons/` | Event Data Stream |
| **AI** | `/ai/generate` | Neural Network Inference |

---

## 5. Module Intelligence // 核心模块说明

### 🧩 Modal Orchestration (`App.tsx`)
系统采用 **"Z-Index Layering"** 策略管理视图。
> ⚠️ **Warning**: `HackathonListModal` 拥有最高优先级 (`z-[200]`)，请确保新增模块不产生遮挡冲突。

### 🤖 AI Integration (`CreateHackathonModal`)
集成 **ModelScope** 神经网络接口。
*   **Input**: User Intent (Theme/Topic)
*   **Process**: Neural Inference
*   **Output**: Structured Hackathon Plan (Auto-filled)

### 🧪 Mock Verification (`UserDashboardModal`)
**[New Feature]** 为方便测试“发起活动”流程，用户中心集成了模拟实名功能：
*   **Trigger**: 点击绿色脉冲按钮 "CLICK TO MOCK VERIFY"
*   **Effect**: 立即将当前用户状态更新为 `verified=true`，无需真实证件。

---

> *End of Transmission.*
