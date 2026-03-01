"""Pytest fixtures for Eco-Nexus API tests."""
import asyncio
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.core.database import get_db, Base
from app.models.user import User
from app.core.security import get_password_hash

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_eco_nexus.db"
engine = create_async_engine(TEST_DATABASE_URL, echo=False)
AsyncTestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_session():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncTestSession() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_session):
    async def _get_db():
        yield db_session
    app.dependency_overrides[get_db] = _get_db
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session):
    user = User(
        email="test@eco-nexus.dev",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User",
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def auth_headers(client, test_user):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "testpass123"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return {"Authorization": "Bearer " + token}
