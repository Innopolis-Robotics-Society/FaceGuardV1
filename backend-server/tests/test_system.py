"""Test system endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint."""
    response = await client.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_readiness_check(client: AsyncClient):
    """Test readiness check."""
    response = await client.get("/api/v1/system/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"


@pytest.mark.asyncio
async def test_system_info_requires_auth(client: AsyncClient):
    """Test that system info requires authentication."""
    response = await client.get("/api/v1/system/info")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_system_info_with_auth(client: AsyncClient, admin_token: str):
    """Test getting system info with authentication."""
    response = await client.get(
        "/api/v1/system/info",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert "environment" in data
    assert "storage" in data
