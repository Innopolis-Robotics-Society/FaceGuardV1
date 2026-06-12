"""People management API endpoints."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentUser, require_permission
from app.core.database import get_db
from app.core.permissions import Permission
from app.models import Person, PersonPhoto
from app.schemas.person import PersonCreate, PersonResponse, PersonUpdate, PhotoResponse
from app.services.storage import StorageService

router = APIRouter(prefix="/people", tags=["people"])


@router.get("", response_model=list[PersonResponse])
async def list_people(
    include_deleted: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.VIEW_PEOPLE)),
) -> list[Person]:
    """List all people."""
    query = select(Person).order_by(Person.created_at.desc())
    if not include_deleted:
        query = query.where(Person.deleted_at.is_(None))

    result = await db.execute(query)
    people = list(result.scalars().all())

    # Add photo count
    for person in people:
        photo_result = await db.execute(
            select(func.count(PersonPhoto.id)).where(
                PersonPhoto.person_id == person.id,
                PersonPhoto.deleted_at.is_(None)
            )
        )
        person.photo_count = photo_result.scalar_one()

    return people


@router.post("", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def create_person(
    person_data: PersonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.CREATE_PERSON)),
) -> Person:
    """Create a new person."""
    person = Person(
        name=person_data.name,
        description=person_data.description,
        access_enabled=person_data.access_enabled,
        created_by=current_user.id,
    )
    db.add(person)
    await db.commit()
    await db.refresh(person)

    # Create directories
    storage = StorageService()
    storage.create_person_directories(person.id)

    person.photo_count = 0
    return person


@router.get("/{person_id}", response_model=PersonResponse)
async def get_person(
    person_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.VIEW_PEOPLE)),
) -> Person:
    """Get person by ID."""
    result = await db.execute(select(Person).where(Person.id == person_id))
    person = result.scalar_one_or_none()
    if person is None or person.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")

    # Add photo count
    photo_result = await db.execute(
        select(func.count(PersonPhoto.id)).where(
            PersonPhoto.person_id == person.id,
            PersonPhoto.deleted_at.is_(None)
        )
    )
    person.photo_count = photo_result.scalar_one()

    return person


@router.patch("/{person_id}", response_model=PersonResponse)
async def update_person(
    person_id: UUID,
    person_data: PersonUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.UPDATE_PERSON)),
) -> Person:
    """Update person."""
    result = await db.execute(select(Person).where(Person.id == person_id, Person.deleted_at.is_(None)))
    person = result.scalar_one_or_none()
    if person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")

    if person_data.name is not None:
        person.name = person_data.name
    if person_data.description is not None:
        person.description = person_data.description
    if person_data.access_enabled is not None:
        person.access_enabled = person_data.access_enabled

    person.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(person)

    # Add photo count
    photo_result = await db.execute(
        select(func.count(PersonPhoto.id)).where(
            PersonPhoto.person_id == person.id,
            PersonPhoto.deleted_at.is_(None)
        )
    )
    person.photo_count = photo_result.scalar_one()

    return person


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_person(
    person_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.DELETE_PERSON)),
) -> None:
    """Soft delete person."""
    result = await db.execute(select(Person).where(Person.id == person_id, Person.deleted_at.is_(None)))
    person = result.scalar_one_or_none()
    if person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")

    person.deleted_at = datetime.now(timezone.utc)
    person.access_enabled = False
    await db.commit()

    # Move to trash
    storage = StorageService()
    storage.move_to_trash(f"faces/{person_id}")


@router.get("/{person_id}/photos", response_model=list[PhotoResponse])
async def list_person_photos(
    person_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.VIEW_PHOTOS)),
) -> list[PersonPhoto]:
    """List photos for a person."""
    result = await db.execute(
        select(PersonPhoto)
        .where(PersonPhoto.person_id == person_id, PersonPhoto.deleted_at.is_(None))
        .order_by(PersonPhoto.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("/{person_id}/photos", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_person_photo(
    person_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.UPLOAD_PHOTO)),
) -> PersonPhoto:
    """Upload photo for a person."""
    # Verify person exists
    result = await db.execute(select(Person).where(Person.id == person_id, Person.deleted_at.is_(None)))
    person = result.scalar_one_or_none()
    if person is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Person not found")

    # Save file
    storage = StorageService()
    content = await file.read()
    photo_path = await storage.save_person_photo(person_id, content, file.filename or "photo.jpg")

    # Create photo record
    photo = PersonPhoto(
        person_id=person_id,
        original_path=photo_path,
        face_detected=False,  # Will be processed later
        created_by=current_user.id,
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)

    return photo


@router.delete("/{person_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_person_photo(
    person_id: UUID,
    photo_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.DELETE_PHOTO)),
) -> None:
    """Soft delete photo."""
    result = await db.execute(
        select(PersonPhoto).where(
            PersonPhoto.id == photo_id,
            PersonPhoto.person_id == person_id,
            PersonPhoto.deleted_at.is_(None)
        )
    )
    photo = result.scalar_one_or_none()
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    photo.deleted_at = datetime.now(timezone.utc)
    await db.commit()
