# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Aura** — an AI-empowered hackathon platform. FastAPI + SQLModel backend, React + Vite + TypeScript frontend, SQLite database.

## Common Commands

### Backend
```bash
cd backend
.venv/bin/python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> **Always use `--reload`** in dev — without it, uvicorn won't pick up code changes and you'll get stale-code errors.

**Database migrations:**
```bash
cd backend
.venv/bin/python3 -m alembic upgrade head
```

**Seed data:**
```bash
cd backend
.venv/bin/python3 scripts/seed_hackathons.py    # 24 hackathons + users + submissions
.venv/bin/python3 -m app.initial_data            # Default admin (admin@aura.com / admin123)
```

### Frontend
```bash
cd frontend
npm run dev       # Vite dev server at :5173, proxies /api to :8000
npm run build     # tsc -b && vite build
npm run lint      # ESLint on .ts/.tsx
```

### Docker (combined deployment)
```bash
docker-compose up    # Backend :8000, Frontend :80
```

## Architecture

### Database Location
SQLite (dev) database is at `backend/data/vibebuild.db`. The path is resolved via `__file__` in `config.py`, so it works regardless of CWD. PostgreSQL is used in production (set `DATABASE_URL` env var).

### Dual-Track Data Architecture
- **Track A — Master Projects** (`master_project` + `project_collaborator`): Persistent global portfolio, served at `/api/v1/projects`
- **Track B — Submissions** (`submission` + `team`): Event-specific work with `hackathon_id` (required), `team_id` (nullable for individual hackathons), served at `/api/v1/submissions`
- A `submission` optionally links to a `master_project` via `project_id` FK

### Section-Based Content System
Hackathon detail content lives in the `section` table, NOT as hackathon columns. Sections have a `section_type` enum (MARKDOWN, SCHEDULES, PRIZES, JUDGING_CRITERIA) and child tables (`schedule`, `prize`, `judgingcriteria`, `partner`) that CASCADE on section/hackathon deletion.

### Enum Storage
All `str`-Enum fields use `sa_type=String` — stored and serialized as **lowercase values** (e.g. `'ongoing'`, `'draft'`). DB values match API JSON responses.

### Backend Structure
- `backend/app/api/v1/endpoints/` — 18 endpoint modules, aggregated in `api.py`
- `backend/app/api/deps.py` — Auth dependency injection: `get_current_user()`, `get_current_active_superuser()`, `get_current_organizer()`
- `backend/app/models/` — 20 SQLModel table definitions
- `backend/app/core/config.py` — Settings from env vars, DB URL logic
- `backend/app/db/session.py` — Engine, `init_db()`, `get_session()` generator

### Frontend Structure
- `frontend/src/pages/` — Route-level components (Layout wraps all routes via Outlet)
- `frontend/src/store/useUserStore.ts` — Zustand store for auth/user state with localStorage persistence
- `frontend/src/types/hackathon.ts` — Shared TypeScript types mirroring backend schemas
- `frontend/src/utils/hackathon.ts` — Data transformation (e.g. `toHackathonCardData()`)
- `frontend/src/utils/constants.ts` — Status mappings, tag colors, format configs
- `frontend/src/components/ui/` — shadcn/Radix UI primitives

### Auth Flow
- JWT tokens (8-day expiry) stored in localStorage as `token`
- Layout.tsx initializes `isLoggedIn` synchronously from localStorage (prevents race condition)
- Supports: email+password, email OTP, WeChat QR, GitHub OAuth
- Role-based permissions via `HackathonOrganizer` table (OWNER/ADMIN roles)

### API Proxy
Vite dev server proxies `/api/*` and `/static/*` to `http://localhost:8000`. No centralized API client — components use axios directly.

### Frontend Design System
- Tailwind CSS with custom tokens: `brand` (caramel), `void` (deep bg), `surface` (cards), `ink` (text)
- All border-radius set to 0 (brutalist aesthetic)
- Fonts: Inter (sans), JetBrains Mono (mono)
- shadcn/Radix for UI primitives, Lucide for icons, Framer Motion for animations

### Alembic Migration Notes
- Current head: `h8i9j0k1l2m3` (softdelete_uniqueness_scoring)
- Running full migration chain from scratch on SQLite fails at `c3d4e5f6a7b8`. Use `SQLModel.metadata.create_all()` for fresh DBs instead.

## Routes (Frontend)

| Path | Page |
|------|------|
| `/` | HomePage |
| `/events` | EventsPage |
| `/events/:id` | EventDetailPage |
| `/profile` | ProfilePage |
| `/create` | CreateHackathonPage |
| `/admin` | AdminPage |
| `/notifications` | NotificationCenterPage |
| `/community` | CommunityPage |

## API Prefix

All backend endpoints are under `/api/v1/`. Swagger docs at `/docs`, health check at `/health`.
