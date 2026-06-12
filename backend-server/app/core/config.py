"""Application configuration."""
from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Application
    environment: Literal["development", "production", "test"] = "development"
    app_name: str = "FaceGuard Backend"
    app_version: str = "1.0.0"
    debug: bool = False

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1

    # Database
    database_url: str = "postgresql://faceguard:faceguard@localhost:5432/faceguard"
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Security
    secret_key: str = Field(default="change-this-secret-key-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.strip("[]").replace('"', "").split(",")]
        return v

    # File Storage
    data_dir: Path = BASE_DIR / "data"
    faces_dir: Path = BASE_DIR / "data" / "faces"
    events_dir: Path = BASE_DIR / "data" / "events"
    videos_dir: Path = BASE_DIR / "data" / "videos"
    thumbnails_dir: Path = BASE_DIR / "data" / "thumbnails"
    recognition_dir: Path = BASE_DIR / "data" / "recognition"
    logs_dir: Path = BASE_DIR / "data" / "logs"
    backups_dir: Path = BASE_DIR / "data" / "backups"
    temp_dir: Path = BASE_DIR / "data" / "temporary"
    trash_dir: Path = BASE_DIR / "data" / "trash"

    # File Limits
    max_upload_size_mb: int = 10
    allowed_image_extensions: list[str] = Field(default_factory=lambda: ["jpg", "jpeg", "png"])
    allowed_video_extensions: list[str] = Field(default_factory=lambda: ["mp4", "avi", "mkv"])

    @field_validator("allowed_image_extensions", "allowed_video_extensions", mode="before")
    @classmethod
    def parse_extensions(cls, v):
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",")]
        return v

    # Telemetry
    telemetry_retention_days: int = 7
    telemetry_aggregation_enabled: bool = True

    # Audit
    audit_log_retention_days: int = 365

    # Backups
    backup_retention_days: int = 30
    backup_auto_cleanup: bool = True

    # WebSocket
    ws_heartbeat_interval: int = 30
    ws_timeout: int = 60

    # Logging
    log_level: str = "INFO"
    log_format: Literal["json", "text"] = "json"

    def ensure_directories(self) -> None:
        """Create all required directories."""
        for directory in (
            self.data_dir,
            self.faces_dir,
            self.events_dir,
            self.videos_dir,
            self.thumbnails_dir,
            self.recognition_dir,
            self.logs_dir,
            self.backups_dir,
            self.temp_dir,
            self.trash_dir,
        ):
            directory.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_directories()
