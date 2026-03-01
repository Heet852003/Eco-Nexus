"""Event ingestion and listing — 10K+ events daily."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DbSession, CurrentUser
from app.core.cache import cache_get, cache_set
from app.models.event import Event
from app.models.device import Device
from app.schemas.event import EventIngest, EventIngestBatch, EventResponse, EventStats

router = APIRouter(prefix="/events", tags=["events"])


def _event_response(e: Event) -> EventResponse:
    return EventResponse(
        id=e.id,
        device_id=e.device_id,
        user_id=e.user_id,
        event_type=e.event_type,
        payload=e.payload or {},
        created_at=e.created_at,
    )


@router.post("", response_model=EventResponse, status_code=201)
async def ingest_event(
    data: EventIngest,
    user: CurrentUser,
    db: DbSession,
) -> Event:
    result = await db.execute(
        select(Device).where(Device.id == data.device_id, Device.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Device not found")
    event = Event(
        device_id=data.device_id,
        user_id=user.id,
        event_type=data.event_type,
        payload=data.payload,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return _event_response(event)


@router.post("/batch", status_code=202)
async def ingest_batch(
    data: EventIngestBatch,
    user: CurrentUser,
    db: DbSession,
) -> dict:
    """Batch ingest for high throughput (10K+ events daily)."""
    if len(data.events) > 500:
        raise HTTPException(status_code=400, detail="Max 500 events per batch")
    device_ids = {e.device_id for e in data.events}
    result = await db.execute(
        select(Device.id).where(Device.user_id == user.id, Device.id.in_(device_ids))
    )
    allowed_ids = {r[0] for r in result.fetchall()}
    created = 0
    for e in data.events:
        if e.device_id not in allowed_ids:
            continue
        event = Event(
            device_id=e.device_id,
            user_id=user.id,
            event_type=e.event_type,
            payload=e.payload,
        )
        db.add(event)
        created += 1
    await db.flush()
    return {"accepted": len(data.events), "created": created}


@router.get("", response_model=list[EventResponse])
async def list_events(
    user: CurrentUser,
    db: DbSession,
    device_id: int | None = Query(None),
    event_type: str | None = Query(None),
    since: datetime | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> list[EventResponse]:
    q = select(Event).where(Event.user_id == user.id)
    if device_id is not None:
        q = q.where(Event.device_id == device_id)
    if event_type:
        q = q.where(Event.event_type == event_type)
    if since:
        q = q.where(Event.created_at >= since)
    q = q.offset(skip).limit(limit).order_by(Event.created_at.desc())
    result = await db.execute(q)
    events = result.scalars().all()
    return [_event_response(e) for e in events]


@router.get("/stats", response_model=EventStats)
async def event_stats(
    user: CurrentUser,
    db: DbSession,
) -> EventStats:
    cache_key = f"events:stats:{user.id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return EventStats(**cached)
    total = await db.scalar(select(func.count(Event.id)).where(Event.user_id == user.id))
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today = await db.scalar(
        select(func.count(Event.id)).where(
            Event.user_id == user.id,
            Event.created_at >= today_start,
        )
    )
    by_type_result = await db.execute(
        select(Event.event_type, func.count(Event.id))
        .where(Event.user_id == user.id)
        .group_by(Event.event_type)
    )
    by_type = {row[0]: row[1] for row in by_type_result.fetchall()}
    stats = EventStats(total_events=total or 0, events_today=today or 0, by_type=by_type or {})
    await cache_set(cache_key, stats.model_dump(), ttl_seconds=60)
    return stats
