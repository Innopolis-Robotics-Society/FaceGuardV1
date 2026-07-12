"""Configuration management for FaceGuard Agent"""

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load .env file from agent directory
_env_path = Path(__file__).parent.parent / ".env"
load_dotenv(_env_path)


class Config:
    """Agent configuration from environment variables"""

    # Backend connection
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://backend:8000")
    DEVICE_ID: Optional[str] = os.getenv("DEVICE_ID")
    DEVICE_CODE: str = os.getenv("DEVICE_CODE", "rpi-main-001")

    # Hardware mode
    HARDWARE_MODE: str = os.getenv("HARDWARE_MODE", "development")  # development, raspberry_pi

    # Camera settings
    CAMERA_INDEX: int = int(os.getenv("CAMERA_INDEX", "0"))
    CAMERA_WIDTH: int = int(os.getenv("CAMERA_WIDTH", "640"))
    CAMERA_HEIGHT: int = int(os.getenv("CAMERA_HEIGHT", "480"))
    CAMERA_FPS: int = int(os.getenv("CAMERA_FPS", "30"))

    # Recognition settings
    RECOGNITION_MODEL: str = os.getenv("RECOGNITION_MODEL", "lbph")  # lbph, deepface
    DEEPFACE_MODEL: str = os.getenv("DEEPFACE_MODEL", "Facenet")  # VGG-Face, Facenet, OpenFace, ArcFace, DeepFace, DeepID, Dlib
    DEEPFACE_DISTANCE_METRIC: str = os.getenv("DEEPFACE_DISTANCE_METRIC", "cosine")  # cosine, euclidean, euclidean_l2
    RECOGNITION_THRESHOLD: float = float(os.getenv("RECOGNITION_THRESHOLD", "70"))
    MIN_FACE_SIZE: int = int(os.getenv("MIN_FACE_SIZE", "80"))
    FACE_SCALE_FACTOR: float = float(os.getenv("FACE_SCALE_FACTOR", "1.2"))
    FACE_MIN_NEIGHBORS: int = int(os.getenv("FACE_MIN_NEIGHBORS", "5"))

    # Liveness detection settings
    LIVENESS_ENABLED: bool = os.getenv("LIVENESS_ENABLED", "false").lower() == "true"
    LIVENESS_BLINK_REQUIRED: bool = os.getenv("LIVENESS_BLINK_REQUIRED", "true").lower() == "true"
    LIVENESS_MOTION_REQUIRED: bool = os.getenv("LIVENESS_MOTION_REQUIRED", "false").lower() == "true"
    LIVENESS_TIMEOUT_SECONDS: int = int(os.getenv("LIVENESS_TIMEOUT_SECONDS", "3"))

    # MiniFASNet Anti-Spoofing settings
    ANTISPOOFING_ENABLED: bool = os.getenv("ANTISPOOFING_ENABLED", "false").lower() == "true"
    ANTISPOOFING_THRESHOLD: float = float(os.getenv("ANTISPOOFING_THRESHOLD", "0.5"))  # 0-1, higher = stricter
    ANTISPOOFING_MODEL_PATH: Optional[str] = os.getenv("ANTISPOOFING_MODEL_PATH")  # Path to .pth model file
    ANTISPOOFING_DEVICE: str = os.getenv("ANTISPOOFING_DEVICE", "cpu")  # cpu or cuda

    # Door control
    SERVO_GPIO_PIN: int = int(os.getenv("SERVO_GPIO_PIN", "17"))
    DOOR_OPEN_DURATION: int = int(os.getenv("DOOR_OPEN_DURATION", "5"))
    ACTION_COOLDOWN_SECONDS: int = int(os.getenv("ACTION_COOLDOWN_SECONDS", "5"))

    # LED indicator
    LED_RED_PIN: int = int(os.getenv("LED_RED_PIN", "17"))
    LED_GREEN_PIN: int = int(os.getenv("LED_GREEN_PIN", "27"))
    LED_BLUE_PIN: int = int(os.getenv("LED_BLUE_PIN", "22"))
    LED_DURATION: float = float(os.getenv("LED_DURATION", "2.0"))

    # Data directories
    BASE_DIR: Path = Path(__file__).parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    FACES_DIR: Path = DATA_DIR / "faces"
    EVENTS_DIR: Path = DATA_DIR / "events"
    MODELS_DIR: Path = DATA_DIR / "models"
    LOGS_DIR: Path = DATA_DIR / "logs"

    # Model files
    MODEL_FILE: Path = MODELS_DIR / "face_model.yml"
    LABELS_FILE: Path = MODELS_DIR / "labels.json"

    # Database
    DATABASE_FILE: Path = DATA_DIR / "agent.db"

    # Sync settings
    HEARTBEAT_INTERVAL: int = int(os.getenv("HEARTBEAT_INTERVAL", "10"))
    TELEMETRY_INTERVAL: int = int(os.getenv("TELEMETRY_INTERVAL", "30"))
    SYNC_INTERVAL: int = int(os.getenv("SYNC_INTERVAL", "60"))
    COMMAND_POLL_INTERVAL: int = int(os.getenv("COMMAND_POLL_INTERVAL", "5"))

    # Stream server
    STREAM_PORT: int = int(os.getenv("STREAM_PORT", "8001"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @classmethod
    def ensure_directories(cls):
        """Create all required directories"""
        cls.DATA_DIR.mkdir(parents=True, exist_ok=True)
        cls.FACES_DIR.mkdir(parents=True, exist_ok=True)
        cls.EVENTS_DIR.mkdir(parents=True, exist_ok=True)
        cls.MODELS_DIR.mkdir(parents=True, exist_ok=True)
        cls.LOGS_DIR.mkdir(parents=True, exist_ok=True)

    @classmethod
    def is_raspberry_pi(cls) -> bool:
        """Check if running on Raspberry Pi"""
        return cls.HARDWARE_MODE == "raspberry_pi"

    @classmethod
    def validate(cls):
        """Validate configuration"""
        errors = []

        if not cls.DEVICE_CODE:
            errors.append("DEVICE_CODE is required")

        if cls.RECOGNITION_THRESHOLD <= 0:
            errors.append("RECOGNITION_THRESHOLD must be positive")

        if cls.HEARTBEAT_INTERVAL <= 0:
            errors.append("HEARTBEAT_INTERVAL must be positive")

        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")

        return True


# Initialize directories on import
Config.ensure_directories()
