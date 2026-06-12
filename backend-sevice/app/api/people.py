from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Person, PersonPhoto
from app.schemas import PersonCreate, PersonResponse, PersonUpdate

router = APIRouter(
    prefix="/people",
    tags=["People"],
)


@router.get("/", response_model=List[PersonResponse])
def list_people(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    include_deleted: bool = Query(False),
    access_enabled_only: bool = Query(False),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Получить список людей с фильтрацией и пагинацией.
    """
    query = db.query(Person)

    # Фильтр по deleted_at
    if not include_deleted:
        query = query.filter(Person.deleted_at.is_(None))

    # Фильтр по access_enabled
    if access_enabled_only:
        query = query.filter(Person.access_enabled == True)

    # Поиск по имени
    if search:
        query = query.filter(Person.name.ilike(f"%{search}%"))

    # Получение людей
    people = query.order_by(Person.created_at.desc()).offset(skip).limit(limit).all()

    # Добавление количества фотографий
    result = []
    for person in people:
        person_dict = {
            "id": person.id,
            "name": person.name,
            "description": person.description,
            "access_enabled": person.access_enabled,
            "created_at": person.created_at,
            "updated_at": person.updated_at,
            "created_by": person.created_by,
            "deleted_at": person.deleted_at,
            "photo_count": db.query(func.count(PersonPhoto.id))
            .filter(
                PersonPhoto.person_id == person.id,
                PersonPhoto.deleted_at.is_(None),
            )
            .scalar()
            or 0,
        }
        result.append(PersonResponse(**person_dict))

    return result


@router.get("/{person_id}", response_model=PersonResponse)
def get_person(
    person_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Получить информацию о конкретном человеке.
    """
    person = db.query(Person).filter(Person.id == person_id).first()

    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found",
        )

    # Подсчет количества фотографий
    photo_count = (
        db.query(func.count(PersonPhoto.id))
        .filter(
            PersonPhoto.person_id == person.id,
            PersonPhoto.deleted_at.is_(None),
        )
        .scalar()
        or 0
    )

    person_dict = {
        "id": person.id,
        "name": person.name,
        "description": person.description,
        "access_enabled": person.access_enabled,
        "created_at": person.created_at,
        "updated_at": person.updated_at,
        "created_by": person.created_by,
        "deleted_at": person.deleted_at,
        "photo_count": photo_count,
    }

    return PersonResponse(**person_dict)


@router.post("/", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
def create_person(
    person_data: PersonCreate,
    db: Session = Depends(get_db),
):
    """
    Создать нового человека.
    Автоматически создаются папки для хранения фотографий:
    - data/faces/{person_id}/original
    - data/faces/{person_id}/processed
    """
    import os
    from pathlib import Path
    from uuid import uuid4

    from app.core.config import settings

    # Создание записи в БД
    person = Person(
        id=uuid4(),
        name=person_data.name,
        description=person_data.description,
        access_enabled=person_data.access_enabled,
    )

    db.add(person)
    db.commit()
    db.refresh(person)

    # Создание папок для фотографий
    person_folder = Path(settings.data_dir) / "faces" / str(person.id)
    original_folder = person_folder / "original"
    processed_folder = person_folder / "processed"

    try:
        original_folder.mkdir(parents=True, exist_ok=True)
        processed_folder.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        # Если не удалось создать папки, откатываем создание человека
        db.delete(person)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create person folders: {str(e)}",
        )

    person_dict = {
        "id": person.id,
        "name": person.name,
        "description": person.description,
        "access_enabled": person.access_enabled,
        "created_at": person.created_at,
        "updated_at": person.updated_at,
        "created_by": person.created_by,
        "deleted_at": person.deleted_at,
        "photo_count": 0,
    }

    return PersonResponse(**person_dict)


@router.patch("/{person_id}", response_model=PersonResponse)
def update_person(
    person_id: UUID,
    person_data: PersonUpdate,
    db: Session = Depends(get_db),
):
    """
    Обновить информацию о человеке.
    """
    from datetime import datetime

    person = db.query(Person).filter(Person.id == person_id).first()

    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found",
        )

    # Обновление полей
    if person_data.name is not None:
        person.name = person_data.name
    if person_data.description is not None:
        person.description = person_data.description
    if person_data.access_enabled is not None:
        person.access_enabled = person_data.access_enabled

    person.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(person)

    # Подсчет количества фотографий
    photo_count = (
        db.query(func.count(PersonPhoto.id))
        .filter(
            PersonPhoto.person_id == person.id,
            PersonPhoto.deleted_at.is_(None),
        )
        .scalar()
        or 0
    )

    person_dict = {
        "id": person.id,
        "name": person.name,
        "description": person.description,
        "access_enabled": person.access_enabled,
        "created_at": person.created_at,
        "updated_at": person.updated_at,
        "created_by": person.created_by,
        "deleted_at": person.deleted_at,
        "photo_count": photo_count,
    }

    return PersonResponse(**person_dict)


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_person(
    person_id: UUID,
    permanent: bool = Query(False, description="Permanently delete (true) or soft delete (false)"),
    db: Session = Depends(get_db),
):
    """
    Удалить человека (soft delete по умолчанию).
    При soft delete устанавливается deleted_at и access_enabled = False.
    При permanent = True удаляется физически из БД (папки остаются).
    """
    from datetime import datetime

    person = db.query(Person).filter(Person.id == person_id).first()

    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found",
        )

    if permanent:
        # Физическое удаление
        db.delete(person)
    else:
        # Soft delete
        person.deleted_at = datetime.utcnow()
        person.access_enabled = False

    db.commit()

    return None
