"""Device management API endpoints."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentUser, CurrentDevice, require_permission
from app.core.database import get_db
from app.core.permissions import Permission
from app.core.security import create_device_token, hash_device_token
from app.models import Device, DeviceCommand, Telemetry
from app.schemas.device import (
    DeviceCreate,
    DeviceResponse,
    DeviceToken,
    CommandCreate,
    CommandResponse,
    TelemetryCreate,
    TelemetryResponse,
    HeartbeatRequest,
)

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("", response_model=list[DeviceResponse])
async def list_devices(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> list[Device]:
    """List all devices."""
    result = await db.execute(select(Device).order_by(Device.created_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=DeviceToken, status_code=status.HTTP_201_CREATED)
async def create_device(
    device_data: DeviceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.MANAGE_DEVICES)),
) -> dict:
    """Create a new device and return its token."""
    # Check if device code exists
    result = await db.execute(select(Device).where(Device.device_code == device_data.device_code))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device code already exists",
        )

    # Generate device token
    token = create_device_token()
    token_hash = hash_device_token(token)

    device = Device(
        name=device_data.name,
        device_code=device_data.device_code,
        device_token_hash=token_hash,
        status="offline",
    )
    db.add(device)
    await db.commit()
    await db.refresh(device)

    return {
        "device_id": device.id,
        "device_code": device.device_code,
        "token": f"{device.device_code}:{token}",
    }


@router.post("/{device_id}/heartbeat")
async def device_heartbeat(
    device_id: UUID,
    heartbeat: HeartbeatRequest,
    db: AsyncSession = Depends(get_db),
    current_device: CurrentDevice = Depends(),
) -> dict:
    """Receive heartbeat from device."""
    if current_device.id != device_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Device ID mismatch")

    # Update device status
    current_device.status = "online"
    current_device.last_seen_at = datetime.now(timezone.utc)
    if heartbeat.software_version:
        current_device.software_version = heartbeat.software_version
    if heartbeat.camera_status:
        current_device.camera_status = heartbeat.camera_status
    if heartbeat.recognition_status:
        current_device.recognition_status = heartbeat.recognition_status

    # Save telemetry if provided
    if heartbeat.telemetry:
        telemetry = Telemetry(
            device_id=device_id,
            cpu_usage=heartbeat.telemetry.cpu_usage,
            cpu_temperature=heartbeat.telemetry.cpu_temperature,
            ram_usage=heartbeat.telemetry.ram_usage,
            disk_usage=heartbeat.telemetry.disk_usage,
            uptime=heartbeat.telemetry.uptime,
            camera_fps=heartbeat.telemetry.camera_fps,
            network_status=heartbeat.telemetry.network_status,
        )
        db.add(telemetry)

    await db.commit()

    # Check for pending commands
    result = await db.execute(
        select(DeviceCommand)
        .where(DeviceCommand.device_id == device_id, DeviceCommand.status == "pending")
        .order_by(DeviceCommand.created_at)
        .limit(10)
    )
    pending_commands = list(result.scalars().all())

    # Mark as sent
    for cmd in pending_commands:
        cmd.status = "sent"
    await db.commit()

    return {
        "status": "ok",
        "commands": [
            {
                "id": str(cmd.id),
                "command_type": cmd.command_type,
                "parameters": cmd.parameters,
            }
            for cmd in pending_commands
        ],
    }


@router.post("/{device_id}/commands", response_model=CommandResponse, status_code=status.HTTP_201_CREATED)
async def create_device_command(
    device_id: UUID,
    command_data: CommandCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.SEND_COMMANDS)),
) -> DeviceCommand:
    """Create a command for a device."""
    # Verify device exists
    result = await db.execute(select(Device).where(Device.id == device_id))
    device = result.scalar_one_or_none()
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    command = DeviceCommand(
        device_id=device_id,
        command_type=command_data.command_type,
        parameters=command_data.parameters,
        status="pending",
        created_by=current_user.id,
    )
    db.add(command)
    await db.commit()
    await db.refresh(command)
    return command


@router.post("/{device_id}/commands/{command_id}/result")
async def update_command_result(
    device_id: UUID,
    command_id: UUID,
    status: str,
    result: dict | None = None,
    error_message: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_device: CurrentDevice = Depends(),
) -> dict:
    """Update command result from device."""
    if current_device.id != device_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Device ID mismatch")

    result_obj = await db.execute(
        select(DeviceCommand).where(DeviceCommand.id == command_id, DeviceCommand.device_id == device_id)
    )
    command = result_obj.scalar_one_or_none()
    if command is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Command not found")

    command.status = status
    command.result = result
    command.error_message = error_message

    if status == "running" and command.started_at is None:
        command.started_at = datetime.now(timezone.utc)
    elif status in ("completed", "failed"):
        command.completed_at = datetime.now(timezone.utc)

    await db.commit()
    return {"status": "ok"}


@router.get("/{device_id}/telemetry", response_model=list[TelemetryResponse])
async def get_device_telemetry(
    device_id: UUID,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.VIEW_DEVICES)),
) -> list[Telemetry]:
    """Get device telemetry."""
    result = await db.execute(
        select(Telemetry)
        .where(Telemetry.device_id == device_id)
        .order_by(Telemetry.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
