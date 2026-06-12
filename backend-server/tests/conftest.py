"""Test configuration and fixtures."""
from __future__ import annotations

import asyncio
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_device_token, hash_device_token
from app.main import app
from app.models import User, Device, Person
from app.core.permissions import UserRole

# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def override_get_db(db_session: AsyncSession):
    """Override database dependency."""
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
async def client(override_get_db) -> AsyncGenerator[AsyncClient, None]:
    """Create test client."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Create admin user."""
    user = User(
        username="admin",
        password_hash=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def operator_user(db_session: AsyncSession) -> User:
    """Create operator user."""
    user = User(
        username="operator",
        password_hash=get_password_hash("operator123"),
        role=UserRole.OPERATOR,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def admin_token(client: AsyncClient, admin_user: User) -> str:
    """Get admin JWT token."""
    response = await client.post(
        "/api/v1/auth/login",
        params={"username": "admin", "password": "admin123"},
    )
    return response.json()["access_token"]


@pytest.fixture
async def operator_token(client: AsyncClient, operator_user: User) -> str:
    """Get operator JWT token."""
    response = await client.post(
        "/api/v1/auth/login",
        params={"username": "operator", "password": "operator123"},
    )
    return response.json()["access_token"]


@pytest.fixture
async def test_device(db_session: AsyncSession) -> tuple[Device, str]:
    """Create test device and return device with token."""
    token = create_device_token()
    device = Device(
        name="Test Device",
        device_code="test-device-001",
        device_token_hash=hash_device_token(token),
        status="offline",
    )
    db_session.add(device)
    await db_session.commit()
    await db_session.refresh(device)
    return device, f"{device.device_code}:{token}"


@pytest.fixture
async def test_person(db_session: AsyncSession, admin_user: User) -> Person:
    """Create test person."""
    person = Person(
        name="Test Person",
        description="Test description",
        access_enabled=True,
        created_by=admin_user.id,
    )
    db_session.add(person)
    await db_session.commit()
    await db_session.refresh(person)
    return person
