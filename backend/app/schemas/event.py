from datetime import datetime
from pydantic import BaseModel
from typing import Any


class EventIngest(BaseModel):
    device_id: int
    event_type: str  # state_change, sensor_reading, alert
    payload: dict[str, Any] | None = None


class EventIngestBatch(BaseModel):
    events: list[EventIngest]


class EventResponse(BaseModel):
    id: int
    device_id: int
    user_id: int
    event_type: str
    payload: dict[str, Any] | None
    created_at: datetime

    class Config:
        from_attributes = True


class EventStats(BaseModel):
    total_events: int
    events_today: int
    by_type: dict[str, int]
