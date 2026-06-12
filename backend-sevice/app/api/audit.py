from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import AuditLog, User

router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"],
)


@router.get("/", response_model=List[dict])
def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[UUID] = Query(None, description="Фильтр по пользователю"),
    action: Optional[str] = Query(None, description="Фильтр по действию"),
    entity_type: Optional[str] = Query(None, description="Фильтр по типу сущности"),
    days: int = Query(30, ge=1, le=365, description="Количество дней истории"),
    db: Session = Depends(get_db),
):
    """
    Получить audit log с фильтрацией.

    Audit log содержит все важные действия администраторов:
    - create_person, update_person, delete_person
    - add_photo, delete_photo
    - manual_open_door
    - restart_device, reboot_device
    - create_backup, restore_backup
    - create_user, delete_user

    Каждая запись содержит:
    - Кто сделал (user_id)
    - Что сделал (action)
    - С какой сущностью (entity_type, entity_id)
    - Старое и новое значение (old_value, new_value) для update операций
    - IP адрес
    - Время
    """
    from sqlalchemy import and_

    query = db.query(AuditLog)

    # Фильтр по дате
    since = datetime.utcnow() - timedelta(days=days)
    query = query.filter(AuditLog.created_at >= since)

    # Фильтры
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    # Получение логов с информацией о пользователе
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    # Добавление информации о пользователе
    result = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None

        result.append({
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "username": user.username if user else None,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": str(log.entity_id) if log.entity_id else None,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat(),
        })

    return result


@router.get("/{log_id}")
def get_audit_log(
    log_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Получить детали конкретной записи audit log.
    """
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log entry not found",
        )

    user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None

    return {
        "id": str(log.id),
        "user_id": str(log.user_id) if log.user_id else None,
        "username": user.username if user else None,
        "action": log.action,
        "entity_type": log.entity_type,
        "entity_id": str(log.entity_id) if log.entity_id else None,
        "old_value": log.old_value,
        "new_value": log.new_value,
        "ip_address": log.ip_address,
        "created_at": log.created_at.isoformat(),
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_audit_log(
    user_id: Optional[UUID],
    action: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[UUID] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Создать запись в audit log.

    Обычно вызывается автоматически из других endpoints,
    но может быть вызван вручную для кастомного логирования.

    Примеры использования:
    1. После создания человека:
       action="create_person", entity_type="person", entity_id=person.id

    2. После обновления:
       action="update_person", entity_type="person", entity_id=person.id,
       old_value='{"name": "John"}', new_value='{"name": "John Doe"}'

    3. После удаления:
       action="delete_person", entity_type="person", entity_id=person.id

    4. Ручное открытие двери:
       action="manual_open_door", entity_type="device", entity_id=device.id
    """
    log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "id": str(log.id),
        "created_at": log.created_at.isoformat(),
    }


@router.get("/stats/summary")
def get_audit_stats(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """
    Получить статистику по audit log за период.

    Возвращает:
    - Общее количество действий
    - Количество по типам действий
    - Топ пользователей по активности
    """
    from sqlalchemy import func

    since = datetime.utcnow() - timedelta(days=days)

    # Общее количество
    total_actions = db.query(AuditLog).filter(AuditLog.created_at >= since).count()

    # Количество по типам действий
    actions_by_type = (
        db.query(
            AuditLog.action,
            func.count(AuditLog.id).label("count"),
        )
        .filter(AuditLog.created_at >= since)
        .group_by(AuditLog.action)
        .order_by(func.count(AuditLog.id).desc())
        .all()
    )

    actions_dict = {action: count for action, count in actions_by_type}

    # Топ пользователей по активности
    top_users = (
        db.query(
            AuditLog.user_id,
            func.count(AuditLog.id).label("actions_count"),
        )
        .filter(
            AuditLog.created_at >= since,
            AuditLog.user_id.isnot(None),
        )
        .group_by(AuditLog.user_id)
        .order_by(func.count(AuditLog.id).desc())
        .limit(10)
        .all()
    )

    top_users_list = []
    for user_id, actions_count in top_users:
        user = db.query(User).filter(User.id == user_id).first()
        top_users_list.append({
            "user_id": str(user_id),
            "username": user.username if user else "Unknown",
            "actions_count": actions_count,
        })

    return {
        "period_days": days,
        "total_actions": total_actions,
        "actions_by_type": actions_dict,
        "top_users": top_users_list,
    }


@router.delete("/cleanup")
def cleanup_old_audit_logs(
    days: int = Query(90, ge=30, le=365, description="Удалить записи старше N дней"),
    db: Session = Depends(get_db),
):
    """
    Очистка старых audit logs для освобождения места.

    По умолчанию удаляет записи старше 90 дней.
    Минимум - 30 дней (для соблюдения audit требований).

    Рекомендуется:
    - Запускать автоматически по расписанию
    - Делать backup перед очисткой
    - Хранить минимум 3 месяца для аудита
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    deleted_count = (
        db.query(AuditLog)
        .filter(AuditLog.created_at < cutoff_date)
        .delete()
    )

    db.commit()

    return {
        "deleted_count": deleted_count,
        "cutoff_date": cutoff_date.isoformat(),
        "message": f"Deleted audit logs older than {days} days",
    }
