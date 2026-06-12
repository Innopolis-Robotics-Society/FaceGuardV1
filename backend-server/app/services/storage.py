"""Storage service for file management."""
from __future__ import annotations

import hashlib
import shutil
from pathlib import Path
from typing import BinaryIO
from uuid import UUID

from app.core.config import settings


class StorageService:
    """Service for managing file storage."""

    def __init__(self):
        self.faces_dir = settings.faces_dir
        self.events_dir = settings.events_dir
        self.videos_dir = settings.videos_dir
        self.thumbnails_dir = settings.thumbnails_dir
        self.temp_dir = settings.temp_dir
        self.trash_dir = settings.trash_dir

    def create_person_directories(self, person_id: UUID) -> None:
        """Create directory structure for a person."""
        person_dir = self.faces_dir / str(person_id)
        (person_dir / "original").mkdir(parents=True, exist_ok=True)
        (person_dir / "processed").mkdir(parents=True, exist_ok=True)
        (person_dir / "thumbnails").mkdir(parents=True, exist_ok=True)

    async def save_person_photo(self, person_id: UUID, content: bytes, filename: str) -> str:
        """Save person photo and return relative path."""
        import uuid
        from datetime import datetime

        # Generate unique filename
        ext = Path(filename).suffix or ".jpg"
        photo_id = uuid.uuid4().hex[:12]
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        new_filename = f"photo_{timestamp}_{photo_id}{ext}"

        # Save to original directory
        person_dir = self.faces_dir / str(person_id) / "original"
        person_dir.mkdir(parents=True, exist_ok=True)

        file_path = person_dir / new_filename
        file_path.write_bytes(content)

        # Return relative path
        return f"faces/{person_id}/original/{new_filename}"

    def get_absolute_path(self, relative_path: str) -> Path:
        """Convert relative path to absolute path."""
        return settings.data_dir / relative_path

    def move_to_trash(self, relative_path: str) -> None:
        """Move file or directory to trash."""
        source = self.get_absolute_path(relative_path)
        if not source.exists():
            return

        # Create trash location
        trash_path = self.trash_dir / relative_path
        trash_path.parent.mkdir(parents=True, exist_ok=True)

        # Move to trash
        if source.is_dir():
            shutil.move(str(source), str(trash_path))
        else:
            shutil.move(str(source), str(trash_path))

    def calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of a file."""
        sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    def validate_path(self, relative_path: str) -> bool:
        """Validate that path doesn't escape data directory."""
        try:
            full_path = self.get_absolute_path(relative_path).resolve()
            data_dir_resolved = settings.data_dir.resolve()
            return str(full_path).startswith(str(data_dir_resolved))
        except (ValueError, OSError):
            return False
