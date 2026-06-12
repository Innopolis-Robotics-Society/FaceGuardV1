from __future__ import annotations

import platform
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "FaceGuard Raspberry Pi Agent"
    app_version: str = "0.2.0"
    environment: Literal["development", "production", "test"] = "development"
    host: str = "0.0.0.0"
    port: int = 8081
    api_key: str = "change-me-agent-key"

    device_id: str = Field(default_factory=lambda: platform.node() or "faceguard-device")
    device_name: str = "FaceGuard Device"

    data_dir: Path = BASE_DIR / "data"
    faces_dir: Path = BASE_DIR / "data" / "faces"
    models_dir: Path = BASE_DIR / "data" / "models"
    captures_dir: Path = BASE_DIR / "data" / "captures"
    events_dir: Path = BASE_DIR / "data" / "events"
    logs_dir: Path = BASE_DIR / "data" / "logs"
    backups_dir: Path = BASE_DIR / "data" / "backups"
    sqlite_path: Path = BASE_DIR / "data" / "agent.db"

    camera_index: int = 0
    camera_width: int = 640
    camera_height: int = 480
    camera_fps: int = 15
    camera_jpeg_quality: int = 85
    camera_retry_seconds: float = 2.0
    camera_allow_simulation: bool = True

    recognition_enabled: bool = True
    recognition_interval_seconds: float = 0.25
    recognition_threshold: float = 65.0
    recognition_cooldown_seconds: float = 5.0
    unknown_cooldown_seconds: float = 10.0
    face_width: int = 200
    face_height: int = 200
    min_face_size: int = 80

    hardware_mode: Literal["auto", "mock", "raspberry_pi"] = "auto"
    servo_gpio_pin: int = 17
    servo_open_value: float = 0.8
    servo_closed_value: float = -0.8
    door_open_seconds: float = 2.0
    system_commands_enabled: bool = False
    agent_service_name: str = "faceguard-agent"

    heartbeat_interval_seconds: float = 10.0
    central_server_url: str | None = None
    central_device_token: str | None = None
    central_timeout_seconds: float = 5.0

    log_level: str = "INFO"
    log_max_bytes: int = 5_000_000
    log_backup_count: int = 5

    def ensure_directories(self) -> None:
        for directory in (
            self.data_dir,
            self.faces_dir,
            self.models_dir,
            self.captures_dir,
            self.events_dir,
            self.logs_dir,
            self.backups_dir,
        ):
            directory.mkdir(parents=True, exist_ok=True)

    @property
    def model_path(self) -> Path:
        return self.models_dir / "face_model.yml"

    @property
    def labels_path(self) -> Path:
        return self.models_dir / "labels.json"

    @property
    def is_windows(self) -> bool:
        return platform.system().lower() == "windows"

    @property
    def is_raspberry_pi(self) -> bool:
        try:
            model_path = Path("/proc/device-tree/model")
            return model_path.exists() and "raspberry pi" in model_path.read_text(errors="ignore").lower()
        except OSError:
            return False

    @property
    def resolved_hardware_mode(self) -> Literal["mock", "raspberry_pi"]:
        if self.hardware_mode == "mock":
            return "mock"
        if self.hardware_mode == "raspberry_pi":
            return "raspberry_pi"
        return "raspberry_pi" if self.is_raspberry_pi else "mock"


settings = Settings()
settings.ensure_directories()
