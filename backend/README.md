# Aura Backend Service

> **Core**: FastAPI | **Database**: SQLite (Async/Sync) | **AI**: ModelScope Integration

The powerhouse behind the Aura Hackathon Platform. Built with performance and developer experience in mind using Modern Python.

---

## ⚡ Quick Start (Local)

### 1. Environment Setup
Requires Python 3.10+.

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 2. Dependencies
```bash
pip install -r requirements.txt
```

### 3. Database Initialization
Initialize the SQLite database and run migrations.
```bash
# Run migrations
alembic upgrade head

# Seed initial data (Admin account)
python -m app.initial_data
```
> **Default Admin**: `admin@aura.com` / `admin123`

### 4. Ignite Server
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*   **API Docs**: http://localhost:8000/docs
*   **Redoc**: http://localhost:8000/redoc

---

## 🛠️ Architecture

### Directory Structure
```
backend/
├── app/
│   ├── api/            # API Route Controllers (v1)
│   ├── core/           # Config, Security, Constants
│   ├── db/             # Database Session & Base
│   ├── models/         # SQLModel/SQLAlchemy Models
│   └── main.py         # Application Entrypoint
├── alembic/            # Database Migrations
├── scripts/            # Utility Scripts (User mgmt, Cleanup)
└── start_modelscope.sh # ModelScope Production Entrypoint
```

### Key Technologies
*   **FastAPI**: High-performance web framework.
*   **SQLAlchemy + Alembic**: ORM and Database Migrations.
*   **Pydantic**: Data validation and serialization.
*   **ModelScope SDK**: Integration for AI capabilities (Qwen-Plus).
*   **Passlib (Bcrypt)**: Secure password hashing.

---

## 🔐 Configuration

Create a `.env` file based on `.env.example`.

**Critical Variables:**
*   `SECRET_KEY`: Security salt for JWT tokens.
*   `MODELSCOPE_API_TOKEN`: Required for AI features.
*   `WECHAT_*`: WeChat Mini Program credentials (use Mock values for local dev).

---

## ☁️ ModelScope Deployment

The backend is designed to run in a ModelScope Space environment.

*   **Entrypoint**: `start_modelscope.sh`
*   **Persistence**: Automatically detects `/mnt/workspace` to persist SQLite database (`vibebuild.db`) across restarts.
*   **Port**: Defaults to `7860` in production.
*   **Static Files**: Serves frontend assets from `static_dist` folder when running in production mode.

---

## 🧪 Testing & Utils

*   `python debug_users.py`: List all registered users.
*   `python scripts/make_superuser.py`: Promote a user to admin.
*   `python scripts/delete_hackathons.py`: Cleanup test data.
