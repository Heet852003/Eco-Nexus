"""Devices API tests."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_device(client: AsyncClient, auth_headers: dict) -> None:
    r = await client.post(
        "/api/v1/devices",
        json={"name": "Living Room Thermostat", "device_type": "thermostat", "room": "Living Room"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Living Room Thermostat"
    assert data["device_type"] == "thermostat"


@pytest.mark.asyncio
async def test_list_devices(client: AsyncClient, auth_headers: dict) -> None:
    r = await client.get("/api/v1/devices", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


@pytest.mark.asyncio
async def test_list_devices_unauthorized(client: AsyncClient) -> None:
    r = await client.get("/api/v1/devices")
    assert r.status_code == 401
