"""Local FastAPI bridge for the FaceGuard agent.

The upstream agent is a background sync/recognition service. This bridge exposes
the minimum local HTTP API needed by the React MVP demo without putting the
device key in browser code.
"""

from __future__ import annotations

import json
import os
import secrets
import sqlite3
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import cv2
from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

from agent.camera.camera_service import CameraService
from agent.camera.capture_service import CaptureService
from agent.core.config import Config
from agent.core.database import Database
from agent.door.door_controller import DoorController
from agent.recognition.recognition_loop import RecognitionLoop
from agent.recognition.recognizer import RecognitionService
from agent.telemetry.telemetry_service import TelemetryService


API_KEY = os.getenv("AGENT_API_KEY", "change-me-agent-key")


class CaptureRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)
    count: int = Field(default=12, ge=1, le=60)
    interval_seconds: float = Field(default=0.3, ge=0.05, le=5)
    strict_face_detection: bool = True


class DoorOpenRequest(BaseModel):
    duration_seconds: float | None = Field(default=None, ge=0.1, le=30)
    reason: str = Field(default="manual", max_length=100)


camera = CameraService()
capture_service = CaptureService(camera)
recognition = RecognitionService()
door = DoorController()
database = Database()
telemetry = TelemetryService()
recognition_loop: RecognitionLoop | None = None


def require_api_key(x_agent_key: str | None = Header(default=None)) -> None:
    if not x_agent_key or not secrets.compare_digest(x_agent_key, API_KEY):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid X-Agent-Key")


def _person_dir(person_id: str) -> Path:
    return Config.FACES_DIR / person_id


def _metadata_path(person_id: str) -> Path:
    return _person_dir(person_id) / "person.json"


def _write_person_metadata(person_id: str, display_name: str) -> None:
    person_dir = _person_dir(person_id)
    person_dir.mkdir(parents=True, exist_ok=True)
    _metadata_path(person_id).write_text(
        json.dumps({"person_id": person_id, "name": display_name}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _read_person_metadata(person_id: str) -> dict[str, str]:
    path = _metadata_path(person_id)
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return {"person_id": str(data.get("person_id") or person_id), "name": str(data.get("name") or person_id)}
        except (OSError, json.JSONDecodeError):
            pass
    return {"person_id": person_id, "name": person_id}


def _list_local_people() -> list[dict[str, Any]]:
    people: list[dict[str, Any]] = []
    if not Config.FACES_DIR.exists():
        return people
    for person_dir in sorted(Config.FACES_DIR.iterdir()):
        if not person_dir.is_dir() or person_dir.name.startswith("."):
            continue
        metadata = _read_person_metadata(person_dir.name)
        original_dir = person_dir / "original"
        processed_dir = person_dir / "processed"
        people.append(
            {
                "person_id": person_dir.name,
                "name": metadata["name"],
                "original_photos": len(list(original_dir.glob("*"))) if original_dir.exists() else 0,
                "processed_photos": len(list(processed_dir.glob("*.jpg"))) if processed_dir.exists() else 0,
            }
        )
    return people


def _list_events(limit: int) -> list[dict[str, Any]]:
    if not Config.DATABASE_FILE.exists():
        return []
    with sqlite3.connect(str(Config.DATABASE_FILE)) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT id, event_type, person_id, confidence, photo_path, created_at, synced
            FROM events
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    result: list[dict[str, Any]] = []
    for row in rows:
        person_id = row["person_id"]
        metadata = _read_person_metadata(person_id) if person_id else {"name": None}
        result.append(
            {
                "id": str(row["id"]),
                "event_type": row["event_type"],
                "person_id": person_id,
                "person_name": metadata.get("name"),
                "recognition_distance": row["confidence"],
                "photo_path": row["photo_path"],
                "created_at": row["created_at"],
                "synced": bool(row["synced"]),
            }
        )
    return result


def _add_event(event_type: str, person_id: str | None, confidence: float, photo_path: str, door_opened: bool) -> None:
    database.add_event(
        {
            "device_id": Config.DEVICE_ID or Config.DEVICE_CODE,
            "person_id": person_id,
            "event_type": event_type,
            "confidence": confidence,
            "door_opened": door_opened,
            "photo_path": photo_path,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )


def _on_recognized(person_id: str, confidence: float, snapshot_path: str) -> None:
    _add_event("recognized", person_id, confidence, snapshot_path, door_opened=True)
    threading.Thread(target=door.open_door, kwargs={"duration": Config.DOOR_OPEN_DURATION}, daemon=True).start()


def _on_unknown(confidence: float, snapshot_path: str) -> None:
    _add_event("unknown", None, confidence, snapshot_path, door_opened=False)


def _ensure_recognition_loop() -> None:
    global recognition_loop
    if recognition_loop is None:
        recognition_loop = RecognitionLoop(camera, recognition, on_recognized=_on_recognized, on_unknown=_on_unknown)
    if recognition.is_trained and not recognition_loop.is_active():
        recognition_loop.start()


@asynccontextmanager
async def lifespan(app: FastAPI):
    camera.start()
    _ensure_recognition_loop()
    try:
        yield
    finally:
        if recognition_loop is not None:
            recognition_loop.stop()
        camera.release()
        door.release()


app = FastAPI(title="FaceGuard Local Agent API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "FaceGuard Local Agent API", "docs": "/docs", "health": "/api/v1/health"}


@app.get("/api/v1/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok" if camera.is_available() else "degraded",
        "device_id": Config.DEVICE_ID or Config.DEVICE_CODE,
        "version": "1.0.0",
        "platform": "development" if not Config.is_raspberry_pi() else "raspberry_pi",
        "camera_ready": camera.is_available(),
        "camera_simulated": getattr(camera, "camera_type", "") == "simulated",
        "recognition_ready": recognition.is_trained,
        "hardware_mode": Config.HARDWARE_MODE,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/v1/telemetry", dependencies=[Depends(require_api_key)])
def get_telemetry() -> dict[str, Any]:
    raw = telemetry.collect_telemetry(camera_fps=camera.get_fps(), recognition_running=recognition_loop.is_active() if recognition_loop else False)
    return {
        "device_id": Config.DEVICE_ID or Config.DEVICE_CODE,
        "timestamp": raw["created_at"],
        "cpu_percent": raw["cpu_usage"],
        "memory_percent": raw["ram_usage"],
        "memory_used_mb": 0,
        "memory_total_mb": 0,
        "disk_percent": raw["disk_usage"],
        "disk_free_gb": 0,
        "uptime_seconds": raw["uptime"],
        "cpu_temperature_c": raw["cpu_temperature"],
        "camera_ready": camera.is_available(),
        "camera_simulated": getattr(camera, "camera_type", "") == "simulated",
        "camera_fps": raw["camera_fps"] or 0,
        "recognition_ready": recognition.is_trained,
        "model_people_count": len(recognition.label_map),
    }


@app.get("/api/v1/camera/snapshot", dependencies=[Depends(require_api_key)])
def camera_snapshot() -> Response:
    frame = camera.get_frame()
    if frame is None:
        raise HTTPException(status_code=503, detail="Camera frame is unavailable")
    ok, encoded = cv2.imencode(".jpg", frame)
    if not ok:
        raise HTTPException(status_code=503, detail="Failed to encode camera frame")
    return Response(content=encoded.tobytes(), media_type="image/jpeg")


@app.get("/api/v1/camera/stream", dependencies=[Depends(require_api_key)])
def camera_stream() -> StreamingResponse:
    def generate():
        while True:
            frame = camera.get_frame()
            if frame is not None:
                ok, encoded = cv2.imencode(".jpg", frame)
                if ok:
                    yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + encoded.tobytes() + b"\r\n"
            time.sleep(1 / max(Config.CAMERA_FPS, 1))

    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")


@app.get("/api/v1/people", dependencies=[Depends(require_api_key)])
def people() -> list[dict[str, Any]]:
    return _list_local_people()


@app.post("/api/v1/people/{person_id}/capture", dependencies=[Depends(require_api_key)])
def capture_person(person_id: str, payload: CaptureRequest) -> dict[str, Any]:
    _write_person_metadata(person_id, payload.display_name)
    result = capture_service.capture_person_photos(
        person_id=person_id,
        count=payload.count,
        interval=payload.interval_seconds,
        strict_face_detection=payload.strict_face_detection,
    )
    result["display_name"] = payload.display_name
    return result


@app.post("/api/v1/recognition/train", dependencies=[Depends(require_api_key)])
def train_model() -> dict[str, Any]:
    result = recognition.train_model()
    _ensure_recognition_loop()
    return {
        "trained": result["success"],
        "people_count": result["people_count"],
        "image_count": result["photos_count"],
        "skipped_count": 0,
        "model_path": result["model_path"],
        "labels_path": result["labels_path"],
    }


@app.get("/api/v1/recognition/status", dependencies=[Depends(require_api_key)])
def recognition_status() -> dict[str, Any]:
    return recognition.get_status()


@app.post("/api/v1/door/open", dependencies=[Depends(require_api_key)])
def open_door(payload: DoorOpenRequest) -> dict[str, Any]:
    duration = int(payload.duration_seconds) if payload.duration_seconds else Config.DOOR_OPEN_DURATION
    success = door.open_door(duration=duration)
    _add_event("manual_open", None, 0, "", door_opened=success)
    return {"success": success, "duration_seconds": duration, "reason": payload.reason}


@app.get("/api/v1/events", dependencies=[Depends(require_api_key)])
def events(limit: int = Query(default=50, ge=1, le=500)) -> list[dict[str, Any]]:
    return _list_events(limit)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("agent.local_api:app", host="0.0.0.0", port=8081, reload=False)
