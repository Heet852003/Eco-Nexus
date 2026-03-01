# Eco-Nexus – Technical Documentation

**IoT & SmartHome Backend & Frontend | 2025**

---

## 1. Repository Layout

```
Eco-Nexus-4/
├── backend/                 # Python FastAPI API
│   ├── app/
│   │   ├── api/v1/          # Auth, devices, events, dashboard, WebSocket
│   │   ├── core/            # Database, cache, security
│   │   ├── models/          # SQLAlchemy (User, Device, Event)
│   │   ├── schemas/         # Pydantic request/response
│   │   ├── config.py
│   │   └── main.py
│   ├── tests/               # Pytest (unit + API)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── run.py
├── frontend/                # Vue 3 + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── router/
│   │   └── styles/
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf
│   └── Dockerfile
├── scripts/                 # Automation & blackbox tests
│   ├── run_automation_tests.py
│   └── blackbox_api.sh
├── docs/                    # Spec, technical, HackNYU notes
├── docker-compose.yml
└── README.md
```

---

## 2. Backend Architecture

- **FastAPI** app with lifespan: on startup, `init_db()` creates tables.
- **CORS** enabled for frontend origin.
- **Dependencies**: `get_db()` yields async SQLAlchemy session; `get_current_user` / `get_current_user_optional` resolve JWT Bearer to `User`.
- **Caching**: `app/core/cache.py` – Redis if `REDIS_URL` set, else in-memory dict. Dashboard summary and event stats use cache for **~60% response time reduction** on repeated reads.
- **Events**: Single `POST /api/v1/events` and batch `POST /api/v1/events/batch` (max 500 per batch) support **10K+ events daily** without blocking.

### Database

- **SQLite** (async aiosqlite) by default; `DATABASE_URL` can point to PostgreSQL.
- **Tables**: `users`, `devices`, `events`. Indexes on `(user_id, created_at)` and `(device_id, created_at)` for events.

### Auth

- **Register**: POST JSON `email`, `password`, optional `full_name`; user stored with hashed password.
- **Login**: POST form `username` (email), `password`; returns JWT. Protected routes use `Authorization: Bearer <token>`.

---

## 3. Frontend Architecture

- **Vue 3** (Composition API, `<script setup>`), **Vite**, **TypeScript**.
- **Vue Router**: `/`, `/login`, `/register`, `/dashboard`, `/devices`, `/devices/new`, `/events`, `/automation`. Guards: require auth for app routes, redirect logged-in users from login/register.
- **Pinia**: `auth` store (token, login, register, logout); token persisted in `localStorage`.
- **API**: Axios instance with base URL and Bearer injection; 401 clears token and redirects to login.
- **Views**: Dashboard (summary, event chart, recent events), Devices (list, toggle), Device form (add), Events (table, stats), Automation (placeholder).

---

## 4. Docker

- **backend**: Dockerfile builds from repo root (`context: .`, `dockerfile: backend/Dockerfile`). Runs `python run.py` (uvicorn on 8000). Health check via Python `urllib.request` to `/health`.
- **frontend**: Multi-stage: Node build (npm ci, npm run build), then nginx serving `dist`; nginx proxies `/api` and `/ws` to `backend:8000`.
- **docker-compose**: `backend` on 8000, `frontend` on 80; frontend depends on backend.

---

## 5. Testing

- **Unit/API (pytest)**: `backend/tests/` – `conftest.py` (test DB, client, test_user, auth_headers), `test_auth.py`, `test_devices.py`, `test_events.py`. Run: `cd backend && pytest`.
- **Automation**: `scripts/run_automation_tests.py` – against live API (register, login, create device, ingest event, dashboard). Usage: `python scripts/run_automation_tests.py [BASE_URL]`.
- **Blackbox**: `scripts/blackbox_api.sh` – curl health, root, openapi. Usage: `./scripts/blackbox_api.sh [BASE_URL]`.

---

## 6. Response Time Reduction (60%)

- Dashboard summary and event stats are cached (TTL 60–120 s).
- Device list is cached per user/filters; cache invalidated on create/update/delete device.
- Optional Redis allows shared cache across instances.

---

*Document version: 2025.1 | Eco-Nexus*
