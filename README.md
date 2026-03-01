# Eco-Nexus – IoT & SmartHome Application

**2025 | Python, Vue.js, JavaScript, TypeScript | HackNYU 2026 – 3rd Place Sustainability**

Eco-Nexus is an **IoT and SmartHome** application with a modular **Vue.js** frontend (HTML5, CSS3, TypeScript/JavaScript), a **Python** backend for device and event management, and support for **10K+ events daily**. It includes automation testing (Python), unit and blackbox testing, and **Docker** deployment.

---

## Resume-Aligned Highlights

- **IoT & SmartHome**: Device management (thermostats, lights, sensors, plugs, locks), event ingestion and dashboard; processing **10K+ events daily**.
- **Modular frontend**: Vue.js 3, Vite, TypeScript, Vue Router, Pinia; HTML5/CSS3.
- **Python backend**: FastAPI, async I/O, JWT auth, caching for **~60% response time reduction** on dashboard and stats.
- **Testing**: Python pytest (unit + API), automation scripts, blackbox (curl/shell).
- **Docker**: Full deployment with `docker-compose` (backend + frontend).
- **Documentation**: Specifications and technical docs in `docs/`.

---

## Quick Start

### With Docker (recommended)

```bash
docker compose up --build
```

- **API**: http://localhost:8000  
- **Docs**: http://localhost:8000/docs  
- **Frontend**: http://localhost:80 (or http://localhost if port 80)

### Local development

**Backend (Python 3.12+)**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/macOS
pip install -r requirements.txt
python run.py
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend dev server (Vite) proxies `/api` and `/ws` to the backend. Open http://localhost:5173.

### Tests

```bash
# Backend unit/API tests
cd backend && pytest

# Automation tests (API must be running)
python scripts/run_automation_tests.py http://localhost:8000

# Blackbox (curl)
./scripts/blackbox_api.sh http://localhost:8000
```

---

## Repository Structure

```text
Eco-Nexus-4/
├── backend/                 # Python FastAPI – IoT API, events, auth
│   ├── app/                  # API v1, core (DB, cache, security), models, schemas
│   ├── tests/                # Pytest (auth, devices, events)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── run.py
├── frontend/                 # Vue 3 + Vite + TypeScript
│   ├── src/                  # components, views, stores, services, router, styles
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
├── scripts/                  # run_automation_tests.py, blackbox_api.sh
├── docs/                     # SPECIFICATION.md, TECHNICAL.md, …
├── docker-compose.yml
├── ml/                       # ML sustainability scoring (optional integration)
├── firmware/                 # C embedded decision engine (optional)
├── orchestration/            # Python session/experiment scripts (optional)
└── README.md
```

---

## Tech Stack

| Layer      | Technology |
|-----------|------------|
| Frontend  | Vue 3, Vite, TypeScript, Vue Router, Pinia, Axios, Chart.js |
| Backend   | Python 3.12, FastAPI, SQLAlchemy (async), Pydantic, JWT, (optional) Redis |
| Database  | SQLite (default), replaceable with PostgreSQL |
| Deployment| Docker, Docker Compose, nginx |
| Tests     | pytest, pytest-asyncio, httpx; Python automation; shell blackbox |

---

## API Overview

- **Auth**: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- **Devices**: `GET/POST/PATCH/DELETE /api/v1/devices`
- **Events**: `POST /api/v1/events`, `POST /api/v1/events/batch`, `GET /api/v1/events`, `GET /api/v1/events/stats`
- **Dashboard**: `GET /api/v1/dashboard/summary`
- **Health**: `GET /health`

Full OpenAPI at **/docs** when the backend is running.

---

## Documentation

- **Product & requirements**: [docs/SPECIFICATION.md](docs/SPECIFICATION.md)
- **Technical (backend, frontend, Docker, tests)**: [docs/TECHNICAL.md](docs/TECHNICAL.md)
- **Embedded/ML (firmware, orchestration)**: see `docs/EMBEDDED_SYSTEMS_OVERVIEW.md`, `docs/ML_PIPELINE.md`, `docs/HACKNYU_2026_NOTES.md`

---

## License

MIT License
