from __future__ import annotations

import asyncio
import json
import logging
import re
import threading
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

import cv2
import numpy as np

from app.config import Settings
from app.services.camera import CameraService
from app.services.door import DoorController
from app.services.event_bus import EventBus
from app.services.store import LocalStore

logger = logging.getLogger(__name__)
SAFE_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,100}$")
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


class RecognitionService:
    def __init__(
        self,
        settings: Settings,
        camera: CameraService,
        door: DoorController,
        store: LocalStore,
        event_bus: EventBus,
    ) -> None:
        self.settings = settings
        self.camera = camera
        self.door = door
        self.store = store
        self.event_bus = event_bus
        self._detector = self._create_detector()
        self._recognizer: Any | None = None
        self._label_map: dict[int, dict[str, str]] = {}
        self._model_lock = threading.RLock()
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._last_event_times: dict[str, float] = {}
        self._event_loop: asyncio.AbstractEventLoop | None = None
        self.ready = False
        self.people_count = 0

    def set_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._event_loop = loop

    def start(self) -> None:
        self.reload_model()
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, name="recognition-loop", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=3)

    def reload_model(self) -> bool:
        if not self.settings.model_path.exists() or not self.settings.labels_path.exists():
            self.ready = False
            self.people_count = 0
            logger.warning("Recognition model is not trained yet")
            return False
        recognizer = self._create_recognizer()
        recognizer.read(str(self.settings.model_path))
        raw_labels = json.loads(self.settings.labels_path.read_text(encoding="utf-8"))
        label_map: dict[int, dict[str, str]] = {}
        for key, value in raw_labels.items():
            if isinstance(value, str):
                label_map[int(key)] = {"person_id": value, "name": value}
            else:
                label_map[int(key)] = {
                    "person_id": str(value["person_id"]),
                    "name": str(value.get("name") or value["person_id"]),
                }
        with self._model_lock:
            self._recognizer = recognizer
            self._label_map = label_map
            self.people_count = len(label_map)
            self.ready = True
        logger.info("Recognition model loaded; people=%d", self.people_count)
        return True

    def train_model(self) -> dict[str, Any]:
        faces: list[np.ndarray] = []
        labels: list[int] = []
        label_map: dict[int, dict[str, str]] = {}
        skipped_count = 0
        current_label = 0

        for person_dir in sorted(self.settings.faces_dir.iterdir() if self.settings.faces_dir.exists() else []):
            if not person_dir.is_dir() or person_dir.name.startswith("."):
                continue
            person_id = person_dir.name
            metadata = self._read_person_metadata(person_dir)
            person_name = metadata.get("name", person_id)
            person_images: list[np.ndarray] = []

            processed_dir = person_dir / "processed"
            search_root = processed_dir if processed_dir.exists() else person_dir
            for image_path in sorted(search_root.rglob("*")):
                if not image_path.is_file() or image_path.suffix.lower() not in IMAGE_EXTENSIONS:
                    continue
                image = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
                if image is None:
                    skipped_count += 1
                    continue
                prepared = self._prepare_training_face(image)
                if prepared is None:
                    skipped_count += 1
                    continue
                person_images.append(prepared)

            if not person_images:
                logger.warning("No usable images for person %s", person_id)
                continue

            label_map[current_label] = {"person_id": person_id, "name": person_name}
            faces.extend(person_images)
            labels.extend([current_label] * len(person_images))
            current_label += 1

        if not faces:
            raise RuntimeError("No usable face images found. Add photos before training.")

        recognizer = self._create_recognizer()
        recognizer.train(faces, np.asarray(labels, dtype=np.int32))

        temp_model = self.settings.models_dir / "face_model.tmp.yml"
        temp_labels = self.settings.models_dir / "labels.tmp.json"
        recognizer.write(str(temp_model))
        temp_labels.write_text(json.dumps(label_map, ensure_ascii=False, indent=2), encoding="utf-8")
        temp_model.replace(self.settings.model_path)
        temp_labels.replace(self.settings.labels_path)
        self.reload_model()

        return {
            "trained": True,
            "people_count": len(label_map),
            "image_count": len(faces),
            "skipped_count": skipped_count,
            "model_path": str(self.settings.model_path),
            "labels_path": str(self.settings.labels_path),
        }

    def create_person(self, person_id: str, display_name: str) -> dict[str, str]:
        self._validate_person_id(person_id)
        person_dir = self.settings.faces_dir / person_id
        (person_dir / "original").mkdir(parents=True, exist_ok=True)
        (person_dir / "processed").mkdir(parents=True, exist_ok=True)
        metadata = {"person_id": person_id, "name": display_name}
        (person_dir / "person.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
        return metadata

    def list_people(self) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        if not self.settings.faces_dir.exists():
            return result
        for person_dir in sorted(self.settings.faces_dir.iterdir()):
            if not person_dir.is_dir() or person_dir.name.startswith("."):
                continue
            metadata = self._read_person_metadata(person_dir)
            original_count = len(list((person_dir / "original").glob("*"))) if (person_dir / "original").exists() else 0
            processed_count = len(list((person_dir / "processed").glob("*"))) if (person_dir / "processed").exists() else len([
                p for p in person_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
            ])
            result.append({
                "person_id": person_dir.name,
                "name": metadata.get("name", person_dir.name),
                "original_photos": original_count,
                "processed_photos": processed_count,
            })
        return result

    def capture_person_photos(
        self,
        person_id: str,
        display_name: str,
        count: int,
        interval_seconds: float,
        strict_face_detection: bool,
    ) -> dict[str, Any]:
        self.create_person(person_id, display_name)
        person_dir = self.settings.faces_dir / person_id
        saved: list[dict[str, str]] = []
        rejected = 0

        for _ in range(count):
            frame = self.camera.get_frame()
            if frame is None:
                raise RuntimeError("Camera frame is not available")
            face = self.extract_registration_face(frame) if strict_face_detection else self.extract_largest_face(frame)
            if face is None and strict_face_detection:
                rejected += 1
                time.sleep(interval_seconds)
                continue
            if face is None:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                face = cv2.resize(gray, (self.settings.face_width, self.settings.face_height))

            file_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}_{uuid.uuid4().hex[:8]}"
            original_path = person_dir / "original" / f"{file_id}.jpg"
            processed_path = person_dir / "processed" / f"{file_id}.jpg"
            cv2.imwrite(str(original_path), frame)
            cv2.imwrite(str(processed_path), face)
            saved.append({"original": str(original_path), "processed": str(processed_path)})
            time.sleep(interval_seconds)

        if not saved:
            raise RuntimeError("No photos were saved. Make sure exactly one clear face is visible.")
        return {"person_id": person_id, "display_name": display_name, "saved_count": len(saved), "rejected_count": rejected, "files": saved}

    def save_uploaded_photo(self, person_id: str, display_name: str, content: bytes, filename: str) -> dict[str, str]:
        self.create_person(person_id, display_name)
        extension = Path(filename).suffix.lower() or ".jpg"
        if extension not in IMAGE_EXTENSIONS:
            raise ValueError("Unsupported image type")
        array = np.frombuffer(content, dtype=np.uint8)
        frame = cv2.imdecode(array, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Uploaded file is not a valid image")
        face = self.extract_registration_face(frame)
        if face is None:
            raise ValueError("The image must contain exactly one clearly detected face")
        file_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}_{uuid.uuid4().hex[:8]}"
        person_dir = self.settings.faces_dir / person_id
        original_path = person_dir / "original" / f"{file_id}{extension}"
        processed_path = person_dir / "processed" / f"{file_id}.jpg"
        original_path.write_bytes(content)
        cv2.imwrite(str(processed_path), face)
        return {"original": str(original_path), "processed": str(processed_path)}

    def extract_registration_face(self, frame: np.ndarray) -> np.ndarray | None:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if frame.ndim == 3 else frame
        boxes = self._detect_faces(gray)
        if len(boxes) != 1:
            return None
        x, y, width, height = boxes[0]
        face = gray[y : y + height, x : x + width]
        return cv2.resize(face, (self.settings.face_width, self.settings.face_height))

    def extract_largest_face(self, frame: np.ndarray) -> np.ndarray | None:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if frame.ndim == 3 else frame
        boxes = self._detect_faces(gray)
        if len(boxes) == 0:
            return None
        x, y, width, height = max(boxes, key=lambda box: box[2] * box[3])
        face = gray[y : y + height, x : x + width]
        return cv2.resize(face, (self.settings.face_width, self.settings.face_height))

    def _detect_faces(self, gray: np.ndarray):
        return self._detector.detectMultiScale(
            gray,
            scaleFactor=1.2,
            minNeighbors=5,
            minSize=(self.settings.min_face_size, self.settings.min_face_size),
        )

    def _prepare_training_face(self, image: np.ndarray) -> np.ndarray | None:
        if image.shape == (self.settings.face_height, self.settings.face_width):
            return image
        boxes = self._detector.detectMultiScale(
            image,
            scaleFactor=1.2,
            minNeighbors=5,
            minSize=(self.settings.min_face_size, self.settings.min_face_size),
        )
        if len(boxes) > 0:
            x, y, width, height = max(boxes, key=lambda box: box[2] * box[3])
            image = image[y : y + height, x : x + width]
        return cv2.resize(image, (self.settings.face_width, self.settings.face_height))

    def _run(self) -> None:
        while not self._stop_event.is_set():
            if not self.settings.recognition_enabled or not self.ready:
                time.sleep(1.0)
                continue
            frame = self.camera.get_frame()
            if frame is None:
                time.sleep(0.2)
                continue
            self._recognize_frame(frame)
            time.sleep(self.settings.recognition_interval_seconds)

    def _recognize_frame(self, frame: np.ndarray) -> None:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        boxes = self._detector.detectMultiScale(
            gray,
            scaleFactor=1.2,
            minNeighbors=5,
            minSize=(self.settings.min_face_size, self.settings.min_face_size),
        )
        for x, y, width, height in boxes:
            face = cv2.resize(
                gray[y : y + height, x : x + width],
                (self.settings.face_width, self.settings.face_height),
            )
            with self._model_lock:
                if self._recognizer is None:
                    return
                label, distance = self._recognizer.predict(face)
                person = self._label_map.get(int(label))
            if person and float(distance) < self.settings.recognition_threshold:
                key = f"known:{person['person_id']}"
                if self._cooldown_passed(key, self.settings.recognition_cooldown_seconds):
                    event_photo = self._save_event_photo(frame, "recognized")
                    event = self.store.add_event(
                        "recognized",
                        person_id=person["person_id"],
                        person_name=person["name"],
                        recognition_distance=float(distance),
                        photo_path=str(event_photo),
                    )
                    self._publish(event)
                    threading.Thread(
                        target=self.door.open,
                        kwargs={"reason": f"recognized:{person['person_id']}"},
                        daemon=True,
                    ).start()
                    logger.info("Recognized %s with LBPH distance %.2f", person["name"], distance)
            else:
                if self._cooldown_passed("unknown", self.settings.unknown_cooldown_seconds):
                    event_photo = self._save_event_photo(frame, "unknown")
                    event = self.store.add_event(
                        "unknown",
                        recognition_distance=float(distance),
                        photo_path=str(event_photo),
                    )
                    self._publish(event)

    def _save_event_photo(self, frame: np.ndarray, prefix: str) -> Path:
        date_dir = self.settings.events_dir / datetime.now().strftime("%Y/%m/%d")
        path = date_dir / f"{prefix}_{datetime.now().strftime('%H%M%S_%f')}.jpg"
        self.camera.save_snapshot(path, frame)
        return path

    def _cooldown_passed(self, key: str, cooldown_seconds: float) -> bool:
        now = time.monotonic()
        previous = self._last_event_times.get(key, 0.0)
        if now - previous < cooldown_seconds:
            return False
        self._last_event_times[key] = now
        return True

    def _publish(self, event: dict[str, Any]) -> None:
        if self._event_loop and self._event_loop.is_running():
            asyncio.run_coroutine_threadsafe(self.event_bus.publish(event), self._event_loop)

    def _read_person_metadata(self, person_dir: Path) -> dict[str, str]:
        metadata_path = person_dir / "person.json"
        try:
            if metadata_path.exists():
                data = json.loads(metadata_path.read_text(encoding="utf-8"))
                return {"person_id": str(data.get("person_id", person_dir.name)), "name": str(data.get("name", person_dir.name))}
        except (OSError, json.JSONDecodeError):
            logger.warning("Invalid person metadata: %s", metadata_path)
        return {"person_id": person_dir.name, "name": person_dir.name}

    @staticmethod
    def _create_detector() -> cv2.CascadeClassifier:
        detector = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        if detector.empty():
            raise RuntimeError("Failed to load Haar Cascade detector")
        return detector

    @staticmethod
    def _create_recognizer():
        face_module = getattr(cv2, "face", None)
        factory = getattr(face_module, "LBPHFaceRecognizer_create", None) if face_module else None
        if factory is None:
            raise RuntimeError(
                "OpenCV face module is unavailable. Remove opencv-python/opencv-python-headless "
                "and install only opencv-contrib-python-headless from requirements.txt."
            )
        return factory()

    @staticmethod
    def _validate_person_id(person_id: str) -> None:
        if not SAFE_ID_PATTERN.fullmatch(person_id):
            raise ValueError("person_id may contain only letters, numbers, underscore and hyphen")
