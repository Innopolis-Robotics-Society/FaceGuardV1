"""Event schemas."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    """Event creation schema."""
    person_id: UUID | None = None
    event_type: str = Field(..., min_length=1, max_length=50)
    confidence: float | None = None
    door_opened: bool = False
    photo_path: str | None = None
    video_path: str | None = None


class EventResponse(EventCreate):
    """Event response schema."""
    id: UUID
    device_id: UUID
    created_at: datetime
    person_name: str | None = None

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    """Audit log response schema."""
    id: UUID
    user_id: UUID | None
    username: str | None = None
    action: str
    entity_type: str | None
    entity_id: str | None
    old_value: dict | None
    new_value: dict | None
    ip_address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
