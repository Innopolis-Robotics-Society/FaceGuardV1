from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Device, Telemetry
from app.schemas import TelemetryCreate, TelemetryResponse

router = APIRouter(
    prefix="/telemetry",
    tags=["Telemetry"],
)


@router.post("/", response_model=TelemetryResponse, status_code=status.HTTP_201_CREATED)
def create_telemetry(
    telemetry_data: TelemetryCreate,
    db: Session = Depends(get_db),
):
    """
    Принять телеметрию от устройства.
    Вызывается Raspberry Pi агентом каждые 5-10 секунд.

    Параметры:
    - device_id: UUID устройства
    - cpu_usage: Процент использования CPU (0-100)
    - cpu_temperature: Температура CPU в градусах Цельсия
    - ram_usage: Процент использования RAM (0-100)
    - disk_usage: Процент использования диска (0-100)
    - uptime: Время работы в секундах
    - camera_fps: FPS камеры
    - network_status: Статус сети (online/offline)
    """
    # Проверка существования устройства
    device = db.query(Device).filter(Device.id == telemetry_data.device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

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

    # Обновление last_seen_at устройства
    device.last_seen_at = datetime.utcnow()
    device.status = "online"

    db.commit()
    db.refresh(telemetry)

    return telemetry


@router.get("/devices/{device_id}", response_model=List[TelemetryResponse])
def get_device_telemetry(
    device_id: UUID,
    hours: int = Query(24, ge=1, le=168, description="Количество часов истории (max 168 = 7 дней)"),
    limit: int = Query(1000, ge=1, le=10000),
    db: Session = Depends(get_db),
):
    """
    Получить историю телеметрии устройства за последние N часов.

    По умолчанию возвращает последние 24 часа.
    Для графиков рекомендуется запрашивать не более 7 дней (168 часов).
    """
    # Проверка существования устройства
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # Получение телеметрии за указанный период
    since = datetime.utcnow() - timedelta(hours=hours)

    telemetry_records = (
        db.query(Telemetry)
        .filter(
            Telemetry.device_id == device_id,
            Telemetry.created_at >= since,
        )
        .order_by(Telemetry.created_at.desc())
        .limit(limit)
        .all()
    )

    return telemetry_records


@router.get("/devices/{device_id}/latest", response_model=TelemetryResponse)
def get_latest_telemetry(
    device_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Получить последнюю запись телеметрии устройства.
    """
    # Проверка существования устройства
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # Получение последней записи
    latest = (
        db.query(Telemetry)
        .filter(Telemetry.device_id == device_id)
        .order_by(Telemetry.created_at.desc())
        .first()
    )

    if not latest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No telemetry data found for this device",
        )

    return latest


@router.delete("/devices/{device_id}/cleanup")
def cleanup_old_telemetry(
    device_id: UUID,
    days: int = Query(7, ge=1, le=365, description="Удалить записи старше N дней"),
    db: Session = Depends(get_db),
):
    """
    Удалить старые записи телеметрии для освобождения места в БД.

    По умолчанию удаляет записи старше 7 дней.
    Рекомендуется запускать автоматически по расписанию.
    """
    # Проверка существования устройства
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # Удаление старых записей
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    deleted_count = (
        db.query(Telemetry)
        .filter(
            Telemetry.device_id == device_id,
            Telemetry.created_at < cutoff_date,
        )
        .delete()
    )

    db.commit()

    return {
        "deleted_count": deleted_count,
        "cutoff_date": cutoff_date.isoformat(),
    }


@router.get("/devices/{device_id}/stats")
def get_telemetry_stats(
    device_id: UUID,
    hours: int = Query(24, ge=1, le=168),
    db: Session = Depends(get_db),
):
    """
    Получить агрегированную статистику телеметрии за период.

    Возвращает средние, минимальные и максимальные значения:
    - CPU usage
    - CPU temperature
    - RAM usage
    - Disk usage
    """
    from sqlalchemy import func

    # Проверка существования устройства
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    since = datetime.utcnow() - timedelta(hours=hours)

    # Агрегация статистики
    stats = (
        db.query(
            func.avg(Telemetry.cpu_usage).label("avg_cpu"),
            func.max(Telemetry.cpu_usage).label("max_cpu"),
            func.min(Telemetry.cpu_usage).label("min_cpu"),
            func.avg(Telemetry.cpu_temperature).label("avg_temp"),
            func.max(Telemetry.cpu_temperature).label("max_temp"),
            func.avg(Telemetry.ram_usage).label("avg_ram"),
            func.max(Telemetry.ram_usage).label("max_ram"),
            func.avg(Telemetry.disk_usage).label("avg_disk"),
            func.max(Telemetry.disk_usage).label("max_disk"),
            func.avg(Telemetry.camera_fps).label("avg_fps"),
        )
        .filter(
            Telemetry.device_id == device_id,
            Telemetry.created_at >= since,
        )
        .first()
    )

    if not stats or stats.avg_cpu is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No telemetry data found for this period",
        )

    return {
        "device_id": str(device_id),
        "period_hours": hours,
        "cpu": {
            "average": round(stats.avg_cpu, 2) if stats.avg_cpu else None,
            "max": round(stats.max_cpu, 2) if stats.max_cpu else None,
            "min": round(stats.min_cpu, 2) if stats.min_cpu else None,
        },
        "temperature": {
            "average": round(stats.avg_temp, 2) if stats.avg_temp else None,
            "max": round(stats.max_temp, 2) if stats.max_temp else None,
        },
        "ram": {
            "average": round(stats.avg_ram, 2) if stats.avg_ram else None,
            "max": round(stats.max_ram, 2) if stats.max_ram else None,
        },
        "disk": {
            "average": round(stats.avg_disk, 2) if stats.avg_disk else None,
            "max": round(stats.max_disk, 2) if stats.max_disk else None,
        },
        "camera_fps": {
            "average": round(stats.avg_fps, 2) if stats.avg_fps else None,
        },
    }
