from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Device, DeviceCommand
from app.schemas import DeviceCommandCreate, DeviceCommandResponse, DeviceCommandUpdate

router = APIRouter(
    prefix="/commands",
    tags=["Commands"],
)


@router.get("/", response_model=List[DeviceCommandResponse])
def list_commands(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    device_id: Optional[UUID] = Query(None, description="Фильтр по устройству"),
    status_filter: Optional[str] = Query(None, description="Фильтр по статусу: pending, sent, running, completed, failed"),
    db: Session = Depends(get_db),
):
    """
    Получить список команд с фильтрацией.

    Статусы команд:
    - pending: Команда создана, ожидает отправки
    - sent: Команда отправлена на устройство
    - received: Команда получена устройством
    - running: Команда выполняется
    - completed: Команда выполнена успешно
    - failed: Команда завершилась с ошибкой
    - expired: Команда устарела (не была выполнена в течение времени)
    """
    query = db.query(DeviceCommand)

    if device_id:
        query = query.filter(DeviceCommand.device_id == device_id)
    if status_filter:
        query = query.filter(DeviceCommand.status == status_filter)

    commands = query.order_by(DeviceCommand.created_at.desc()).offset(skip).limit(limit).all()

    return commands


@router.get("/pending", response_model=List[DeviceCommandResponse])
def get_pending_commands(
    device_id: UUID = Query(..., description="UUID устройства"),
    db: Session = Depends(get_db),
):
    """
    Получить очередь команд для устройства (только pending).

    Этот endpoint вызывается Raspberry Pi агентом при подключении
    и периодически для получения новых команд.
    """
    # Проверка существования устройства
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # Получение pending команд
    pending_commands = (
        db.query(DeviceCommand)
        .filter(
            DeviceCommand.device_id == device_id,
            DeviceCommand.status == "pending",
        )
        .order_by(DeviceCommand.created_at.asc())
        .all()
    )

    return pending_commands


@router.get("/{command_id}", response_model=DeviceCommandResponse)
def get_command(
    command_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Получить информацию о конкретной команде.
    """
    command = db.query(DeviceCommand).filter(DeviceCommand.id == command_id).first()

    if not command:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Command not found",
        )

    return command


@router.post("/", response_model=DeviceCommandResponse, status_code=status.HTTP_201_CREATED)
def create_command(
    command_data: DeviceCommandCreate,
    db: Session = Depends(get_db),
):
    """
    Создать команду для устройства.

    Доступные типы команд:
    - capture_photos: Сделать серию фотографий для регистрации человека
    - rebuild_model: Переобучить модель распознавания
    - reload_model: Перезагрузить модель в память
    - open_door: Открыть дверь вручную
    - restart_recognition: Перезапустить сервис распознавания
    - restart_camera: Перезапустить камеру
    - restart_agent: Перезапустить агент
    - reboot_device: Перезагрузить Raspberry Pi
    - collect_logs: Собрать и отправить логи
    - start_stream: Начать видео-стрим
    - stop_stream: Остановить видео-стрим
    - get_health_status: Получить статус всех компонентов

    Параметры передаются в JSON формате в поле `parameters`.
    Например для capture_photos:
    {
      "person_id": "uuid",
      "count": 10,
      "angle_variations": true
    }
    """
    # Проверка существования устройства
    device = db.query(Device).filter(Device.id == command_data.device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    # Создание команды
    command = DeviceCommand(
        device_id=command_data.device_id,
        command_type=command_data.command_type,
        parameters=command_data.parameters,
        status="pending",
    )

    db.add(command)
    db.commit()
    db.refresh(command)

    # TODO: Отправить команду через WebSocket если устройство онлайн
    # Это будет реализовано в WebSocket модуле

    return command


@router.patch("/{command_id}", response_model=DeviceCommandResponse)
def update_command(
    command_id: UUID,
    command_data: DeviceCommandUpdate,
    db: Session = Depends(get_db),
):
    """
    Обновить статус команды.

    Вызывается Raspberry Pi агентом для обновления статуса выполнения:
    1. Получил команду → status: "received"
    2. Начал выполнение → status: "running", started_at: now
    3. Завершил успешно → status: "completed", completed_at: now, result: данные
    4. Завершил с ошибкой → status: "failed", completed_at: now, error_message: текст
    """
    command = db.query(DeviceCommand).filter(DeviceCommand.id == command_id).first()

    if not command:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Command not found",
        )

    # Обновление полей
    if command_data.status is not None:
        command.status = command_data.status
    if command_data.started_at is not None:
        command.started_at = command_data.started_at
    if command_data.completed_at is not None:
        command.completed_at = command_data.completed_at
    if command_data.result is not None:
        command.result = command_data.result
    if command_data.error_message is not None:
        command.error_message = command_data.error_message

    db.commit()
    db.refresh(command)

    return command


@router.delete("/{command_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_command(
    command_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Удалить команду.
    Обычно используется для очистки старых выполненных команд.
    """
    command = db.query(DeviceCommand).filter(DeviceCommand.id == command_id).first()

    if not command:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Command not found",
        )

    db.delete(command)
    db.commit()

    return None


@router.post("/devices/{device_id}/capture-photos", response_model=DeviceCommandResponse)
def create_capture_photos_command(
    device_id: UUID,
    person_id: UUID = Query(..., description="UUID человека для которого делать фото"),
    count: int = Query(10, ge=1, le=50, description="Количество фотографий"),
    angle_variations: bool = Query(True, description="Делать фото с разных углов"),
    db: Session = Depends(get_db),
):
    """
    Быстрая команда: сделать фотографии для регистрации человека.

    Агент на Pi:
    1. Делает серию фотографий через picamera2
    2. OpenCV находит лица на каждом кадре
    3. Сохраняет временно локально
    4. Загружает на сервер через POST /api/v1/people/{person_id}/photos
    5. Обновляет статус команды на "completed"
    """
    command_data = DeviceCommandCreate(
        device_id=device_id,
        command_type="capture_photos",
        parameters={
            "person_id": str(person_id),
            "count": count,
            "angle_variations": angle_variations,
        },
    )

    return create_command(command_data, db)


@router.post("/devices/{device_id}/rebuild-model", response_model=DeviceCommandResponse)
def create_rebuild_model_command(
    device_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Быстрая команда: переобучить модель распознавания.

    Агент на Pi:
    1. Загружает все processed фото всех людей с сервера
    2. Обучает OpenCV LBPH recognizer
    3. Сохраняет trainer.yml + labels.json
    4. Загружает новую модель в память
    5. Обновляет статус команды
    """
    command_data = DeviceCommandCreate(
        device_id=device_id,
        command_type="rebuild_model",
        parameters=None,
    )

    return create_command(command_data, db)


@router.post("/devices/{device_id}/open-door", response_model=DeviceCommandResponse)
def create_open_door_command(
    device_id: UUID,
    duration: int = Query(5, ge=1, le=30, description="Длительность открытия в секундах"),
    db: Session = Depends(get_db),
):
    """
    Быстрая команда: открыть дверь вручную.

    Используется администратором для удаленного открытия двери.
    Должна требовать superadmin права.

    Агент на Pi:
    1. Управляет сервоприводом через GPIO
    2. Открывает на N секунд
    3. Возвращает в исходное положение
    4. Создает событие "manual_open"
    """
    command_data = DeviceCommandCreate(
        device_id=device_id,
        command_type="open_door",
        parameters={
            "duration": duration,
        },
    )

    return create_command(command_data, db)


@router.post("/devices/{device_id}/reboot", response_model=DeviceCommandResponse)
def create_reboot_command(
    device_id: UUID,
    delay: int = Query(10, ge=5, le=60, description="Задержка перед перезагрузкой в секундах"),
    db: Session = Depends(get_db),
):
    """
    Быстрая команда: перезагрузить Raspberry Pi.

    Должна требовать superadmin права и создавать audit log.

    Агент на Pi:
    1. Сохраняет текущее состояние
    2. Отправляет подтверждение команды
    3. Выполняет `sudo reboot`
    """
    command_data = DeviceCommandCreate(
        device_id=device_id,
        command_type="reboot_device",
        parameters={
            "delay": delay,
        },
    )

    return create_command(command_data, db)
