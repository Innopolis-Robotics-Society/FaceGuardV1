from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.models import AccessEvent, Device, Person
from app.schemas import AccessEventCreate, AccessEventResponse

router = APIRouter(
    prefix="/events",
    tags=["Events"],
)


@router.get("/", response_model=List[AccessEventResponse])
def list_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    device_id: Optional[UUID] = Query(None, description="Фильтр по устройству"),
    person_id: Optional[UUID] = Query(None, description="Фильтр по человеку"),
    event_type: Optional[str] = Query(None, description="Фильтр по типу: recognized, unknown, access_denied, manual_open"),
    days: int = Query(7, ge=1, le=365, description="Количество дней истории"),
    db: Session = Depends(get_db),
):
    """
    Получить лог событий распознавания с фильтрацией.

    Типы событий:
    - recognized: Человек распознан успешно
    - unknown: Неизвестный человек
    - access_denied: Доступ запрещен (человек распознан, но access_enabled=false)
    - manual_open: Ручное открытие двери из админ-панели
    - door_opened: Дверь открыта (автоматически или вручную)
    - recognition_error: Ошибка распознавания
    """
    query = db.query(AccessEvent)

    # Фильтр по дате
    since = datetime.utcnow() - timedelta(days=days)
    query = query.filter(AccessEvent.created_at >= since)

    # Фильтры
    if device_id:
        query = query.filter(AccessEvent.device_id == device_id)
    if person_id:
        query = query.filter(AccessEvent.person_id == person_id)
    if event_type:
        query = query.filter(AccessEvent.event_type == event_type)

    # Получение событий
    events = query.order_by(AccessEvent.created_at.desc()).offset(skip).limit(limit).all()

    return events


@router.get("/stats/summary")
def get_events_summary(
    days: int = Query(7, ge=1, le=365),
    device_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Получить статистику событий за период.

    Возвращает:
    - Общее количество событий
    - Количество по типам
    - Количество уникальных людей
    - Среднее confidence для распознанных
    """
    from sqlalchemy import func

    since = datetime.utcnow() - timedelta(days=days)

    query = db.query(AccessEvent).filter(AccessEvent.created_at >= since)

    if device_id:
        query = query.filter(AccessEvent.device_id == device_id)

    # Общее количество
    total_events = query.count()

    # Количество по типам
    event_types = (
        db.query(
            AccessEvent.event_type,
            func.count(AccessEvent.id).label("count"),
        )
        .filter(AccessEvent.created_at >= since)
        .group_by(AccessEvent.event_type)
        .all()
    )

    types_dict = {event_type: count for event_type, count in event_types}

    # Уникальные люди
    unique_people = (
        db.query(func.count(func.distinct(AccessEvent.person_id)))
        .filter(
            AccessEvent.created_at >= since,
            AccessEvent.person_id.isnot(None),
        )
        .scalar()
    )

    # Среднее confidence для recognized
    avg_confidence = (
        db.query(func.avg(AccessEvent.confidence))
        .filter(
            AccessEvent.created_at >= since,
            AccessEvent.event_type == "recognized",
            AccessEvent.confidence.isnot(None),
        )
        .scalar()
    )

    # Количество открытий двери
    doors_opened = (
        db.query(func.count(AccessEvent.id))
        .filter(
            AccessEvent.created_at >= since,
            AccessEvent.door_opened == True,
        )
        .scalar()
    )

    return {
        "period_days": days,
        "total_events": total_events,
        "events_by_type": types_dict,
        "unique_people_recognized": unique_people or 0,
        "average_confidence": round(avg_confidence, 2) if avg_confidence else None,
        "total_doors_opened": doors_opened or 0,
    }


@router.delete("/cleanup")
def cleanup_old_events(
    days: int = Query(30, ge=0, le=365, description="Удалить события старше N дней (0 = все события)"),
    event_types: Optional[List[str]] = Query(None, description="Типы событий для удаления"),
    db: Session = Depends(get_db),
):
    """
    Очистка старых событий для освобождения места.

    По умолчанию удаляет все события старше 30 дней.
    Можно указать конкретные типы событий для удаления.

    Если days=0, удаляет ВСЕ события.

    Рекомендуется запускать автоматически по расписанию.
    """
    if days == 0:
        # Удалить все события
        query = db.query(AccessEvent)
    else:
        # Удалить события старше указанного количества дней
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = db.query(AccessEvent).filter(AccessEvent.created_at < cutoff_date)

    if event_types:
        query = query.filter(AccessEvent.event_type.in_(event_types))

    # Получение событий для удаления файлов
    events_to_delete = query.all()

    # Удаление файлов
    deleted_files = 0
    for event in events_to_delete:
        if event.photo_path:
            photo_path = Path(settings.data_dir) / event.photo_path
            if photo_path.exists():
                photo_path.unlink()
                deleted_files += 1

        if event.video_path:
            video_path = Path(settings.data_dir) / event.video_path
            if video_path.exists():
                video_path.unlink()
                deleted_files += 1

    # Удаление записей из БД
    deleted_count = query.delete()
    db.commit()

    return {
        "deleted_events": deleted_count,
        "deleted_files": deleted_files,
        "cutoff_date": "all" if days == 0 else cutoff_date.isoformat(),
    }


@router.get("/{event_id}", response_model=AccessEventResponse)
def get_event(
    event_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Получить детали конкретного события.
    """
    event = db.query(AccessEvent).filter(AccessEvent.id == event_id).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    return event


@router.post("/", response_model=AccessEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_data: AccessEventCreate,
    db: Session = Depends(get_db),
):
    """
    Создать событие распознавания.
    Вызывается Raspberry Pi агентом при каждом событии.

    Примеры событий:
    1. Распознан знакомый человек:
       - event_type: "recognized"
       - person_id: UUID человека
       - confidence: 45.2 (чем ниже, тем лучше совпадение)
       - door_opened: true

    2. Неизвестный человек:
       - event_type: "unknown"
       - person_id: null
       - confidence: null
       - photo_path: путь к снапшоту

    3. Доступ запрещен:
       - event_type: "access_denied"
       - person_id: UUID человека
       - confidence: 45.2
       - door_opened: false

    4. Ручное открытие:
       - event_type: "manual_open"
       - person_id: null
       - door_opened: true
    """
    # Проверка существования устройства
    device = db.query(Device).filter(Device.id == event_data.device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # Проверка существования человека (если указан)
    if event_data.person_id:
        person = db.query(Person).filter(Person.id == event_data.person_id).first()
        if not person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Person not found",
            )

    # Создание события
    event = AccessEvent(
        device_id=event_data.device_id,
        person_id=event_data.person_id,
        event_type=event_data.event_type,
        confidence=event_data.confidence,
        door_opened=event_data.door_opened,
        photo_path=event_data.photo_path,
        video_path=event_data.video_path,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    # Broadcast WebSocket event to connected clients
    from app.api.websocket import broadcast_recognition_event
    import asyncio

    person_name = None
    if event_data.person_id:
        person = db.query(Person).filter(Person.id == event_data.person_id).first()
        if person:
            person_name = person.name

    # Send WebSocket notification in background
    try:
        asyncio.create_task(broadcast_recognition_event(
            event_type=event_data.event_type,
            person_id=str(event_data.person_id) if event_data.person_id else None,
            person_name=person_name,
            confidence=event_data.confidence,
            door_opened=event_data.door_opened
        ))
    except Exception as e:
        # Don't fail the request if WebSocket broadcast fails
        print(f"[Events] Failed to broadcast WebSocket event: {e}")

    return event


@router.get("/stats/summary")
def get_events_summary(
    days: int = Query(7, ge=1, le=365),
    device_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Получить статистику событий за период.

    Возвращает:
    - Общее количество событий
    - Количество по типам
    - Количество уникальных людей
    - Среднее confidence для распознанных
    """
    from sqlalchemy import func

    since = datetime.utcnow() - timedelta(days=days)

    query = db.query(AccessEvent).filter(AccessEvent.created_at >= since)

    if device_id:
        query = query.filter(AccessEvent.device_id == device_id)

    # Общее количество
    total_events = query.count()

    # Количество по типам
    event_types = (
        db.query(
            AccessEvent.event_type,
            func.count(AccessEvent.id).label("count"),
        )
        .filter(AccessEvent.created_at >= since)
        .group_by(AccessEvent.event_type)
        .all()
    )

    types_dict = {event_type: count for event_type, count in event_types}

    # Уникальные люди
    unique_people = (
        db.query(func.count(func.distinct(AccessEvent.person_id)))
        .filter(
            AccessEvent.created_at >= since,
            AccessEvent.person_id.isnot(None),
        )
        .scalar()
    )

    # Среднее confidence для recognized
    avg_confidence = (
        db.query(func.avg(AccessEvent.confidence))
        .filter(
            AccessEvent.created_at >= since,
            AccessEvent.event_type == "recognized",
            AccessEvent.confidence.isnot(None),
        )
        .scalar()
    )

    # Количество открытий двери
    doors_opened = (
        db.query(func.count(AccessEvent.id))
        .filter(
            AccessEvent.created_at >= since,
            AccessEvent.door_opened == True,
        )
        .scalar()
    )

    return {
        "period_days": days,
        "total_events": total_events,
        "events_by_type": types_dict,
        "unique_people_recognized": unique_people or 0,
        "average_confidence": round(avg_confidence, 2) if avg_confidence else None,
        "total_doors_opened": doors_opened or 0,
    }


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Удалить событие (физически).
    Используется для очистки тестовых данных или ошибочных записей.
    """
    event = db.query(AccessEvent).filter(AccessEvent.id == event_id).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # Удаление файлов события если они есть
    if event.photo_path:
        photo_full_path = Path(settings.data_dir) / event.photo_path
        if photo_full_path.exists():
            photo_full_path.unlink()

    if event.video_path:
        video_full_path = Path(settings.data_dir) / event.video_path
        if video_full_path.exists():
            video_full_path.unlink()

    db.delete(event)
    db.commit()

    return None


@router.delete("/cleanup")
def cleanup_old_events(
    days: int = Query(30, ge=0, le=365, description="Удалить события старше N дней (0 = все события)"),
    event_types: Optional[List[str]] = Query(None, description="Типы событий для удаления"),
    db: Session = Depends(get_db),
):
    """
    Очистка старых событий для освобождения места.

    По умолчанию удаляет все события старше 30 дней.
    Можно указать конкретные типы событий для удаления.

    Если days=0, удаляет ВСЕ события.

    Рекомендуется запускать автоматически по расписанию.
    """
    if days == 0:
        # Удалить все события
        query = db.query(AccessEvent)
    else:
        # Удалить события старше указанного количества дней
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = db.query(AccessEvent).filter(AccessEvent.created_at < cutoff_date)

    if event_types:
        query = query.filter(AccessEvent.event_type.in_(event_types))

    # Получение событий для удаления файлов
    events_to_delete = query.all()

    # Удаление файлов
    deleted_files = 0
    for event in events_to_delete:
        if event.photo_path:
            photo_path = Path(settings.data_dir) / event.photo_path
            if photo_path.exists():
                photo_path.unlink()
                deleted_files += 1

        if event.video_path:
            video_path = Path(settings.data_dir) / event.video_path
            if video_path.exists():
                video_path.unlink()
                deleted_files += 1

    # Удаление записей из БД
    deleted_count = query.delete()
    db.commit()

    return {
        "deleted_events": deleted_count,
        "deleted_files": deleted_files,
        "cutoff_date": "all" if days == 0 else cutoff_date.isoformat(),
    }
