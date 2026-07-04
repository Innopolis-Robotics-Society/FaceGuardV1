"""DeepFace recognition using multiple models"""

import cv2
import json
import numpy as np
from pathlib import Path
from typing import Optional, Dict, Any, List

from core.config import Config
from core.logging import get_logger
from recognition.base_recognizer import BaseRecognizer


logger = get_logger(__name__)


class DeepFaceRecognizer(BaseRecognizer):
    """DeepFace recognition service with multiple model support"""

    def __init__(self):
        super().__init__()
        self.model_name = Config.DEEPFACE_MODEL
        self.distance_metric = Config.DEEPFACE_DISTANCE_METRIC
        self.embeddings_db: Dict[str, List[np.ndarray]] = {}
        self.face_detector = None

        # Lazy import DeepFace
        try:
            from deepface import DeepFace
            self.DeepFace = DeepFace
            logger.info(f"DeepFace loaded with model: {self.model_name}")
        except ImportError:
            logger.error("DeepFace not installed. Install with: pip install deepface")
            raise

        # Model file paths
        self.embeddings_file = Config.MODELS_DIR / f"deepface_embeddings_{self.model_name.lower()}.json"

        # Try to load existing model
        if self.embeddings_file.exists():
            try:
                self.load_model()
            except Exception as e:
                logger.warning(f"Failed to load existing DeepFace model: {e}")

    def _get_distance_threshold(self) -> float:
        """Get threshold based on model and distance metric"""
        # Default thresholds from DeepFace documentation
        thresholds = {
            "VGG-Face": {"cosine": 0.40, "euclidean": 0.60, "euclidean_l2": 0.86},
            "Facenet": {"cosine": 0.40, "euclidean": 10, "euclidean_l2": 0.80},
            "Facenet512": {"cosine": 0.30, "euclidean": 23.56, "euclidean_l2": 1.04},
            "OpenFace": {"cosine": 0.10, "euclidean": 0.55, "euclidean_l2": 0.55},
            "DeepFace": {"cosine": 0.23, "euclidean": 64, "euclidean_l2": 0.64},
            "DeepID": {"cosine": 0.015, "euclidean": 45, "euclidean_l2": 0.17},
            "ArcFace": {"cosine": 0.68, "euclidean": 4.15, "euclidean_l2": 1.13},
            "Dlib": {"cosine": 0.07, "euclidean": 0.60, "euclidean_l2": 0.40},
        }

        return thresholds.get(self.model_name, {}).get(self.distance_metric, 0.40)

    def train_model(self) -> Dict[str, Any]:
        """
        Build embeddings database for all processed face images

        Returns:
            Dictionary with training results
        """
        logger.info(f"Starting DeepFace embedding generation with model: {self.model_name}...")

        embeddings_db: Dict[str, List[np.ndarray]] = {}
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

            person_embeddings = []
            people_count += 1

            # Generate embeddings for all photos
            for photo_path in person_photos:
                try:
                    # Generate embedding
                    embedding_objs = self.DeepFace.represent(
                        img_path=str(photo_path),
                        model_name=self.model_name,
                        enforce_detection=False
                    )

                    if embedding_objs and len(embedding_objs) > 0:
                        embedding = embedding_objs[0]["embedding"]
                        person_embeddings.append(np.array(embedding))
                        total_photos += 1
                    else:
                        logger.warning(f"No embedding generated for: {photo_path}")

                except Exception as e:
                    logger.error(f"Error processing {photo_path}: {e}")
                    continue

            if person_embeddings:
                embeddings_db[person_id] = person_embeddings
                logger.info(f"Generated {len(person_embeddings)} embeddings for person {person_id}")

        # Validate training data
        if len(embeddings_db) == 0:
            raise RuntimeError("No embeddings generated. Add people with photos first.")

        logger.info(f"Generated embeddings for {people_count} people, {total_photos} photos")

        # Save embeddings
        Config.MODELS_DIR.mkdir(parents=True, exist_ok=True)

        # Convert numpy arrays to lists for JSON serialization
        serializable_db = {
            person_id: [emb.tolist() for emb in embeddings]
            for person_id, embeddings in embeddings_db.items()
        }

        with open(self.embeddings_file, "w", encoding="utf-8") as f:
            json.dump({
                "model": self.model_name,
                "distance_metric": self.distance_metric,
                "embeddings": serializable_db
            }, f, ensure_ascii=False, indent=2)

        self.embeddings_db = embeddings_db
        self.is_trained = True

        logger.info(f"DeepFace embeddings saved: {people_count} people, {total_photos} photos")

        return {
            "success": True,
            "model": f"DeepFace-{self.model_name}",
            "people_count": people_count,
            "photos_count": total_photos,
            "embeddings_path": str(self.embeddings_file),
            "distance_metric": self.distance_metric
        }

    def load_model(self):
        """Load existing embeddings database"""
        if not self.embeddings_file.exists():
            raise FileNotFoundError(f"Embeddings file not found: {self.embeddings_file}")

        with open(self.embeddings_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Check model compatibility
        if data.get("model") != self.model_name:
            logger.warning(f"Model mismatch: file has {data.get('model')}, config has {self.model_name}")

        # Convert lists back to numpy arrays
        self.embeddings_db = {
            person_id: [np.array(emb) for emb in embeddings]
            for person_id, embeddings in data["embeddings"].items()
        }

        self.is_trained = True
        logger.info(f"DeepFace embeddings loaded: {len(self.embeddings_db)} people")

    def recognize_face(self, frame: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Recognize face in frame using DeepFace

        Args:
            frame: BGR image frame

        Returns:
            Dictionary with recognition results or None if no face detected
        """
        if not self.is_trained or len(self.embeddings_db) == 0:
            logger.warning("DeepFace model not trained, cannot recognize")
            return None

        try:
            # Generate embedding for the current frame
            embedding_objs = self.DeepFace.represent(
                img_path=frame,
                model_name=self.model_name,
                enforce_detection=True,
                detector_backend="opencv"
            )

            if not embedding_objs or len(embedding_objs) == 0:
                return None

            # Get first face
            result = embedding_objs[0]
            current_embedding = np.array(result["embedding"])
            face_region = result.get("facial_area", {})

            # Find best match
            best_person_id = None
            best_distance = float('inf')

            for person_id, person_embeddings in self.embeddings_db.items():
                for stored_embedding in person_embeddings:
                    distance = self._calculate_distance(current_embedding, stored_embedding)

                    if distance < best_distance:
                        best_distance = distance
                        best_person_id = person_id

            # Check threshold
            threshold = self._get_distance_threshold()
            recognized = best_distance < threshold

            # Convert distance to percentage (0-100, where 100 = perfect match)
            # DeepFace returns distance: 0 = perfect match, higher = worse
            # Formula: confidence% = 100 - (distance / max_distance * 100)
            # We use threshold * 2 as max_distance to get better scaling
            max_distance = threshold * 2
            confidence_percent = max(0, min(100, 100 - (best_distance / max_distance * 100)))

            return {
                "recognized": recognized,
                "person_id": best_person_id if recognized else None,
                "confidence": float(confidence_percent),  # Now 0-100%
                "raw_distance": float(best_distance),  # Original distance value
                "threshold": threshold,
                "distance_metric": self.distance_metric,
                "face_bbox": {
                    "x": int(face_region.get("x", 0)),
                    "y": int(face_region.get("y", 0)),
                    "w": int(face_region.get("w", 0)),
                    "h": int(face_region.get("h", 0))
                },
                "faces_detected": len(embedding_objs),
                "model": f"DeepFace-{self.model_name}"
            }

        except Exception as e:
            logger.error(f"Error in DeepFace recognition: {e}")
            return None

    def _calculate_distance(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """Calculate distance between two embeddings"""
        if self.distance_metric == "cosine":
            # Cosine similarity
            dot_product = np.dot(embedding1, embedding2)
            norm1 = np.linalg.norm(embedding1)
            norm2 = np.linalg.norm(embedding2)
            return 1 - (dot_product / (norm1 * norm2))

        elif self.distance_metric == "euclidean":
            return np.linalg.norm(embedding1 - embedding2)

        elif self.distance_metric == "euclidean_l2":
            # Normalized euclidean
            return np.linalg.norm(embedding1 / np.linalg.norm(embedding1) -
                                 embedding2 / np.linalg.norm(embedding2))

        else:
            raise ValueError(f"Unknown distance metric: {self.distance_metric}")

    def get_status(self) -> Dict[str, Any]:
        """Get recognition service status"""
        return {
            "model": f"DeepFace-{self.model_name}",
            "is_trained": self.is_trained,
            "people_count": len(self.embeddings_db),
            "embeddings_exists": self.embeddings_file.exists(),
            "threshold": self._get_distance_threshold(),
            "distance_metric": self.distance_metric,
            "people": list(self.embeddings_db.keys()) if self.is_trained else []
        }
