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
import uuid
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
DEFAULT_CAPTURE_STEPS = [
    "Look straight at the camera",
    "Turn your head slightly left",
    "Turn your head slightly right",
    "Lift your chin a little",
    "Lower your chin a little",
    "Move a little closer",
    "Move a little farther back",
    "Look straight again",
    "Turn left again",
    "Turn right again",
    "Use a neutral expression",
    "Make a small smile",
]


class CaptureRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)
    count: int = Field(default=12, ge=1, le=60)
    interval_seconds: float = Field(default=1.0, ge=0.05, le=5)
    strict_face_detection: bool = True


class CaptureSessionRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)
    steps: list[str] = Field(default_factory=lambda: DEFAULT_CAPTURE_STEPS.copy())
    interval_seconds: float = Field(default=1.0, ge=0.5, le=5)
    strict_face_detection: bool = True
    train_after_capture: bool = True


class DoorOpenRequest(BaseModel):
    duration_seconds: float | None = Field(default=None, ge=0.1, le=30)
    reason: str = Field(default="manual", max_length=100)


class SettingsUpdate(BaseModel):
    recognition_threshold: float | None = Field(default=None, ge=25, le=90)
    recognition_consensus_frames: int | None = Field(default=None, ge=1, le=10)
    recognition_consensus_window: int | None = Field(default=None, ge=3, le=20)
    unknown_consensus_frames: int | None = Field(default=None, ge=1, le=12)
    recognition_process_interval_seconds: float | None = Field(default=None, ge=0.05, le=2)
    action_cooldown_seconds: int | None = Field(default=None, ge=1, le=60)
    door_open_duration: int | None = Field(default=None, ge=1, le=30)
    min_blur_score: float | None = Field(default=None, ge=0, le=200)
    min_brightness: float | None = Field(default=None, ge=0, le=255)
    max_brightness: float | None = Field(default=None, ge=0, le=255)


camera = CameraService()
capture_service = CaptureService(camera)
recognition = RecognitionService()
door = DoorController()
database = Database()
telemetry = TelemetryService()
recognition_loop: RecognitionLoop | None = None
capture_sessions: dict[str, dict[str, Any]] = {}
capture_sessions_lock = threading.Lock()


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
            SELECT id, event_type, person_id, confidence, door_opened, photo_path, created_at, synced
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
                "door_opened": bool(row["door_opened"]),
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


def _settings_payload() -> dict[str, Any]:
    return {
        "recognition_threshold": Config.RECOGNITION_THRESHOLD,
        "recognition_consensus_frames": Config.RECOGNITION_CONSENSUS_FRAMES,
        "recognition_consensus_window": Config.RECOGNITION_CONSENSUS_WINDOW,
        "unknown_consensus_frames": Config.UNKNOWN_CONSENSUS_FRAMES,
        "recognition_process_interval_seconds": Config.RECOGNITION_PROCESS_INTERVAL_SECONDS,
        "action_cooldown_seconds": Config.ACTION_COOLDOWN_SECONDS,
        "door_open_duration": Config.DOOR_OPEN_DURATION,
        "min_blur_score": Config.MIN_BLUR_SCORE,
        "min_brightness": Config.MIN_BRIGHTNESS,
        "max_brightness": Config.MAX_BRIGHTNESS,
        "camera_width": Config.CAMERA_WIDTH,
        "camera_height": Config.CAMERA_HEIGHT,
        "camera_fps": Config.CAMERA_FPS,
        "camera_index": Config.CAMERA_INDEX,
        "hardware_mode": Config.HARDWARE_MODE,
        "backend_url": Config.BACKEND_URL,
    }


def _event_stats() -> dict[str, Any]:
    events = _list_events(1000)
    today = datetime.now().date()
    today_events = []
    for event in events:
        try:
            event_date = datetime.fromisoformat(str(event["created_at"]).replace("Z", "+00:00")).date()
        except ValueError:
            event_date = today
        if event_date == today:
            today_events.append(event)

    return {
        "total_events": len(events),
        "today_events": len(today_events),
        "recognized_today": sum(1 for event in today_events if event["event_type"] == "recognized"),
        "unknown_today": sum(1 for event in today_events if event["event_type"] == "unknown"),
        "door_opened_today": sum(1 for event in today_events if event["door_opened"]),
        "recent_events": events[:10],
    }


def _session_snapshot(session_id: str) -> dict[str, Any]:
    with capture_sessions_lock:
        session = capture_sessions.get(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Capture session not found")
        return dict(session)


def _update_session(session_id: str, **updates: Any) -> None:
    with capture_sessions_lock:
        if session_id in capture_sessions:
            capture_sessions[session_id].update(updates)
            capture_sessions[session_id]["updated_at"] = datetime.now(timezone.utc).isoformat()


def _run_capture_session(session_id: str, person_id: str, payload: CaptureSessionRequest) -> None:
    captured = 0
    skipped = 0
    steps = [step.strip() for step in payload.steps if step.strip()] or DEFAULT_CAPTURE_STEPS
    try:
        _write_person_metadata(person_id, payload.display_name)
        _update_session(session_id, status="running", total_steps=len(steps), current_index=0)

        for index, prompt in enumerate(steps, start=1):
            _update_session(
                session_id,
                current_index=index,
                current_prompt=prompt,
                last_result=None,
            )
            time.sleep(payload.interval_seconds)

            result = capture_service.capture_person_photos(
                person_id=person_id,
                count=1,
                interval=0,
                strict_face_detection=payload.strict_face_detection,
            )
            step_result = {
                "index": index,
                "prompt": prompt,
                "captured_count": result["captured_count"],
                "skipped_count": result["skipped_count"],
                "skipped": result.get("skipped", []),
            }
            captured += result["captured_count"]
            skipped += result["skipped_count"]

            with capture_sessions_lock:
                session = capture_sessions[session_id]
                session["steps"].append(step_result)
                session["captured_count"] = captured
                session["skipped_count"] = skipped
                session["last_result"] = step_result
                session["updated_at"] = datetime.now(timezone.utc).isoformat()

        training_result = None
        if payload.train_after_capture and captured > 0:
            _update_session(session_id, status="training", current_prompt="Training recognition model")
            training_result = train_model()

        _update_session(
            session_id,
            status="completed",
            current_prompt="Registration complete",
            training_result=training_result,
            completed_at=datetime.now(timezone.utc).isoformat(),
        )
    except Exception as exc:
        _update_session(
            session_id,
            status="failed",
            error=str(exc),
            current_prompt="Registration failed",
            completed_at=datetime.now(timezone.utc).isoformat(),
        )


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


@app.get("/api/v1/stats", dependencies=[Depends(require_api_key)])
def stats() -> dict[str, Any]:
    event_stats = _event_stats()
    local_people = _list_local_people()
    return {
        **event_stats,
        "local_people_count": len(local_people),
        "local_training_photos": sum(person["processed_photos"] for person in local_people),
        "recognition_ready": recognition.is_trained,
        "model_people_count": len(recognition.label_map),
        "settings": _settings_payload(),
    }


@app.get("/api/v1/settings", dependencies=[Depends(require_api_key)])
def get_settings() -> dict[str, Any]:
    return _settings_payload()


@app.patch("/api/v1/settings", dependencies=[Depends(require_api_key)])
def update_settings(payload: SettingsUpdate) -> dict[str, Any]:
    updates = payload.model_dump(exclude_none=True)
    mapping = {
        "recognition_threshold": "RECOGNITION_THRESHOLD",
        "recognition_consensus_frames": "RECOGNITION_CONSENSUS_FRAMES",
        "recognition_consensus_window": "RECOGNITION_CONSENSUS_WINDOW",
        "unknown_consensus_frames": "UNKNOWN_CONSENSUS_FRAMES",
        "recognition_process_interval_seconds": "RECOGNITION_PROCESS_INTERVAL_SECONDS",
        "action_cooldown_seconds": "ACTION_COOLDOWN_SECONDS",
        "door_open_duration": "DOOR_OPEN_DURATION",
        "min_blur_score": "MIN_BLUR_SCORE",
        "min_brightness": "MIN_BRIGHTNESS",
        "max_brightness": "MAX_BRIGHTNESS",
    }
    for key, value in updates.items():
        setattr(Config, mapping[key], value)
    if Config.RECOGNITION_CONSENSUS_FRAMES > Config.RECOGNITION_CONSENSUS_WINDOW:
        Config.RECOGNITION_CONSENSUS_WINDOW = Config.RECOGNITION_CONSENSUS_FRAMES
    if Config.MIN_BRIGHTNESS > Config.MAX_BRIGHTNESS:
        Config.MIN_BRIGHTNESS, Config.MAX_BRIGHTNESS = Config.MAX_BRIGHTNESS, Config.MIN_BRIGHTNESS
    return _settings_payload()


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


@app.post("/api/v1/people/{person_id}/capture-session", dependencies=[Depends(require_api_key)])
def start_capture_session(person_id: str, payload: CaptureSessionRequest) -> dict[str, Any]:
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with capture_sessions_lock:
        capture_sessions[session_id] = {
            "session_id": session_id,
            "person_id": person_id,
            "display_name": payload.display_name,
            "status": "queued",
            "current_index": 0,
            "total_steps": len(payload.steps or DEFAULT_CAPTURE_STEPS),
            "current_prompt": "Preparing camera",
            "captured_count": 0,
            "skipped_count": 0,
            "steps": [],
            "last_result": None,
            "training_result": None,
            "error": None,
            "created_at": now,
            "updated_at": now,
            "completed_at": None,
        }

    threading.Thread(target=_run_capture_session, args=(session_id, person_id, payload), daemon=True).start()
    return _session_snapshot(session_id)


@app.get("/api/v1/capture-sessions/{session_id}", dependencies=[Depends(require_api_key)])
def capture_session(session_id: str) -> dict[str, Any]:
    return _session_snapshot(session_id)


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


@app.delete("/api/v1/events", dependencies=[Depends(require_api_key)])
def clear_events() -> dict[str, Any]:
    if not Config.DATABASE_FILE.exists():
        return {"deleted": 0}
    with sqlite3.connect(str(Config.DATABASE_FILE)) as connection:
        cursor = connection.execute("DELETE FROM events")
        connection.commit()
        return {"deleted": cursor.rowcount}


@app.get("/api/v1/events/{event_id}/snapshot", dependencies=[Depends(require_api_key)])
def event_snapshot(event_id: int) -> Response:
    if not Config.DATABASE_FILE.exists():
        raise HTTPException(status_code=404, detail="Event database not found")
    with sqlite3.connect(str(Config.DATABASE_FILE)) as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute("SELECT photo_path FROM events WHERE id = ?", (event_id,)).fetchone()
    if not row or not row["photo_path"]:
        raise HTTPException(status_code=404, detail="Event snapshot not found")

    target = (Config.DATA_DIR / row["photo_path"]).resolve()
    data_root = Config.DATA_DIR.resolve()
    if data_root not in target.parents and target != data_root:
        raise HTTPException(status_code=400, detail="Invalid snapshot path")
    if not target.exists():
        raise HTTPException(status_code=404, detail="Snapshot file not found")
    return Response(content=target.read_bytes(), media_type="image/jpeg")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("agent.local_api:app", host="0.0.0.0", port=8081, reload=False)
