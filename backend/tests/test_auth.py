"""Auth API tests."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register(client: AsyncClient) -> None:
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": "new@eco.dev", "password": "secret123", "full_name": "New User"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == "new@eco.dev"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate(client: AsyncClient, test_user) -> None:
    r = await client.post(
        "/api/v1/auth/register",
        json={"email": test_user.email, "password": "secret123"},
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_login(client: AsyncClient, test_user) -> None:
    r = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "testpass123"},
    )
    assert r.status_code == 200
    assert "access_token" in r.json()


@pytest.mark.asyncio
async def test_me(client: AsyncClient, auth_headers: dict) -> None:
    r = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == "test@eco-nexus.dev"
