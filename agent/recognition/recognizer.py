"""Face recognition service with multiple model support"""

from typing import Optional, Dict, Any
import numpy as np

from core.config import Config
from core.logging import get_logger
from recognition.base_recognizer import BaseRecognizer


logger = get_logger(__name__)


class RecognitionService:
    """
    Unified face recognition service that supports multiple models.

    Model can be selected via RECOGNITION_MODEL environment variable:
    - lbph: OpenCV LBPH (default, fast, works offline)
    - deepface: DeepFace with multiple model options (more accurate)
    """

    def __init__(self):
        self._recognizer: Optional[BaseRecognizer] = None
        self._init_recognizer()

    def _init_recognizer(self):
        """Initialize the selected recognition model"""
        model_type = Config.RECOGNITION_MODEL.lower()

        logger.info(f"Initializing recognition service with model: {model_type}")

        if model_type == "lbph":
            from recognition.lbph_recognizer import LBPHRecognizer
            self._recognizer = LBPHRecognizer()

        elif model_type == "deepface":
            from recognition.deepface_recognizer import DeepFaceRecognizer
            self._recognizer = DeepFaceRecognizer()

        else:
            logger.error(f"Unknown recognition model: {model_type}. Falling back to LBPH.")
            from recognition.lbph_recognizer import LBPHRecognizer
            self._recognizer = LBPHRecognizer()

        logger.info(f"Recognition service initialized: {self._recognizer.__class__.__name__}")

    @property
    def is_trained(self) -> bool:
        """Check if the model is trained"""
        return self._recognizer.is_trained if self._recognizer else False

    def train_model(self) -> Dict[str, Any]:
        """Train the recognition model"""
        if not self._recognizer:
            raise RuntimeError("Recognizer not initialized")
        return self._recognizer.train_model()

    def load_model(self):
        """Load existing trained model"""
        if not self._recognizer:
            raise RuntimeError("Recognizer not initialized")
        self._recognizer.load_model()

    def reload_model(self):
        """Reload model from disk (for updates)"""
        if not self._recognizer:
            raise RuntimeError("Recognizer not initialized")
        logger.info("Reloading model...")
        self._recognizer.reload_model()
        logger.info("Model reloaded successfully")

    def recognize_face(self, frame: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Recognize face in frame

        Args:
            frame: BGR image frame

        Returns:
            Dictionary with recognition results or None if no face detected
        """
        if not self._recognizer:
            raise RuntimeError("Recognizer not initialized")
        return self._recognizer.recognize_face(frame)

    def get_status(self) -> Dict[str, Any]:
        """Get recognition service status"""
        if not self._recognizer:
            return {
                "error": "Recognizer not initialized",
                "is_trained": False
            }

        status = self._recognizer.get_status()
        status["active_model"] = Config.RECOGNITION_MODEL

        if Config.RECOGNITION_MODEL.lower() == "deepface":
            status["deepface_model"] = Config.DEEPFACE_MODEL
            status["distance_metric"] = Config.DEEPFACE_DISTANCE_METRIC

        return status

    def delete_person_from_model(self, person_id: str) -> bool:
        """
        Remove person from model (requires retraining)

        Args:
            person_id: UUID of person to remove

        Returns:
            True if person was in model
        """
        if not self._recognizer:
            raise RuntimeError("Recognizer not initialized")
        return self._recognizer.delete_person_from_model(person_id)
