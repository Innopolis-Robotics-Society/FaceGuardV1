"""Test device endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models import User, Device


@pytest.mark.asyncio
async def test_list_devices(client: AsyncClient, admin_token: str, test_device: tuple[Device, str]):
    """Test listing devices."""
    device, _ = test_device
    response = await client.get(
        "/api/v1/devices",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_create_device(client: AsyncClient, admin_token: str):
    """Test creating a device."""
    response = await client.post(
        "/api/v1/devices",
        json={
            "name": "New Device",
            "device_code": "new-device-001",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "token" in data
    assert data["device_code"] == "new-device-001"


@pytest.mark.asyncio
async def test_device_heartbeat(client: AsyncClient, test_device: tuple[Device, str]):
    """Test device heartbeat."""
    device, token = test_device
    response = await client.post(
        f"/api/v1/devices/{device.id}/heartbeat",
        json={
            "software_version": "1.0.0",
            "camera_status": "ready",
            "recognition_status": "ready",
            "telemetry": {
                "cpu_usage": 25.5,
                "ram_usage": 50.0,
                "disk_usage": 30.0,
            },
        },
        headers={"X-Device-Token": token},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_create_device_command(client: AsyncClient, admin_token: str, test_device: tuple[Device, str]):
    """Test creating a device command."""
    device, _ = test_device
    response = await client.post(
        f"/api/v1/devices/{device.id}/commands",
        json={
            "command_type": "reboot_device",
            "parameters": {},
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["command_type"] == "reboot_device"
    assert data["status"] == "pending"
