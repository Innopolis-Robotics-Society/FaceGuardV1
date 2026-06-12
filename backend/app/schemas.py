from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    device_id: str
    version: str
    platform: str
    camera_ready: bool
    camera_simulated: bool
    recognition_ready: bool
    hardware_mode: str
    timestamp: datetime


class TelemetryResponse(BaseModel):
    device_id: str
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float
    disk_percent: float
    disk_free_gb: float
    uptime_seconds: float
    cpu_temperature_c: float | None = None
    camera_ready: bool
    camera_simulated: bool
    camera_fps: float
    recognition_ready: bool
    model_people_count: int


class DoorOpenRequest(BaseModel):
    duration_seconds: float | None = Field(default=None, ge=0.1, le=30)
    reason: str = Field(default="manual", max_length=100)


class CaptureRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)
    count: int = Field(default=10, ge=1, le=100)
    interval_seconds: float = Field(default=0.35, ge=0.05, le=5)
    strict_face_detection: bool = True


class TrainResponse(BaseModel):
    trained: bool
    people_count: int
    image_count: int
    skipped_count: int
    model_path: str
    labels_path: str


class CommandRequest(BaseModel):
    command: Literal[
        "open_door",
        "reload_faces",
        "train_model",
        "capture_photos",
        "collect_logs",
        "restart_agent",
        "reboot_device",
    ]
    parameters: dict[str, Any] = Field(default_factory=dict)


class EventResponse(BaseModel):
    id: str
    event_type: str
    person_id: str | None = None
    person_name: str | None = None
    recognition_distance: float | None = None
    photo_path: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    synced: bool
