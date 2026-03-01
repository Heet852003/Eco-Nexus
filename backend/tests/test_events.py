"""Unit/API tests: events (10K+ daily pipeline)."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ingest_event(client: AsyncClient, auth_headers: dict) -> None:
    # Create device first
    dev = await client.post(
        "/api/v1/devices",
        json={"name": "Sensor", "device_type": "sensor"},
        headers=auth_headers,
    )
    assert dev.status_code == 201
    device_id = dev.json()["id"]
    r = await client.post(
        "/api/v1/events",
        json={"device_id": device_id, "event_type": "sensor_reading", "payload": {"temp": 22.5}},
        headers=auth_headers,
    )
    assert r.status_code == 201
    assert r.json()["event_type"] == "sensor_reading"


@pytest.mark.asyncio
async def test_ingest_batch(client: AsyncClient, auth_headers: dict) -> None:
    dev = await client.post(
        "/api/v1/devices",
        json={"name": "Bulk", "device_type": "sensor"},
        headers=auth_headers,
    )
    device_id = dev.json()["id"]
    events = [
        {"device_id": device_id, "event_type": "state_change", "payload": {"i": i}}
        for i in range(10)
    ]
    r = await client.post(
        "/api/v1/events/batch",
        json={"events": events},
        headers=auth_headers,
    )
    assert r.status_code == 202
    data = r.json()
    assert data["accepted"] == 10
    assert data["created"] == 10


@pytest.mark.asyncio
async def test_event_stats(client: AsyncClient, auth_headers: dict) -> None:
    r = await client.get("/api/v1/events/stats", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert "total_events" in data
    assert "events_today" in data
    assert "by_type" in data
