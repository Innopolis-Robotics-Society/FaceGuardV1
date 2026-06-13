from __future__ import annotations

import logging
import threading
import time
from datetime import datetime
from pathlib import Path

import cv2
import numpy as np

from app.config import Settings

logger = logging.getLogger(__name__)


class CameraService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._capture: cv2.VideoCapture | None = None
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._frame_lock = threading.Lock()
        self._latest_frame: np.ndarray | None = None
        self._ready = False
        self._simulated = False
        self._measured_fps = 0.0

    @property
    def ready(self) -> bool:
        return self._ready

    @property
    def simulated(self) -> bool:
        return self._simulated

    @property
    def measured_fps(self) -> float:
        return self._measured_fps

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, name="camera-loop", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=3)
        if self._capture is not None:
            self._capture.release()
            self._capture = None
        self._ready = False

    def get_frame(self, copy: bool = True) -> np.ndarray | None:
        with self._frame_lock:
            if self._latest_frame is None:
                return None
            return self._latest_frame.copy() if copy else self._latest_frame

    def get_jpeg(self) -> bytes | None:
        frame = self.get_frame()
        if frame is None:
            return None
        success, encoded = cv2.imencode(
            ".jpg",
            frame,
            [int(cv2.IMWRITE_JPEG_QUALITY), self.settings.camera_jpeg_quality],
        )
        return encoded.tobytes() if success else None

    def save_snapshot(self, path: Path, frame: np.ndarray | None = None) -> Path:
        frame_to_save = frame if frame is not None else self.get_frame()
        if frame_to_save is None:
            raise RuntimeError("Camera frame is not available")
        path.parent.mkdir(parents=True, exist_ok=True)
        if not cv2.imwrite(str(path), frame_to_save):
            raise RuntimeError(f"Failed to save snapshot: {path}")
        return path

    def _open_camera(self) -> bool:
        backend = cv2.CAP_DSHOW if self.settings.is_windows else cv2.CAP_ANY
        capture = cv2.VideoCapture(self.settings.camera_index, backend)
        capture.set(cv2.CAP_PROP_FRAME_WIDTH, self.settings.camera_width)
        capture.set(cv2.CAP_PROP_FRAME_HEIGHT, self.settings.camera_height)
        capture.set(cv2.CAP_PROP_FPS, self.settings.camera_fps)
        if not capture.isOpened():
            capture.release()
            return False
        self._capture = capture
        self._simulated = False
        logger.info("Camera opened at index %s", self.settings.camera_index)
        return True

    def _run(self) -> None:
        frame_counter = 0
        fps_window_started = time.monotonic()
        while not self._stop_event.is_set():
            if self._capture is None and not self._open_camera():
                if self.settings.camera_allow_simulation:
                    self._simulated = True
                    frame = self._make_simulated_frame()
                    self._set_frame(frame)
                    self._ready = True
                    time.sleep(max(1 / max(self.settings.camera_fps, 1), 0.05))
                    continue
                self._ready = False
                logger.warning("Camera is unavailable; retrying")
                time.sleep(self.settings.camera_retry_seconds)
                continue

            assert self._capture is not None
            ok, frame = self._capture.read()
            if not ok or frame is None:
                logger.warning("Failed to read frame; reopening camera")
                self._capture.release()
                self._capture = None
                self._ready = False
                time.sleep(self.settings.camera_retry_seconds)
                continue

            self._set_frame(frame)
            self._ready = True
            frame_counter += 1
            elapsed = time.monotonic() - fps_window_started
            if elapsed >= 2.0:
                self._measured_fps = frame_counter / elapsed
                frame_counter = 0
                fps_window_started = time.monotonic()

    def _set_frame(self, frame: np.ndarray) -> None:
        with self._frame_lock:
            self._latest_frame = frame

    def _make_simulated_frame(self) -> np.ndarray:
        frame = np.zeros(
            (self.settings.camera_height, self.settings.camera_width, 3),
            dtype=np.uint8,
        )
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, "FaceGuard simulated camera", (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(frame, now, (30, 125), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (180, 180, 180), 2)
        cv2.putText(frame, "Connect a webcam or change CAMERA_INDEX", (30, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (180, 180, 180), 1)
        return frame
