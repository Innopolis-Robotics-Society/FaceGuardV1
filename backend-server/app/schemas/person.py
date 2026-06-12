"""Person schemas."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PersonBase(BaseModel):
    """Base person schema."""
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    access_enabled: bool = True


class PersonCreate(PersonBase):
    """Person creation schema."""
    pass


class PersonUpdate(BaseModel):
    """Person update schema."""
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    access_enabled: bool | None = None


class PersonResponse(PersonBase):
    """Person response schema."""
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None
    deleted_at: datetime | None
    photo_count: int = 0

    model_config = {"from_attributes": True}


class PhotoBase(BaseModel):
    """Base photo schema."""
    is_primary: bool = False


class PhotoCreate(PhotoBase):
    """Photo creation schema."""
    pass


class PhotoResponse(PhotoBase):
    """Photo response schema."""
    id: UUID
    person_id: UUID
    original_path: str
    processed_path: str | None
    thumbnail_path: str | None
    quality_score: float | None
    face_detected: bool
    width: int | None
    height: int | None
    created_at: datetime
    deleted_at: datetime | None

    model_config = {"from_attributes": True}
