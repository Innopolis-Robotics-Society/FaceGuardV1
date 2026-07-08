"""Liveness detection to prevent photo spoofing"""

import cv2
import numpy as np
import time
from typing import Optional, Dict, Any
from collections import deque

from core.logging import get_logger

logger = get_logger(__name__)


class LivenessDetector:
    """
    Simple liveness detection using:
    1. Eye blink detection (photos don't blink)
    2. Motion detection (photos don't move)
    3. Texture analysis (photos have different texture)
    """

    def __init__(self):
        # Load eye cascade for blink detection
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_eye.xml"
        )

        # Frame history for motion detection
        self.frame_history = deque(maxlen=10)

        # Blink detection state
        self.eye_state_history = deque(maxlen=30)  # 30 frames ~ 1 second at 30fps
        self.last_blink_time = 0

    def check_liveness(
        self,
        frame: np.ndarray,
        face_bbox: Dict[str, int],
        require_blink: bool = True,
        require_motion: bool = False,
        timeout: float = 3.0
    ) -> Dict[str, Any]:
        """
        Check if detected face is alive (not a photo)

        Args:
            frame: Current BGR frame
            face_bbox: Face bounding box {"x", "y", "w", "h"}
            require_blink: Require blink detection
            require_motion: Require motion detection
            timeout: Max time to wait for liveness proof

        Returns:
            {
                "is_live": bool,
                "confidence": float,
                "method": str,
                "details": dict
            }
        """
        results = {
            "is_live": False,
            "confidence": 0.0,
            "method": "none",
            "details": {}
        }

        # Extract face region
        x, y, w, h = face_bbox["x"], face_bbox["y"], face_bbox["w"], face_bbox["h"]
        face_region = frame[y:y+h, x:x+w]

        if face_region.size == 0:
            return results

        # 1. Texture analysis (fast, no waiting needed)
        texture_score = self._check_texture(face_region)
        results["details"]["texture_score"] = texture_score

        # Photos have less texture variation
        if texture_score < 10:  # Too smooth = likely photo
            results["is_live"] = False
            results["confidence"] = 0.2
            results["method"] = "texture"
            logger.debug(f"Liveness check failed: low texture ({texture_score:.1f})")
            return results

        # 2. Blink detection (if required)
        if require_blink:
            blink_detected = self._detect_blink(face_region)
            results["details"]["blink_detected"] = blink_detected

            if not blink_detected:
                # Check if we recently detected a blink (within timeout)
                if time.time() - self.last_blink_time < timeout:
                    blink_detected = True

            if not blink_detected:
                results["is_live"] = False
                results["confidence"] = 0.4
                results["method"] = "blink"
                logger.debug("Liveness check failed: no blink detected")
                return results

        # 3. Motion detection (if required)
        if require_motion:
            motion_detected = self._detect_motion(frame)
            results["details"]["motion_detected"] = motion_detected

            if not motion_detected:
                results["is_live"] = False
                results["confidence"] = 0.5
                results["method"] = "motion"
                logger.debug("Liveness check failed: no motion detected")
                return results

        # All checks passed
        results["is_live"] = True
        results["confidence"] = 0.9
        results["method"] = "combined"

        return results

    def _check_texture(self, face_region: np.ndarray) -> float:
        """
        Analyze texture variation (real faces have more texture than photos)

        Returns texture score (higher = more real)
        """
        try:
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)

            # Use Laplacian variance to measure texture
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            variance = laplacian.var()

            return float(variance)

        except Exception as e:
            logger.error(f"Error in texture analysis: {e}")
            return 100.0  # Default to pass if error

    def _detect_blink(self, face_region: np.ndarray) -> bool:
        """
        Detect eye blink (photos can't blink)

        Returns True if blink detected recently
        """
        try:
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)

            # Detect eyes
            eyes = self.eye_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(20, 20)
            )

            # Track eye state
            eyes_open = len(eyes) >= 2
            self.eye_state_history.append(eyes_open)

            # Need enough history
            if len(self.eye_state_history) < 10:
                return False

            # Detect blink: eyes open -> closed -> open sequence
            recent_states = list(self.eye_state_history)[-10:]

            # Look for pattern: True...True, False...False, True...True
            # (eyes open, then closed, then open again)
            has_open_start = sum(recent_states[:3]) >= 2
            has_closed_middle = sum(recent_states[3:7]) <= 1
            has_open_end = sum(recent_states[7:]) >= 2

            if has_open_start and has_closed_middle and has_open_end:
                self.last_blink_time = time.time()
                logger.debug("Blink detected!")
                return True

            return False

        except Exception as e:
            logger.error(f"Error in blink detection: {e}")
            return True  # Default to pass if error

    def _detect_motion(self, frame: np.ndarray) -> bool:
        """
        Detect motion between frames (photos don't move)

        Returns True if motion detected
        """
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            self.frame_history.append(gray)

            # Need at least 2 frames
            if len(self.frame_history) < 2:
                return False

            # Calculate frame difference
            diff = cv2.absdiff(self.frame_history[-1], self.frame_history[-2])

            # Threshold and count changed pixels
            _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)
            motion_pixels = np.sum(thresh > 0)

            # Motion detected if enough pixels changed
            total_pixels = thresh.size
            motion_ratio = motion_pixels / total_pixels

            return motion_ratio > 0.02  # More than 2% changed

        except Exception as e:
            logger.error(f"Error in motion detection: {e}")
            return True  # Default to pass if error

    def reset(self):
        """Reset detector state"""
        self.frame_history.clear()
        self.eye_state_history.clear()
        self.last_blink_time = 0
