"""Background recognition loop for continuous face monitoring"""

import cv2
import time
import threading
from collections import Counter, deque
from datetime import datetime
from typing import Optional, Callable
from pathlib import Path

from agent.core.config import Config
from agent.core.logging import get_logger
from agent.camera.camera_service import CameraService
from agent.recognition.recognizer import RecognitionService


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
        self.recent_results = deque(maxlen=Config.RECOGNITION_CONSENSUS_WINDOW)

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

                self._process_result(result, frame)

                # Small delay to prevent CPU overload
                time.sleep(Config.RECOGNITION_PROCESS_INTERVAL_SECONDS)

            except Exception as e:
                logger.error(f"Error in recognition loop: {e}", exc_info=True)
                time.sleep(1)

    def _process_result(self, result: dict, frame):
        """Require a stable multi-frame decision before emitting an event."""
        candidate = result["person_id"] if result["recognized"] else "unknown"
        self.recent_results.append(
            {
                "candidate": candidate,
                "confidence": float(result["confidence"]),
                "frame": frame.copy(),
            }
        )

        counts = Counter(item["candidate"] for item in self.recent_results)
        best_candidate, count = counts.most_common(1)[0]

        if best_candidate == "unknown":
            if count >= Config.UNKNOWN_CONSENSUS_FRAMES:
                same = [item for item in self.recent_results if item["candidate"] == "unknown"]
                avg_confidence = sum(item["confidence"] for item in same) / len(same)
                self._handle_unknown({"confidence": avg_confidence}, same[-1]["frame"])
                self.recent_results.clear()
            return

        if count < Config.RECOGNITION_CONSENSUS_FRAMES:
            return

        same = [item for item in self.recent_results if item["candidate"] == best_candidate]
        avg_confidence = sum(item["confidence"] for item in same) / len(same)
        if avg_confidence >= Config.RECOGNITION_THRESHOLD:
            return

        self._handle_recognized({"person_id": best_candidate, "confidence": avg_confidence}, same[-1]["frame"])
        self.recent_results.clear()

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
            f"Person recognized: {person_id} (confidence: {confidence:.1f})"
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

        logger.info(f"Unknown person detected (confidence: {confidence:.1f})")

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
