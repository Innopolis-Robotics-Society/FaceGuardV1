"""Base class for face recognition models"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import numpy as np


class BaseRecognizer(ABC):
    """Abstract base class for face recognition"""

    def __init__(self):
        self.is_trained = False

    @abstractmethod
    def train_model(self) -> Dict[str, Any]:
        """Train the recognition model"""
        pass

    @abstractmethod
    def load_model(self):
        """Load existing trained model"""
        pass

    @abstractmethod
    def recognize_face(self, frame: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Recognize face in frame

        Args:
            frame: BGR image frame

        Returns:
            Dictionary with recognition results or None if no face detected
        """
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Get recognition service status"""
        pass

    def reload_model(self):
        """Reload model from disk (for updates)"""
        self.load_model()

    def delete_person_from_model(self, person_id: str) -> bool:
        """
        Remove person from model (requires retraining)

        Args:
            person_id: UUID of person to remove

        Returns:
            True if person was in model
        """
        from pathlib import Path
        from core.config import Config
        from core.logging import get_logger

        logger = get_logger(__name__)
        person_dir = Config.FACES_DIR / person_id

        if not person_dir.exists():
            logger.warning(f"Person directory not found: {person_id}")
            return False

        # Move to trash (soft delete)
        trash_dir = Config.DATA_DIR / "trash" / "faces" / person_id
        trash_dir.parent.mkdir(parents=True, exist_ok=True)

        if person_dir.exists():
            person_dir.rename(trash_dir)
            logger.info(f"Moved person {person_id} to trash")

        return True
