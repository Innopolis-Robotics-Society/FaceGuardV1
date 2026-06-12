"""Events API endpoints."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentUser, CurrentDevice, require_permission
from app.core.database import get_db
from app.core.permissions import Permission
from app.models import AccessEvent, Person, AuditLog
from app.schemas.event import EventCreate, EventResponse, AuditLogResponse

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventResponse])
async def list_events(
    event_type: str | None = None,
    person_id: UUID | None = None,
    device_id: UUID | None = None,
    limit: int = Query(default=100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.VIEW_EVENTS)),
) -> list[AccessEvent]:
    """List access events."""
    query = select(AccessEvent).order_by(AccessEvent.created_at.desc()).limit(limit)

    if event_type:
        query = query.where(AccessEvent.event_type == event_type)
    if person_id:
        query = query.where(AccessEvent.person_id == person_id)
    if device_id:
        query = query.where(AccessEvent.device_id == device_id)

    result = await db.execute(query)
    events = list(result.scalars().all())

    # Add person names
    for event in events:
        if event.person_id:
            person_result = await db.execute(select(Person).where(Person.id == event.person_id))
            person = person_result.scalar_one_or_none()
            event.person_name = person.name if person else None

    return events


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_device: CurrentDevice = Depends(),
) -> AccessEvent:
    """Create an access event from device."""
    event = AccessEvent(
        device_id=current_device.id,
        person_id=event_data.person_id,
        event_type=event_data.event_type,
        confidence=event_data.confidence,
        door_opened=event_data.door_opened,
        photo_path=event_data.photo_path,
        video_path=event_data.video_path,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    # Add person name
    if event.person_id:
        person_result = await db.execute(select(Person).where(Person.id == event.person_id))
        person = person_result.scalar_one_or_none()
        event.person_name = person.name if person else None

    return event


@router.get("/audit", response_model=list[AuditLogResponse])
async def list_audit_logs(
    action: str | None = None,
    user_id: UUID | None = None,
    limit: int = Query(default=100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.VIEW_AUDIT)),
) -> list[AuditLog]:
    """List audit logs."""
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)

    if action:
        query = query.where(AuditLog.action == action)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)

    result = await db.execute(query)
    return list(result.scalars().all())
