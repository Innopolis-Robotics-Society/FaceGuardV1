from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import AccessEvent, Device, Telemetry
from app.schemas import AccessEventCreate, TelemetryCreate

router = APIRouter(
    prefix="/sync",
    tags=["Sync"],
)


@router.post("/events/bulk", status_code=status.HTTP_201_CREATED)
def sync_events_bulk(
    device_id: UUID,
    events: List[AccessEventCreate],
    db: Session = Depends(get_db),
):
    """
    Массовая загрузка событий от Pi после офлайн периода.

    Когда Raspberry Pi теряет соединение с сервером, все события
    сохраняются локально в SQLite. При восстановлении связи,
    агент вызывает этот endpoint для синхронизации всех накопленных событий.

    Процесс:
    1. Pi накапливает события в локальном SQLite во время офлайн
    2. При восстановлении связи, Pi подключается к серверу
    3. Pi получает все несинхронизированные события из SQLite
    4. Pi отправляет их массово через этот endpoint
    5. Pi удаляет синхронизированные события из локального SQLite

    Parameters:
    - device_id: UUID устройства
    - events: Список событий для загрузки

    Returns:
    - Количество успешно загруженных событий
    - Список ошибок если были
    """
    # Проверка существования устройства
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    created_events = []
    errors = []

    for idx, event_data in enumerate(events):
        try:
            # Проверка что событие относится к правильному устройству
            if event_data.device_id != device_id:
                errors.append({
                    "index": idx,
                    "error": "Event device_id does not match provided device_id",
                })
                continue

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
            created_events.append(event)

        except Exception as e:
            errors.append({
                "index": idx,
                "error": str(e),
            })

    # Сохранение всех событий
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save events: {str(e)}",
        )

    return {
        "success": True,
        "created_count": len(created_events),
        "total_received": len(events),
        "errors_count": len(errors),
        "errors": errors if errors else None,
    }


@router.post("/telemetry/bulk", status_code=status.HTTP_201_CREATED)
def sync_telemetry_bulk(
    device_id: UUID,
    telemetry_records: List[TelemetryCreate],
    db: Session = Depends(get_db),
):
    """
    Массовая загрузка телеметрии от Pi после офлайн периода.

    Аналогично событиям, телеметрия также накапливается локально
    и синхронизируется при восстановлении связи.

    Обычно телеметрия менее критична чем события, поэтому можно:
    - Отправлять только агрегированные данные (avg за период)
    - Пропускать некоторые записи для экономии трафика
    - Отправлять только при изменении значений
    """
    # Проверка существования устройства
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    created_records = []
    errors = []

    for idx, telemetry_data in enumerate(telemetry_records):
        try:
            # Проверка что телеметрия относится к правильному устройству
            if telemetry_data.device_id != device_id:
                errors.append({
                    "index": idx,
                    "error": "Telemetry device_id does not match provided device_id",
                })
                continue

            # Создание записи телеметрии
            telemetry = Telemetry(
                device_id=telemetry_data.device_id,
                cpu_usage=telemetry_data.cpu_usage,
                cpu_temperature=telemetry_data.cpu_temperature,
                ram_usage=telemetry_data.ram_usage,
                disk_usage=telemetry_data.disk_usage,
                uptime=telemetry_data.uptime,
                camera_fps=telemetry_data.camera_fps,
                network_status=telemetry_data.network_status,
            )

            db.add(telemetry)
            created_records.append(telemetry)

        except Exception as e:
            errors.append({
                "index": idx,
                "error": str(e),
            })

    # Сохранение всех записей
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save telemetry: {str(e)}",
        )

    # Обновление last_seen_at устройства
    device.last_seen_at = datetime.utcnow()
    device.status = "online"
    db.commit()

    return {
        "success": True,
        "created_count": len(created_records),
        "total_received": len(telemetry_records),
        "errors_count": len(errors),
        "errors": errors if errors else None,
    }


@router.get("/status/{device_id}")
def get_sync_status(
    device_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Получить статус синхронизации для устройства.

    Возвращает информацию:
    - Последнее событие от устройства
    - Последняя телеметрия
    - Количество несинхронизированных команд (pending)

    Pi может использовать это для определения нужно ли синхронизироваться.
    """
    # Проверка существования устройства
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # Последнее событие
    latest_event = (
        db.query(AccessEvent)
        .filter(AccessEvent.device_id == device_id)
        .order_by(AccessEvent.created_at.desc())
        .first()
    )

    # Последняя телеметрия
    latest_telemetry = (
        db.query(Telemetry)
        .filter(Telemetry.device_id == device_id)
        .order_by(Telemetry.created_at.desc())
        .first()
    )

    # Количество pending команд
    from app.models.models import DeviceCommand

    pending_commands_count = (
        db.query(DeviceCommand)
        .filter(
            DeviceCommand.device_id == device_id,
            DeviceCommand.status == "pending",
        )
        .count()
    )

    return {
        "device_id": str(device_id),
        "device_status": device.status,
        "last_seen": device.last_seen_at.isoformat() if device.last_seen_at else None,
        "latest_event_at": latest_event.created_at.isoformat() if latest_event else None,
        "latest_telemetry_at": latest_telemetry.created_at.isoformat() if latest_telemetry else None,
        "pending_commands_count": pending_commands_count,
        "needs_sync": pending_commands_count > 0,
    }
