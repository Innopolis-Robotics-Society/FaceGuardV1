from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Device
from app.schemas import DeviceCreate, DeviceResponse, DeviceUpdate

router = APIRouter(
    prefix="/devices",
    tags=["Devices"],
)


@router.get("/", response_model=List[DeviceResponse])
def list_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status_filter: Optional[str] = Query(None, description="Filter by status: online, offline"),
    db: Session = Depends(get_db),
):
    """
    Получить список устройств Raspberry Pi.
    """
    query = db.query(Device)

    if status_filter:
        query = query.filter(Device.status == status_filter)

    devices = query.order_by(Device.created_at.desc()).offset(skip).limit(limit).all()

    return devices


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Получить информацию о конкретном устройстве.
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    return device


@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def create_device(
    device_data: DeviceCreate,
    db: Session = Depends(get_db),
):
    """
    Зарегистрировать новое устройство Raspberry Pi.
    """
    # Проверка уникальности device_code
    existing_device = db.query(Device).filter(Device.device_code == device_data.device_code).first()
    if existing_device:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device with this code already exists",
        )

    device = Device(
        name=device_data.name,
        device_code=device_data.device_code,
        status="offline",
    )

    db.add(device)
    db.commit()
    db.refresh(device)

    return device


@router.patch("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: UUID,
    device_data: DeviceUpdate,
    db: Session = Depends(get_db),
):
    """
    Обновить информацию об устройстве.
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # Обновление полей
    if device_data.name is not None:
        device.name = device_data.name
    if device_data.status is not None:
        device.status = device_data.status
    if device_data.ip_address is not None:
        device.ip_address = device_data.ip_address
    if device_data.software_version is not None:
        device.software_version = device_data.software_version
    if device_data.camera_status is not None:
        device.camera_status = device_data.camera_status
    if device_data.recognition_status is not None:
        device.recognition_status = device_data.recognition_status

    db.commit()
    db.refresh(device)

    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(
    device_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Удалить устройство.
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    db.delete(device)
    db.commit()

    return None


@router.post("/{device_id}/heartbeat", response_model=DeviceResponse)
def device_heartbeat(
    device_id: UUID,
    ip_address: Optional[str] = None,
    software_version: Optional[str] = None,
    camera_status: Optional[str] = None,
    recognition_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Heartbeat от устройства.
    Обновляет статус устройства на "online" и время последней активности.
    Вызывается агентом на Raspberry Pi каждые 5-10 секунд.
    """
    device = db.query(Device).filter(Device.id == device_id).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # Обновление статуса и времени
    device.status = "online"
    device.last_seen_at = datetime.utcnow()

    # Обновление дополнительной информации
    if ip_address:
        device.ip_address = ip_address
    if software_version:
        device.software_version = software_version
    if camera_status:
        device.camera_status = camera_status
    if recognition_status:
        device.recognition_status = recognition_status

    db.commit()
    db.refresh(device)

    return device


@router.post("/by-code/{device_code}/heartbeat", response_model=DeviceResponse)
def device_heartbeat_by_code(
    device_code: str,
    ip_address: Optional[str] = None,
    software_version: Optional[str] = None,
    camera_status: Optional[str] = None,
    recognition_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Heartbeat от устройства по device_code (для удобства агента).
    Обновляет статус устройства на "online" и время последней активности.
    """
    device = db.query(Device).filter(Device.device_code == device_code).first()

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # Обновление статуса и времени
    device.status = "online"
    device.last_seen_at = datetime.utcnow()

    # Обновление дополнительной информации
    if ip_address:
        device.ip_address = ip_address
    if software_version:
        device.software_version = software_version
    if camera_status:
        device.camera_status = camera_status
    if recognition_status:
        device.recognition_status = recognition_status

    db.commit()
    db.refresh(device)

    return device
