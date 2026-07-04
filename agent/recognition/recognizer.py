"""Face recognition service using OpenCV LBPH"""

import cv2
import json
import numpy as np
from pathlib import Path
from typing import Optional, Dict, Any, Tuple, List
import os

from core.config import Config
from core.logging import get_logger
from recognition.score import is_distance_match


logger = get_logger(__name__)


class RecognitionService:
    """OpenCV LBPH face recognition service"""

    def __init__(self):
        self.recognizer: Optional[cv2.face.LBPHFaceRecognizer] = None
        self.label_map: Dict[int, str] = {}
        self.face_detector = self._load_face_detector()
        self.is_trained = False

        # Try to load existing model
        if Config.MODEL_FILE.exists() and Config.LABELS_FILE.exists():
            try:
                self.load_model()
            except Exception as e:
                logger.warning(f"Failed to load existing model: {e}")

    def _load_face_detector(self):
        """Load Haar Cascade face detector"""
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        detector = cv2.CascadeClassifier(cascade_path)

        if detector.empty():
            raise RuntimeError("Failed to load Haar Cascade face detector")

        logger.info("Face detector loaded successfully")
        return detector

    def train_model(self) -> Dict[str, Any]:
        """
        Train LBPH model on all processed face images

        Returns:
            Dictionary with training results
        """
        logger.info("Starting model training...")

        faces: List[np.ndarray] = []
        labels: List[int] = []
        label_map: Dict[int, str] = {}
        current_label = 0
        people_count = 0
        total_photos = 0

        if not Config.FACES_DIR.exists():
            raise RuntimeError(f"Faces directory not found: {Config.FACES_DIR}")

        # Iterate through person directories
        for person_dir in Config.FACES_DIR.iterdir():
            if not person_dir.is_dir():
                continue

            person_id = person_dir.name
            processed_dir = person_dir / "processed"

            if not processed_dir.exists():
                logger.warning(f"No processed directory for person {person_id}")
                continue

            # Count photos for this person
            person_photos = list(processed_dir.glob("*.jpg"))
            if len(person_photos) == 0:
                logger.warning(f"No photos found for person {person_id}")
                continue

            # Assign label
            label_map[current_label] = person_id
            people_count += 1

            # Load all processed face images
            for photo_path in person_photos:
                try:
                    face_img = cv2.imread(str(photo_path), cv2.IMREAD_GRAYSCALE)

                    if face_img is None:
                        logger.warning(f"Failed to read image: {photo_path}")
                        continue

                    # Ensure correct size (200x200)
                    if face_img.shape != (200, 200):
                        face_img = cv2.resize(face_img, (200, 200))

                    faces.append(face_img)
                    labels.append(current_label)
                    total_photos += 1

                except Exception as e:
                    logger.error(f"Error processing {photo_path}: {e}")
                    continue

            logger.info(f"Loaded {len(person_photos)} photos for person {person_id} (label {current_label})")
            current_label += 1

        # Validate training data
        if len(faces) == 0:
            raise RuntimeError("No faces found for training. Add people with photos first.")

        if people_count == 0:
            raise RuntimeError("No people found for training")

        logger.info(f"Training with {total_photos} photos from {people_count} people")

        # Create and train recognizer
        self.recognizer = cv2.face.LBPHFaceRecognizer_create(
            radius=1,
            neighbors=8,
            grid_x=8,
            grid_y=8
        )

        self.recognizer.train(faces, np.array(labels))
        self.label_map = label_map
        self.is_trained = True

        # Save model
        Config.MODELS_DIR.mkdir(parents=True, exist_ok=True)
        self.recognizer.save(str(Config.MODEL_FILE))

        with open(Config.LABELS_FILE, "w", encoding="utf-8") as f:
            json.dump(label_map, f, ensure_ascii=False, indent=2)

        logger.info(f"Model trained and saved: {people_count} people, {total_photos} photos")

        return {
            "success": True,
            "people_count": people_count,
            "photos_count": total_photos,
            "model_path": str(Config.MODEL_FILE),
            "labels_path": str(Config.LABELS_FILE)
        }

    def load_model(self):
        """Load existing trained model"""
        if not Config.MODEL_FILE.exists():
            raise FileNotFoundError(f"Model file not found: {Config.MODEL_FILE}")

        if not Config.LABELS_FILE.exists():
            raise FileNotFoundError(f"Labels file not found: {Config.LABELS_FILE}")

        # Load recognizer
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        self.recognizer.read(str(Config.MODEL_FILE))

        # Load label map
        with open(Config.LABELS_FILE, "r", encoding="utf-8") as f:
            label_map_str = json.load(f)
            self.label_map = {int(k): v for k, v in label_map_str.items()}

        self.is_trained = True
        logger.info(f"Model loaded successfully: {len(self.label_map)} people")

    def reload_model(self):
        """Reload model from disk (for updates)"""
        logger.info("Reloading model...")
        self.load_model()
        logger.info("Model reloaded successfully")

    def recognize_face(self, frame: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Recognize face in frame

        Args:
            frame: BGR image frame

        Returns:
            Dictionary with recognition results or None if no face detected
        """
        if not self.is_trained or self.recognizer is None:
            logger.warning("Model not trained, cannot recognize")
            return None

        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Detect faces
        faces = self.face_detector.detectMultiScale(
            gray,
            scaleFactor=Config.FACE_SCALE_FACTOR,
            minNeighbors=Config.FACE_MIN_NEIGHBORS,
            minSize=(Config.MIN_FACE_SIZE, Config.MIN_FACE_SIZE)
        )

        if len(faces) == 0:
            return None

        # Process first detected face
        x, y, w, h = faces[0]
        face_roi = gray[y:y + h, x:x + w]
        face_resized = cv2.resize(face_roi, (200, 200))

        # Predict
        label, confidence = self.recognizer.predict(face_resized)

        # OpenCV LBPH returns a distance score where lower is a better match.
        recognized = is_distance_match(confidence, Config.RECOGNITION_THRESHOLD)
        person_id = self.label_map.get(label) if recognized else None

        return {
            "recognized": recognized,
            "person_id": person_id,
            "label": int(label),
            "confidence": float(confidence),
            "threshold": Config.RECOGNITION_THRESHOLD,
            "face_bbox": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)},
            "faces_detected": len(faces)
        }

    def get_status(self) -> Dict[str, Any]:
        """Get recognition service status"""
        return {
            "is_trained": self.is_trained,
            "people_count": len(self.label_map),
            "model_exists": Config.MODEL_FILE.exists(),
            "labels_exists": Config.LABELS_FILE.exists(),
            "threshold": Config.RECOGNITION_THRESHOLD,
            "people": list(self.label_map.values()) if self.is_trained else []
        }

    def delete_person_from_model(self, person_id: str) -> bool:
        """
        Remove person from model (requires retraining)

        Args:
            person_id: UUID of person to remove

        Returns:
            True if person was in model
        """
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
