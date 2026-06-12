"""System schemas."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    database: str
    timestamp: datetime


class StorageInfo(BaseModel):
    """Storage information."""
    total_gb: float
    used_gb: float
    free_gb: float
    usage_percent: float


class SystemInfo(BaseModel):
    """System information."""
    version: str
    environment: str
    database_connected: bool
    storage: StorageInfo


class BackupCreate(BaseModel):
    """Backup creation request."""
    include_videos: bool = False
    include_events: bool = True


class BackupResponse(BaseModel):
    """Backup response."""
    id: UUID
    filename: str
    file_path: str
    size: int
    checksum: str
    status: str
    created_by: UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}
