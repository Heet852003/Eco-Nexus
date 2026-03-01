# Eco-Nexus – Product & Technical Specification

**IoT & SmartHome Application | 2025 | HackNYU 2026 – 3rd Place Sustainability**

---

## 1. Overview

Eco-Nexus is an **IoT and SmartHome** application that provides:

- **Device management**: Register and control smart devices (thermostats, lights, sensors, plugs, locks).
- **Event processing**: Ingest and query device events at scale (**10K+ events daily**).
- **Real-time dashboard**: Cached aggregates and live updates for fast response (**60% response time reduction**).
- **Modular frontend**: Vue.js, HTML5, CSS3, TypeScript/JavaScript.
- **Python backend**: FastAPI, async I/O, SQLite/optional PostgreSQL, optional Redis cache.

---

## 2. User Roles & Flows

- **End user**: Register, login, add devices, view dashboard and events, (future) define automation rules.
- **System**: Ingest events from devices (single or batch), serve dashboard and device list with caching.

---

## 3. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| F1 | User registration and login (JWT) | Must |
| F2 | CRUD for devices (name, type, room, online status) | Must |
| F3 | Ingest single event (device_id, type, payload) | Must |
| F4 | Batch ingest events (up to 500 per request) for 10K+ daily throughput | Must |
| F5 | List events with filters (device, type, since) and pagination | Must |
| F6 | Dashboard summary (device count, online count, events today) | Must |
| F7 | Event stats (total, today, by type) | Must |
| F8 | Optional WebSocket for real-time push | Should |
| F9 | Automation rules (UI placeholder, API extendable) | Could |

---

## 4. Non-Functional Requirements

- **Performance**: Dashboard and list endpoints use caching to reduce response time (target **~60% improvement** vs uncached).
- **Scalability**: Event ingestion supports batch API for **10K+ events per day**.
- **Deployment**: Docker Compose for backend and frontend; backend health check.
- **Testing**: Unit tests (pytest), automation script (Python), blackbox (curl/shell).
- **Documentation**: This specification, technical docs, API (OpenAPI at `/docs`).

---

## 5. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3, Vite, TypeScript, Vue Router, Pinia, Axios, Chart.js |
| Backend | Python 3.12, FastAPI, SQLAlchemy (async), Pydantic |
| Auth | JWT (python-jose), bcrypt |
| Cache | Redis (optional), in-memory fallback |
| DB | SQLite (default), replaceable with PostgreSQL |
| Deployment | Docker, Docker Compose, nginx (frontend) |
| Tests | pytest, pytest-asyncio, httpx; Python automation script; shell blackbox |

---

## 6. API Summary

- `POST /api/v1/auth/register` – Register.
- `POST /api/v1/auth/login` – Login (form), returns JWT.
- `GET /api/v1/auth/me` – Current user (Bearer).
- `GET/POST/PATCH/DELETE /api/v1/devices` – Devices CRUD.
- `POST /api/v1/events` – Ingest one event.
- `POST /api/v1/events/batch` – Ingest many events (202 Accepted).
- `GET /api/v1/events` – List events (query params).
- `GET /api/v1/events/stats` – Event statistics.
- `GET /api/v1/dashboard/summary` – Dashboard aggregates.
- `GET /health` – Health check.

---

## 7. Out of Scope (Current Release)

- Mobile app, OAuth providers, billing.
- Full automation engine (only placeholder and API extension point).

---

*Document version: 2025.1 | Eco-Nexus IoT & SmartHome*
