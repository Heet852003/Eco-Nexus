"""Eco-Nexus IoT & SmartHome API — FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.core.database import init_db
from app.api.deps import get_db
from app.api.v1 import auth, devices, events, dashboard, ws

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    # shutdown: close pools etc. if needed


app = FastAPI(
    title=settings.app_name,
    description="IoT & SmartHome API — devices, events (10K+ daily), dashboard. HackNYU 2026.",
    version="2025.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1
prefix = settings.api_v1_prefix
app.include_router(auth.router, prefix=prefix)
app.include_router(devices.router, prefix=prefix)
app.include_router(events.router, prefix=prefix)
app.include_router(dashboard.router, prefix=prefix)
app.include_router(ws.router, prefix=prefix)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "eco-nexus-api"}


@app.get("/")
async def root() -> dict:
    return {
        "name": settings.app_name,
        "docs": "/docs",
        "health": "/health",
    }
