from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# User/Auth schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    role: str = Field(default="admin", pattern="^(admin|superadmin)$")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[UUID] = None


class LoginRequest(BaseModel):
    username: str
    password: str


# Person schemas
class PersonBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    access_enabled: bool = True


class PersonCreate(PersonBase):
    pass


class PersonUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    access_enabled: Optional[bool] = None


class PersonResponse(PersonBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID] = None
    deleted_at: Optional[datetime] = None
    photo_count: int = 0

    class Config:
        from_attributes = True


# PersonPhoto schemas
class PersonPhotoBase(BaseModel):
    is_primary: bool = False


class PersonPhotoCreate(PersonPhotoBase):
    person_id: UUID


class PersonPhotoResponse(PersonPhotoBase):
    id: UUID
    person_id: UUID
    original_path: str
    processed_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    quality_score: Optional[float] = None
    face_detected: bool = False
    width: Optional[int] = None
    height: Optional[int] = None
    blur_score: Optional[float] = None
    brightness_score: Optional[float] = None
    file_hash: Optional[str] = None
    created_at: datetime
    created_by: Optional[UUID] = None
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Device schemas
class DeviceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    device_code: str = Field(..., min_length=1, max_length=100)


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = None
    ip_address: Optional[str] = None
    software_version: Optional[str] = None
    camera_status: Optional[str] = None
    recognition_status: Optional[str] = None


class DeviceResponse(DeviceBase):
    id: UUID
    status: str
    ip_address: Optional[str] = None
    last_seen_at: Optional[datetime] = None
    software_version: Optional[str] = None
    camera_status: Optional[str] = None
    recognition_status: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# AccessEvent schemas
class AccessEventBase(BaseModel):
    device_id: UUID
    person_id: Optional[UUID] = None
    event_type: str = Field(..., min_length=1, max_length=50)
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    door_opened: bool = False
    photo_path: Optional[str] = None
    video_path: Optional[str] = None


class AccessEventCreate(AccessEventBase):
    pass


class AccessEventResponse(AccessEventBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Telemetry schemas
class TelemetryBase(BaseModel):
    device_id: UUID
    cpu_usage: Optional[float] = Field(None, ge=0.0, le=100.0)
    cpu_temperature: Optional[float] = None
    ram_usage: Optional[float] = Field(None, ge=0.0, le=100.0)
    disk_usage: Optional[float] = Field(None, ge=0.0, le=100.0)
    uptime: Optional[int] = Field(None, ge=0)
    camera_fps: Optional[float] = Field(None, ge=0.0)
    network_status: Optional[str] = None


class TelemetryCreate(TelemetryBase):
    pass


class TelemetryResponse(TelemetryBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# DeviceCommand schemas
class DeviceCommandBase(BaseModel):
    device_id: UUID
    command_type: str = Field(..., min_length=1, max_length=100)
    parameters: Optional[str] = None


class DeviceCommandCreate(DeviceCommandBase):
    pass


class DeviceCommandUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[str] = None
    error_message: Optional[str] = None


class DeviceCommandResponse(DeviceCommandBase):
    id: UUID
    status: str
    created_by: Optional[UUID] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[str] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True
