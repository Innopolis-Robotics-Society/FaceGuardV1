"""Background recognition loop for continuous face monitoring"""

import cv2
import time
import threading
from datetime import datetime
from typing import Optional, Callable
from pathlib import Path

from core.config import Config
from core.logging import get_logger
from camera.camera_service import CameraService
from recognition.recognizer import RecognitionService
from recognition.liveness_detector import LivenessDetector


logger = get_logger(__name__)


class RecognitionLoop:
    """Background loop for continuous face recognition"""

    def __init__(
        self,
        camera_service: CameraService,
        recognition_service: RecognitionService,
        on_recognized: Optional[Callable] = None,
        on_unknown: Optional[Callable] = None
    ):
        self.camera = camera_service
        self.recognition = recognition_service
        self.on_recognized = on_recognized
        self.on_unknown = on_unknown

        self.is_running = False
        self.loop_thread: Optional[threading.Thread] = None
        self.last_action_time = {}

        # Liveness detector (basic checks: blink, motion, texture)
        self.liveness_detector = LivenessDetector() if Config.LIVENESS_ENABLED else None
        if Config.LIVENESS_ENABLED:
            logger.info("Liveness detection enabled (anti-spoofing)")
        else:
            logger.warning("Liveness detection disabled - vulnerable to photo spoofing!")

        # MiniFASNet Anti-Spoofing detector (advanced CNN-based)
        self.antispoofing_detector = None
        if Config.ANTISPOOFING_ENABLED:
            try:
                from recognition.minifasnet_detector import MiniFASNetDetector

                model_path = None
                if Config.ANTISPOOFING_MODEL_PATH:
                    model_path = Path(Config.ANTISPOOFING_MODEL_PATH)
                    if not model_path.exists():
                        logger.warning(f"MiniFASNet model not found: {model_path}")
                        model_path = None

                self.antispoofing_detector = MiniFASNetDetector(
                    model_path=model_path,
                    device=Config.ANTISPOOFING_DEVICE
                )

                if self.antispoofing_detector.is_loaded:
                    logger.info(f"MiniFASNet anti-spoofing enabled (threshold: {Config.ANTISPOOFING_THRESHOLD})")
                else:
                    logger.warning("MiniFASNet enabled but model not loaded - download model weights first")

            except Exception as e:
                logger.error(f"Failed to initialize MiniFASNet: {e}")
                logger.warning("MiniFASNet anti-spoofing disabled")
                self.antispoofing_detector = None
        else:
            logger.info("MiniFASNet anti-spoofing disabled")

    def start(self):
        """Start recognition loop"""
        if self.is_running:
            logger.warning("Recognition loop already running")
            return

        if not self.recognition.is_trained:
            logger.error("Cannot start recognition: model not trained")
            return

        self.is_running = True
        self.loop_thread = threading.Thread(target=self._recognition_loop, daemon=True)
        self.loop_thread.start()
        logger.info("Recognition loop started")

    def stop(self):
        """Stop recognition loop"""
        self.is_running = False

        if self.loop_thread:
            self.loop_thread.join(timeout=2)

        logger.info("Recognition loop stopped")

    def _recognition_loop(self):
        """Main recognition loop"""
        logger.info("Recognition loop running...")

        while self.is_running:
            try:
                # Get current frame
                frame = self.camera.get_frame()

                if frame is None:
                    time.sleep(0.1)
                    continue

                # Recognize face
                result = self.recognition.recognize_face(frame)

                if result is None:
                    # No face detected
                    time.sleep(0.1)
                    continue

                # Check liveness if enabled
                if self.liveness_detector is not None:
                    liveness_result = self.liveness_detector.check_liveness(
                        frame,
                        result["face_bbox"],
                        require_blink=Config.LIVENESS_BLINK_REQUIRED,
                        require_motion=Config.LIVENESS_MOTION_REQUIRED,
                        timeout=Config.LIVENESS_TIMEOUT_SECONDS
                    )

                    if not liveness_result["is_live"]:
                        logger.warning(
                            f"Liveness check failed: {liveness_result['method']} "
                            f"(confidence: {liveness_result['confidence']:.2f})"
                        )
                        time.sleep(0.1)
                        continue

                    logger.debug(f"Liveness check passed: {liveness_result['method']}")

                # Check anti-spoofing with MiniFASNet if enabled
                if self.antispoofing_detector is not None and self.antispoofing_detector.is_loaded:
                    antispoofing_result = self.antispoofing_detector.detect_spoofing(
                        frame,
                        result["face_bbox"],
                        threshold=Config.ANTISPOOFING_THRESHOLD
                    )

                    if not antispoofing_result["is_real"]:
                        logger.warning(
                            f"Anti-spoofing check failed: {antispoofing_result['label']} "
                            f"(confidence: {antispoofing_result['confidence']:.2f}) "
                            f"scores: {antispoofing_result['scores']}"
                        )
                        time.sleep(0.1)
                        continue

                    logger.debug(
                        f"Anti-spoofing check passed: real face detected "
                        f"(confidence: {antispoofing_result['confidence']:.2f})"
                    )

                # Process recognition result
                if result["recognized"]:
                    self._handle_recognized(result, frame)
                else:
                    self._handle_unknown(result, frame)

                # Small delay to prevent CPU overload
                time.sleep(0.1)

            except Exception as e:
                logger.error(f"Error in recognition loop: {e}", exc_info=True)
                time.sleep(1)

    def _handle_recognized(self, result: dict, frame):
        """Handle recognized person"""
        person_id = result["person_id"]
        confidence = result["confidence"]

        # Check cooldown
        current_time = time.time()
        last_time = self.last_action_time.get(person_id, 0)

        if current_time - last_time < Config.ACTION_COOLDOWN_SECONDS:
            return

        logger.info(
            f"Person recognized: {person_id} (confidence: {confidence:.1f}%)"
        )

        # Save event snapshot
        snapshot_path = self._save_event_snapshot(frame, person_id, "recognized")

        # Update cooldown
        self.last_action_time[person_id] = current_time

        # Trigger callback
        if self.on_recognized:
            try:
                self.on_recognized(person_id, confidence, snapshot_path)
            except Exception as e:
                logger.error(f"Error in on_recognized callback: {e}")

    def _handle_unknown(self, result: dict, frame):
        """Handle unknown person"""
        confidence = result["confidence"]

        # Check cooldown for unknown persons
        current_time = time.time()
        last_time = self.last_action_time.get("unknown", 0)

        if current_time - last_time < Config.ACTION_COOLDOWN_SECONDS:
            return

        logger.info(f"Unknown person detected (confidence: {confidence:.1f}%)")

        # Save event snapshot
        snapshot_path = self._save_event_snapshot(frame, None, "unknown")

        # Update cooldown
        self.last_action_time["unknown"] = current_time

        # Trigger callback
        if self.on_unknown:
            try:
                self.on_unknown(confidence, snapshot_path)
            except Exception as e:
                logger.error(f"Error in on_unknown callback: {e}")

    def _save_event_snapshot(
        self,
        frame,
        person_id: Optional[str],
        event_type: str
    ) -> str:
        """Save snapshot of event"""
        try:
            # Create events directory structure
            now = datetime.utcnow()
            date_dir = Config.EVENTS_DIR / now.strftime("%Y") / now.strftime("%m") / now.strftime("%d")
            date_dir.mkdir(parents=True, exist_ok=True)

            # Generate filename
            timestamp = now.strftime("%Y%m%d_%H%M%S_%f")[:-3]
            person_str = person_id if person_id else "unknown"
            filename = f"{event_type}_{person_str}_{timestamp}.jpg"
            filepath = date_dir / filename

            # Save image
            cv2.imwrite(str(filepath), frame)

            # Return relative path
            relative_path = filepath.relative_to(Config.DATA_DIR)
            return str(relative_path)

        except Exception as e:
            logger.error(f"Failed to save event snapshot: {e}")
            return ""

    def is_active(self) -> bool:
        """Check if loop is running"""
        return self.is_running and self.recognition.is_trained
