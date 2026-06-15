"""Face capture service for registering new people"""

import cv2
import time
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from agent.core.config import Config
from agent.core.logging import get_logger
from agent.camera.camera_service import CameraService


logger = get_logger(__name__)


class CaptureService:
    """Service for capturing multiple photos for person registration"""

    def __init__(self, camera_service: CameraService):
        self.camera = camera_service
        self.face_detector = self._load_face_detector()

    def _load_face_detector(self):
        """Load Haar Cascade face detector"""
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        detector = cv2.CascadeClassifier(cascade_path)

        if detector.empty():
            raise RuntimeError("Failed to load Haar Cascade face detector")

        return detector

    def capture_person_photos(
        self,
        person_id: str,
        count: int = 15,
        interval: float = 0.5,
        strict_face_detection: bool = True
    ) -> Dict[str, Any]:
        """
        Capture multiple photos for person registration

        Args:
            person_id: UUID of the person
            count: Number of photos to capture
            interval: Seconds between captures
            strict_face_detection: Require exactly one face per photo

        Returns:
            Dictionary with capture results
        """
        logger.info(f"Starting photo capture for person {person_id}: {count} photos")

        # Create person directories
        person_dir = Config.FACES_DIR / person_id
        original_dir = person_dir / "original"
        processed_dir = person_dir / "processed"

        original_dir.mkdir(parents=True, exist_ok=True)
        processed_dir.mkdir(parents=True, exist_ok=True)

        captured_photos = []
        skipped_photos = []

        for i in range(count):
            try:
                # Capture frame
                frame = self.camera.capture_frame()

                if frame is None:
                    logger.warning(f"Failed to capture frame {i + 1}/{count}")
                    skipped_photos.append({"index": i + 1, "reason": "camera_error"})
                    time.sleep(interval)
                    continue

                # Convert to grayscale for face detection
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

                # Detect faces
                faces = self.face_detector.detectMultiScale(
                    gray,
                    scaleFactor=Config.FACE_SCALE_FACTOR,
                    minNeighbors=Config.FACE_MIN_NEIGHBORS,
                    minSize=(Config.MIN_FACE_SIZE, Config.MIN_FACE_SIZE)
                )

                # Validate face detection
                if strict_face_detection:
                    if len(faces) == 0:
                        logger.warning(f"No face detected in frame {i + 1}/{count}")
                        skipped_photos.append({"index": i + 1, "reason": "no_face"})
                        time.sleep(interval)
                        continue
                    elif len(faces) > 1:
                        logger.warning(f"Multiple faces detected in frame {i + 1}/{count}")
                        skipped_photos.append({"index": i + 1, "reason": "multiple_faces"})
                        time.sleep(interval)
                        continue

                # Save original photo
                timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")[:-3]
                original_filename = f"photo_{timestamp}_{i + 1:03d}.jpg"
                original_path = original_dir / original_filename

                cv2.imwrite(str(original_path), frame)

                # Process and save face
                if len(faces) > 0:
                    x, y, w, h = faces[0]
                    face_roi = gray[y:y + h, x:x + w]
                    face_resized = cv2.resize(face_roi, (200, 200))

                    processed_filename = f"face_{timestamp}_{i + 1:03d}.jpg"
                    processed_path = processed_dir / processed_filename

                    cv2.imwrite(str(processed_path), face_resized)

                    captured_photos.append({
                        "index": i + 1,
                        "original_path": str(original_path.relative_to(Config.DATA_DIR)),
                        "processed_path": str(processed_path.relative_to(Config.DATA_DIR)),
                        "face_detected": True,
                        "face_bbox": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
                    })

                    logger.info(f"Captured photo {i + 1}/{count} for {person_id}")
                else:
                    captured_photos.append({
                        "index": i + 1,
                        "original_path": str(original_path.relative_to(Config.DATA_DIR)),
                        "processed_path": None,
                        "face_detected": False
                    })

                # Wait before next capture
                if i < count - 1:
                    time.sleep(interval)

            except Exception as e:
                logger.error(f"Error capturing photo {i + 1}/{count}: {e}")
                skipped_photos.append({"index": i + 1, "reason": str(e)})

        result = {
            "person_id": person_id,
            "requested_count": count,
            "captured_count": len(captured_photos),
            "skipped_count": len(skipped_photos),
            "photos": captured_photos,
            "skipped": skipped_photos,
            "success": len(captured_photos) > 0
        }

        logger.info(
            f"Photo capture completed: {len(captured_photos)} captured, "
            f"{len(skipped_photos)} skipped"
        )

        return result

    def upload_photo(
        self,
        person_id: str,
        image_data: bytes,
        filename: str
    ) -> Dict[str, Any]:
        """
        Process and save uploaded photo

        Args:
            person_id: UUID of the person
            image_data: Image file bytes
            filename: Original filename

        Returns:
            Dictionary with processing results
        """
        logger.info(f"Processing uploaded photo for person {person_id}")

        # Create person directories
        person_dir = Config.FACES_DIR / person_id
        original_dir = person_dir / "original"
        processed_dir = person_dir / "processed"

        original_dir.mkdir(parents=True, exist_ok=True)
        processed_dir.mkdir(parents=True, exist_ok=True)

        # Decode image
        nparr = cv2.imdecode(
            cv2.frombuffer(image_data, dtype='uint8'),
            cv2.IMREAD_COLOR
        )

        if nparr is None:
            raise ValueError("Failed to decode image data")

        # Save original
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")[:-3]
        original_filename = f"upload_{timestamp}_{filename}"
        original_path = original_dir / original_filename

        cv2.imwrite(str(original_path), nparr)

        # Detect and process face
        gray = cv2.cvtColor(nparr, cv2.COLOR_BGR2GRAY)
        faces = self.face_detector.detectMultiScale(
            gray,
            scaleFactor=Config.FACE_SCALE_FACTOR,
            minNeighbors=Config.FACE_MIN_NEIGHBORS,
            minSize=(Config.MIN_FACE_SIZE, Config.MIN_FACE_SIZE)
        )

        result = {
            "person_id": person_id,
            "original_path": str(original_path.relative_to(Config.DATA_DIR)),
            "face_detected": len(faces) > 0,
            "faces_count": len(faces)
        }

        if len(faces) > 0:
            x, y, w, h = faces[0]
            face_roi = gray[y:y + h, x:x + w]
            face_resized = cv2.resize(face_roi, (200, 200))

            processed_filename = f"face_{timestamp}_{filename}"
            processed_path = processed_dir / processed_filename

            cv2.imwrite(str(processed_path), face_resized)

            result["processed_path"] = str(processed_path.relative_to(Config.DATA_DIR))
            result["face_bbox"] = {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}

            logger.info(f"Photo processed successfully for {person_id}")
        else:
            logger.warning(f"No face detected in uploaded photo for {person_id}")

        return result
