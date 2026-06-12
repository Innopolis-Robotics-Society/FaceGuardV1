import hashlib
import shutil
from pathlib import Path
from typing import List
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from PIL import Image
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Person, PersonPhoto
from app.schemas import PersonPhotoResponse

router = APIRouter(
    prefix="/people",
    tags=["Photos"],
)


def calculate_file_hash(file_path: Path) -> str:
    """Вычислить SHA256 хеш файла."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def create_thumbnail(image_path: Path, thumbnail_path: Path, size: tuple = (200, 200)):
    """Создать thumbnail из изображения."""
    try:
        with Image.open(image_path) as img:
            # Конвертация в RGB если необходимо
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # Создание thumbnail с сохранением пропорций
            img.thumbnail(size, Image.Resampling.LANCZOS)
            img.save(thumbnail_path, "JPEG", quality=85)
            return True
    except Exception as e:
        print(f"Failed to create thumbnail: {e}")
        return False


@router.post("/{person_id}/photos", response_model=List[PersonPhotoResponse], status_code=status.HTTP_201_CREATED)
async def upload_photos(
    person_id: UUID,
    files: List[UploadFile] = File(..., description="Фотографии для загрузки (можно несколько)"),
    db: Session = Depends(get_db),
):
    """
    Загрузить фотографии для человека.
    Поддерживается загрузка нескольких файлов одновременно.

    Для каждого файла:
    - Сохраняется оригинал в data/faces/{person_id}/original/
    - Создается thumbnail в data/faces/{person_id}/original/.thumbnails/
    - Записывается информация в БД
    """
    # Проверка существования человека
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found",
        )

    # Проверка что человек не удален
    if person.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload photos for deleted person",
        )

    # Подготовка папок
    person_folder = Path(settings.data_dir) / "faces" / str(person_id)
    original_folder = person_folder / "original"
    thumbnails_folder = original_folder / ".thumbnails"

    thumbnails_folder.mkdir(parents=True, exist_ok=True)

    # Разрешенные форматы
    allowed_extensions = {".jpg", ".jpeg", ".png", ".bmp"}

    uploaded_photos = []

    for file in files:
        # Проверка расширения файла
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {file.filename} has unsupported format. Allowed: {', '.join(allowed_extensions)}",
            )

        # Генерация уникального имени файла
        photo_id = uuid4()
        filename = f"{photo_id}{file_ext}"

        original_path = original_folder / filename
        thumbnail_filename = f"{photo_id}_thumb.jpg"
        thumbnail_path = thumbnails_folder / thumbnail_filename

        try:
            # Сохранение оригинала
            with open(original_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Получение размеров изображения
            with Image.open(original_path) as img:
                width, height = img.size

            # Создание thumbnail
            thumbnail_created = create_thumbnail(original_path, thumbnail_path)

            # Вычисление хеша файла
            file_hash = calculate_file_hash(original_path)

            # Сохранение записи в БД
            photo = PersonPhoto(
                id=photo_id,
                person_id=person_id,
                original_path=str(original_path.relative_to(Path(settings.data_dir))),
                thumbnail_path=str(thumbnail_path.relative_to(Path(settings.data_dir))) if thumbnail_created else None,
                width=width,
                height=height,
                file_hash=file_hash,
                face_detected=False,  # Будет обновлено после обработки OpenCV
            )

            db.add(photo)
            uploaded_photos.append(photo)

        except Exception as e:
            # Очистка при ошибке
            if original_path.exists():
                original_path.unlink()
            if thumbnail_path.exists():
                thumbnail_path.unlink()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload {file.filename}: {str(e)}",
            )

    # Сохранение всех фото в БД
    db.commit()

    # Обновление информации о фото
    for photo in uploaded_photos:
        db.refresh(photo)

    return uploaded_photos


@router.get("/{person_id}/photos", response_model=List[PersonPhotoResponse])
def get_person_photos(
    person_id: UUID,
    include_deleted: bool = False,
    db: Session = Depends(get_db),
):
    """
    Получить список всех фотографий человека.
    """
    # Проверка существования человека
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found",
        )

    query = db.query(PersonPhoto).filter(PersonPhoto.person_id == person_id)

    if not include_deleted:
        query = query.filter(PersonPhoto.deleted_at.is_(None))

    photos = query.order_by(PersonPhoto.created_at.desc()).all()

    return photos


@router.get("/{person_id}/photos/{photo_id}", response_model=PersonPhotoResponse)
def get_photo_info(
    person_id: UUID,
    photo_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Получить информацию о конкретной фотографии.
    """
    photo = (
        db.query(PersonPhoto)
        .filter(
            PersonPhoto.id == photo_id,
            PersonPhoto.person_id == person_id,
        )
        .first()
    )

    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )

    return photo


@router.delete("/{person_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_photo(
    person_id: UUID,
    photo_id: UUID,
    permanent: bool = False,
    db: Session = Depends(get_db),
):
    """
    Удалить фотографию (soft delete по умолчанию).
    """
    from datetime import datetime

    photo = (
        db.query(PersonPhoto)
        .filter(
            PersonPhoto.id == photo_id,
            PersonPhoto.person_id == person_id,
        )
        .first()
    )

    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )

    if permanent:
        # Физическое удаление файлов и записи
        original_path = Path(settings.data_dir) / photo.original_path
        if original_path.exists():
            original_path.unlink()

        if photo.thumbnail_path:
            thumbnail_path = Path(settings.data_dir) / photo.thumbnail_path
            if thumbnail_path.exists():
                thumbnail_path.unlink()

        if photo.processed_path:
            processed_path = Path(settings.data_dir) / photo.processed_path
            if processed_path.exists():
                processed_path.unlink()

        db.delete(photo)
    else:
        # Soft delete
        photo.deleted_at = datetime.utcnow()

    db.commit()
    return None


@router.get("/{person_id}/photos/{photo_id}/content")
def get_photo_content(
    person_id: UUID,
    photo_id: UUID,
    type: str = "original",  # original, processed, thumbnail
    db: Session = Depends(get_db),
):
    """
    Получить файл фотографии.

    Parameters:
    - type: "original" (оригинал), "processed" (обработанное лицо), "thumbnail" (миниатюра)
    """
    photo = (
        db.query(PersonPhoto)
        .filter(
            PersonPhoto.id == photo_id,
            PersonPhoto.person_id == person_id,
        )
        .first()
    )

    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found",
        )

    # Определение пути к файлу
    if type == "original":
        file_path = Path(settings.data_dir) / photo.original_path
    elif type == "thumbnail" and photo.thumbnail_path:
        file_path = Path(settings.data_dir) / photo.thumbnail_path
    elif type == "processed" and photo.processed_path:
        file_path = Path(settings.data_dir) / photo.processed_path
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Photo type '{type}' not available for this photo",
        )

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo file not found on disk",
        )

    return FileResponse(
        path=file_path,
        media_type="image/jpeg",
        filename=file_path.name,
    )
