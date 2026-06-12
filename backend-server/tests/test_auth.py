"""Test authentication endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


@pytest.mark.asyncio
async def test_register_first_admin(client: AsyncClient):
    """Test registering first administrator."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "admin",
            "password": "admin123",
            "role": "admin",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "admin"
    assert data["role"] == "admin"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_register_when_users_exist(client: AsyncClient, admin_user: User):
    """Test that registration is disabled when users exist."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "another",
            "password": "password123",
            "role": "admin",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, admin_user: User):
    """Test successful login."""
    response = await client.post(
        "/api/v1/auth/login",
        params={"username": "admin", "password": "admin123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, admin_user: User):
    """Test login with wrong password."""
    response = await client.post(
        "/api/v1/auth/login",
        params={"username": "admin", "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test login with nonexistent user."""
    response = await client.post(
        "/api/v1/auth/login",
        params={"username": "nonexistent", "password": "password"},
    )
    assert response.status_code == 401
