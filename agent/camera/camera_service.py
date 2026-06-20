"""Camera service for capturing frames"""

import cv2
import numpy as np
from typing import Optional, Tuple
import threading
import time
import platform

from agent.core.config import Config
from agent.core.logging import get_logger


logger = get_logger(__name__)


class CameraService:
    """Unified camera service supporting picamera2 and OpenCV"""

    def __init__(self):
        self.camera = None
        self.is_running = False
        self.current_frame = None
        self.frame_lock = threading.Lock()
        self.capture_thread = None
        self.frame_count = 0
        self.start_time = time.time()

        self._initialize_camera()

    def _initialize_camera(self):
        """Initialize camera based on hardware mode"""
        try:
            if Config.is_raspberry_pi():
                self._init_picamera2()
            else:
                self._init_opencv_camera()
        except Exception as e:
            logger.error(f"Failed to initialize camera: {e}")
            logger.info("Falling back to simulated camera")
            self._init_simulated_camera()

    def _init_picamera2(self):
        """Initialize Picamera2 for Raspberry Pi"""
        try:
            from picamera2 import Picamera2

            logger.info("Initializing Picamera2...")
            self.camera = Picamera2()

            # Configure camera
            config = self.camera.create_preview_configuration(
                main={"size": (Config.CAMERA_WIDTH, Config.CAMERA_HEIGHT), "format": "RGB888"}
            )
            self.camera.configure(config)
            self.camera.start()

            logger.info("Picamera2 initialized successfully")
            self.camera_type = "picamera2"

        except ImportError:
            logger.warning("picamera2 not available, falling back to OpenCV")
            self._init_opencv_camera()
        except Exception as e:
            logger.error(f"Picamera2 initialization failed: {e}")
            raise

    def _init_opencv_camera(self):
        """Initialize OpenCV camera (webcam)"""
        logger.info(f"Initializing OpenCV camera (index {Config.CAMERA_INDEX})...")

        if platform.system() == "Windows":
            self.camera = cv2.VideoCapture(Config.CAMERA_INDEX, cv2.CAP_DSHOW)
        else:
            self.camera = cv2.VideoCapture(Config.CAMERA_INDEX)

        if not self.camera.isOpened():
            raise RuntimeError(f"Failed to open camera at index {Config.CAMERA_INDEX}")

        # Set camera properties
        self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, Config.CAMERA_WIDTH)
        self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, Config.CAMERA_HEIGHT)
        self.camera.set(cv2.CAP_PROP_FPS, Config.CAMERA_FPS)

        logger.info("OpenCV camera initialized successfully")
        self.camera_type = "opencv"

    def _init_simulated_camera(self):
        """Initialize simulated camera for testing"""
        logger.info("Initializing simulated camera...")
        self.camera = None
        self.camera_type = "simulated"
        logger.info("Simulated camera initialized")

    def start(self):
        """Start continuous frame capture"""
        if self.is_running:
            logger.warning("Camera already running")
            return

        self.is_running = True
        self.capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.capture_thread.start()
        logger.info("Camera capture started")

    def stop(self):
        """Stop continuous frame capture"""
        self.is_running = False

        if self.capture_thread:
            self.capture_thread.join(timeout=2)

        logger.info("Camera capture stopped")

    def _capture_loop(self):
        """Background loop for continuous frame capture"""
        while self.is_running:
            try:
                frame = self._grab_frame()
                if frame is not None:
                    with self.frame_lock:
                        self.current_frame = frame
                        self.frame_count += 1

                time.sleep(1.0 / Config.CAMERA_FPS)

            except Exception as e:
                logger.error(f"Error in capture loop: {e}")
                time.sleep(1)

    def _grab_frame(self) -> Optional[np.ndarray]:
        """Grab a single frame from camera"""
        try:
            if self.camera_type == "picamera2":
                return self.camera.capture_array()

            elif self.camera_type == "opencv":
                ret, frame = self.camera.read()
                if ret:
                    return frame
                return None

            elif self.camera_type == "simulated":
                return self._generate_simulated_frame()

        except Exception as e:
            logger.error(f"Failed to grab frame: {e}")
            return None

    def _generate_simulated_frame(self) -> np.ndarray:
        """Generate simulated frame for testing"""
        frame = np.zeros((Config.CAMERA_HEIGHT, Config.CAMERA_WIDTH, 3), dtype=np.uint8)
        frame[:] = (50, 50, 50)  # Dark gray background

        # Add text
        text = "Simulated Camera"
        font = cv2.FONT_HERSHEY_SIMPLEX
        text_size = cv2.getTextSize(text, font, 1, 2)[0]
        text_x = (frame.shape[1] - text_size[0]) // 2
        text_y = (frame.shape[0] + text_size[1]) // 2

        cv2.putText(frame, text, (text_x, text_y), font, 1, (255, 255, 255), 2)

        # Add timestamp
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, timestamp, (10, 30), font, 0.7, (200, 200, 200), 1)

        return frame

    def get_frame(self) -> Optional[np.ndarray]:
        """Get current frame (non-blocking)"""
        with self.frame_lock:
            if self.current_frame is not None:
                return self.current_frame.copy()
            return None

    def capture_frame(self) -> Optional[np.ndarray]:
        """Capture a single fresh frame"""
        return self._grab_frame()

    def get_fps(self) -> float:
        """Calculate current FPS"""
        elapsed = time.time() - self.start_time
        if elapsed > 0:
            return self.frame_count / elapsed
        return 0.0

    def is_available(self) -> bool:
        """Check if camera is available"""
        return self.camera is not None or self.camera_type == "simulated"

    def release(self):
        """Release camera resources"""
        self.stop()

        if self.camera_type == "opencv" and self.camera:
            self.camera.release()
        elif self.camera_type == "picamera2" and self.camera:
            self.camera.stop()
            self.camera.close()

        logger.info("Camera released")

    def __del__(self):
        """Cleanup on deletion"""
        self.release()
