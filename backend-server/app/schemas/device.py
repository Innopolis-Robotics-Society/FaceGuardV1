"""Device schemas."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class DeviceBase(BaseModel):
    """Base device schema."""
    name: str = Field(..., min_length=1, max_length=200)
    device_code: str = Field(..., min_length=1, max_length=100)


class DeviceCreate(DeviceBase):
    """Device creation schema."""
    pass


class DeviceResponse(DeviceBase):
    """Device response schema."""
    id: UUID
    status: str
    ip_address: str | None
    last_seen_at: datetime | None
    software_version: str | None
    camera_status: str | None
    recognition_status: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DeviceToken(BaseModel):
    """Device token response."""
    device_id: UUID
    device_code: str
    token: str


class TelemetryCreate(BaseModel):
    """Telemetry creation schema."""
    cpu_usage: float | None = None
    cpu_temperature: float | None = None
    ram_usage: float | None = None
    disk_usage: float | None = None
    uptime: float | None = None
    camera_fps: float | None = None
    network_status: str | None = None


class TelemetryResponse(TelemetryCreate):
    """Telemetry response schema."""
    id: UUID
    device_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class CommandCreate(BaseModel):
    """Command creation schema."""
    command_type: str = Field(..., min_length=1, max_length=100)
    parameters: dict | None = None


class CommandResponse(BaseModel):
    """Command response schema."""
    id: UUID
    device_id: UUID
    command_type: str
    parameters: dict | None
    status: str
    created_by: UUID | None
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    result: dict | None
    error_message: str | None

    model_config = {"from_attributes": True}


class HeartbeatRequest(BaseModel):
    """Device heartbeat request."""
    software_version: str | None = None
    camera_status: str | None = None
    recognition_status: str | None = None
    telemetry: TelemetryCreate | None = None
