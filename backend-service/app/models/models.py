from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="admin")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    audit_logs = relationship("AuditLog", back_populates="user")


class Person(Base):
    __tablename__ = "people"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    access_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    photos = relationship("PersonPhoto", back_populates="person", cascade="all, delete-orphan")
    events = relationship("AccessEvent", back_populates="person")


class PersonPhoto(Base):
    __tablename__ = "person_photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=False, index=True)
    original_path = Column(String(500), nullable=False)
    processed_path = Column(String(500), nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    quality_score = Column(Float, nullable=True)
    face_detected = Column(Boolean, default=False, nullable=False)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    blur_score = Column(Float, nullable=True)
    brightness_score = Column(Float, nullable=True)
    file_hash = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    person = relationship("Person", back_populates="photos")


class Device(Base):
    __tablename__ = "devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    device_code = Column(String(100), unique=True, nullable=False, index=True)
    status = Column(String(50), default="offline", nullable=False)
    ip_address = Column(String(50), nullable=True)
    last_seen_at = Column(DateTime, nullable=True)
    software_version = Column(String(50), nullable=True)
    camera_status = Column(String(50), nullable=True)
    recognition_status = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    events = relationship("AccessEvent", back_populates="device")
    telemetry = relationship("Telemetry", back_populates="device")
    commands = relationship("DeviceCommand", back_populates="device")


class AccessEvent(Base):
    __tablename__ = "access_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id"), nullable=False, index=True)
    person_id = Column(UUID(as_uuid=True), ForeignKey("people.id"), nullable=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    confidence = Column(Float, nullable=True)
    door_opened = Column(Boolean, default=False, nullable=False)
    photo_path = Column(String(500), nullable=True)
    video_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    device = relationship("Device", back_populates="events")
    person = relationship("Person", back_populates="events")


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id"), nullable=False, index=True)
    cpu_usage = Column(Float, nullable=True)
    cpu_temperature = Column(Float, nullable=True)
    ram_usage = Column(Float, nullable=True)
    disk_usage = Column(Float, nullable=True)
    uptime = Column(Integer, nullable=True)
    camera_fps = Column(Float, nullable=True)
    network_status = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    device = relationship("Device", back_populates="telemetry")


class DeviceCommand(Base):
    __tablename__ = "device_commands"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id"), nullable=False, index=True)
    command_type = Column(String(100), nullable=False)
    parameters = Column(Text, nullable=True)
    status = Column(String(50), default="pending", nullable=False, index=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    result = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    device = relationship("Device", back_populates="commands")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="audit_logs")


class Backup(Base):
    __tablename__ = "backups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    size = Column(Integer, nullable=True)
    checksum = Column(String(64), nullable=True)
    status = Column(String(50), default="completed", nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
