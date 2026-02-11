# 🤝 Contribution Protocol // 协作协议

> **Status**: Open for Contribution
> **Protocol**: Git Flow
> **Mission**: Build the Future Together

---

## 🔄 Sync & Merge // 协作流程

| Step | Action | Description | Command |
| :--- | :--- | :--- | :--- |
| **01** | **Fork** | Fork repository to your personal matrix | `Click 'Fork'` |
| **02** | **Clone** | Clone your fork to local workspace | `git clone <fork-url>` |
| **03** | **Branch** | Create a new neural branch | `git checkout -b feature/amazing-feature` |
| **04** | **Commit** | Save your code changes | `git commit -m 'feat: add amazing feature'` |
| **05** | **Push** | Upload to your remote matrix | `git push origin feature/amazing-feature` |
| **06** | **PR** | Initiate Pull Request | `Click 'New Pull Request'` |

---

## 📏 Code Standards // 代码规范

### 🐍 Backend (Python)
*   **Style**: PEP 8
*   **Formatter**: `black`, `isort`
*   **Type Hinting**: Required for all new endpoints

### ⚛️ Frontend (React)
*   **Style**: ESLint + Prettier
*   **Framework**: React 18 + TypeScript
*   **Styling**: Tailwind CSS v4 (No custom CSS unless necessary)

---

## 📝 Commit Matrix // 提交规范

| Type | Meaning | Example |
| :--- | :--- | :--- |
| **feat** | New Feature | `feat: add AI team matching` |
| **fix** | Bug Fix | `fix: resolve login token error` |
| **docs** | Documentation | `docs: update deployment guide` |
| **style** | Formatting | `style: reformat code with black` |
| **refactor** | Code Restructuring | `refactor: optimize database queries` |
| **test** | Testing | `test: add unit tests for auth` |
| **chore** | Maintenance | `chore: update dependencies` |
