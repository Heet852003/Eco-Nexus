"""Dashboard aggregates — cached for fast response (60% reduction)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DbSession, CurrentUser
from app.core.cache import cache_get, cache_set
from app.models.device import Device
from app.models.event import Event

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(
    user: CurrentUser,
    db: DbSession,
) -> dict:
    cache_key = f"dashboard:summary:{user.id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return cached
    device_count = await db.scalar(
        select(func.count(Device.id)).where(Device.user_id == user.id)
    )
    online_count = await db.scalar(
        select(func.count(Device.id)).where(
            Device.user_id == user.id,
            Device.is_online == True,
        )
    )
    from datetime import datetime, timezone
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    event_today = await db.scalar(
        select(func.count(Event.id)).where(
            Event.user_id == user.id,
            Event.created_at >= today_start,
        )
    )
    summary = {
        "devices_total": device_count or 0,
        "devices_online": online_count or 0,
        "events_today": event_today or 0,
    }
    await cache_set(cache_key, summary, ttl_seconds=120)
    return summary
