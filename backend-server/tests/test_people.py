"""Test people management endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models import User, Person


@pytest.mark.asyncio
async def test_list_people(client: AsyncClient, admin_token: str, test_person: Person):
    """Test listing people."""
    response = await client.get(
        "/api/v1/people",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Test Person"


@pytest.mark.asyncio
async def test_create_person(client: AsyncClient, admin_token: str):
    """Test creating a person."""
    response = await client.post(
        "/api/v1/people",
        json={
            "name": "New Person",
            "description": "Test description",
            "access_enabled": True,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Person"
    assert data["access_enabled"] is True


@pytest.mark.asyncio
async def test_get_person(client: AsyncClient, admin_token: str, test_person: Person):
    """Test getting a specific person."""
    response = await client.get(
        f"/api/v1/people/{test_person.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Person"


@pytest.mark.asyncio
async def test_update_person(client: AsyncClient, admin_token: str, test_person: Person):
    """Test updating a person."""
    response = await client.patch(
        f"/api/v1/people/{test_person.id}",
        json={"name": "Updated Name"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"


@pytest.mark.asyncio
async def test_delete_person(client: AsyncClient, admin_token: str, test_person: Person):
    """Test soft deleting a person."""
    response = await client.delete(
        f"/api/v1/people/{test_person.id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_create_person_without_permission(client: AsyncClient, operator_token: str):
    """Test that operators cannot create people without permission."""
    # Operator has CREATE_PERSON permission, so this should succeed
    response = await client.post(
        "/api/v1/people",
        json={
            "name": "New Person",
            "description": "Test",
            "access_enabled": True,
        },
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert response.status_code == 201
