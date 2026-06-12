from __future__ import annotations

import asyncio
import json
import platform
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, Response, StreamingResponse

from app.api.dependencies import get_state, require_api_key
from app.schemas import CaptureRequest, CommandRequest, DoorOpenRequest, EventResponse, HealthResponse, TelemetryResponse, TrainResponse
from app.state import AgentState

router = APIRouter(prefix="/api/v1")


@router.get("/health", response_model=HealthResponse)
def health(state: AgentState = Depends(get_state)) -> dict[str, object]:
    camera_ready = state.camera.ready
    return {
        "status": "ok" if camera_ready else "degraded",
        "device_id": state.settings.device_id,
        "version": state.settings.app_version,
        "platform": platform.platform(),
        "camera_ready": camera_ready,
        "camera_simulated": state.camera.simulated,
        "recognition_ready": state.recognition.ready,
        "hardware_mode": state.door.mode,
        "timestamp": datetime.now(timezone.utc),
    }


@router.get("/telemetry", response_model=TelemetryResponse, dependencies=[Depends(require_api_key)])
def telemetry(state: AgentState = Depends(get_state)) -> dict[str, object]:
    return state.telemetry.collect()


@router.get("/camera/snapshot", dependencies=[Depends(require_api_key)])
def camera_snapshot(state: AgentState = Depends(get_state)) -> Response:
    jpeg = state.camera.get_jpeg()
    if jpeg is None:
        raise HTTPException(status_code=503, detail="Camera frame is unavailable")
    return Response(content=jpeg, media_type="image/jpeg")


@router.get("/camera/stream", dependencies=[Depends(require_api_key)])
def camera_stream(state: AgentState = Depends(get_state)) -> StreamingResponse:
    def generate():
        while True:
            jpeg = state.camera.get_jpeg()
            if jpeg:
                yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + jpeg + b"\r\n"
            import time
            time.sleep(1 / max(state.settings.camera_fps, 1))

    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")


@router.get("/people", dependencies=[Depends(require_api_key)])
def list_people(state: AgentState = Depends(get_state)) -> list[dict[str, object]]:
    return state.recognition.list_people()


@router.post("/people/{person_id}/capture", dependencies=[Depends(require_api_key)])
async def capture_person(person_id: str, payload: CaptureRequest, state: AgentState = Depends(get_state)) -> dict[str, object]:
    try:
        return await asyncio.to_thread(
            state.recognition.capture_person_photos,
            person_id,
            payload.display_name,
            payload.count,
            payload.interval_seconds,
            payload.strict_face_detection,
        )
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/people/{person_id}/photos", dependencies=[Depends(require_api_key)])
async def upload_person_photo(
    person_id: str,
    display_name: str = Query(min_length=1, max_length=100),
    photo: UploadFile = File(...),
    state: AgentState = Depends(get_state),
) -> dict[str, str]:
    try:
        content = await photo.read()
        return await asyncio.to_thread(
            state.recognition.save_uploaded_photo,
            person_id,
            display_name,
            content,
            photo.filename or "photo.jpg",
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/recognition/train", response_model=TrainResponse, dependencies=[Depends(require_api_key)])
async def train_recognition(state: AgentState = Depends(get_state)) -> dict[str, object]:
    try:
        return await asyncio.to_thread(state.recognition.train_model)
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/recognition/reload", dependencies=[Depends(require_api_key)])
def reload_recognition(state: AgentState = Depends(get_state)) -> dict[str, bool]:
    return {"reloaded": state.recognition.reload_model()}


@router.get("/recognition/status", dependencies=[Depends(require_api_key)])
def recognition_status(state: AgentState = Depends(get_state)) -> dict[str, object]:
    return {
        "ready": state.recognition.ready,
        "people_count": state.recognition.people_count,
        "threshold": state.settings.recognition_threshold,
        "model_path": str(state.settings.model_path),
        "labels_path": str(state.settings.labels_path),
    }


@router.post("/door/open", dependencies=[Depends(require_api_key)])
async def open_door(payload: DoorOpenRequest, state: AgentState = Depends(get_state)) -> dict[str, object]:
    result = await asyncio.to_thread(state.door.open, payload.duration_seconds, payload.reason)
    event = state.store.add_event("manual_door_open", details=result)
    await state.event_bus.publish(event)
    return result


@router.get("/events", response_model=list[EventResponse], dependencies=[Depends(require_api_key)])
def events(
    limit: int = Query(default=100, ge=1, le=1000),
    state: AgentState = Depends(get_state),
) -> list[dict[str, object]]:
    return state.store.list_events(limit=limit)


@router.post("/commands/execute", dependencies=[Depends(require_api_key)])
async def execute_command(payload: CommandRequest, state: AgentState = Depends(get_state)) -> dict[str, object]:
    try:
        return await state.execute_command(payload.command, payload.parameters)
    except (KeyError, ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/system/collect-logs", dependencies=[Depends(require_api_key)])
async def collect_logs(state: AgentState = Depends(get_state)) -> dict[str, str]:
    path = await asyncio.to_thread(state.system.collect_logs)
    return {"archive_path": str(path), "download_url": f"/api/v1/system/log-archives/{path.name}"}


@router.get("/system/log-archives/{filename}", dependencies=[Depends(require_api_key)])
def download_log_archive(filename: str, state: AgentState = Depends(get_state)) -> FileResponse:
    safe_name = Path(filename).name
    path = state.settings.backups_dir / safe_name
    if not path.exists() or path.suffix.lower() != ".zip":
        raise HTTPException(status_code=404, detail="Archive not found")
    return FileResponse(path, media_type="application/zip", filename=safe_name)


@router.post("/system/restart-agent", dependencies=[Depends(require_api_key)])
def restart_agent(state: AgentState = Depends(get_state)) -> dict[str, object]:
    return state.system.restart_agent()


@router.post("/system/reboot", dependencies=[Depends(require_api_key)])
def reboot_device(state: AgentState = Depends(get_state)) -> dict[str, object]:
    return state.system.reboot_device()


async def events_websocket(websocket: WebSocket) -> None:
    state: AgentState = websocket.app.state.agent
    api_key = websocket.query_params.get("api_key")
    if api_key != state.settings.api_key:
        await websocket.close(code=4401)
        return
    await websocket.accept()
    try:
        await websocket.send_json({"type": "connected", "device_id": state.settings.device_id})
        async for event in state.event_bus.subscribe():
            await websocket.send_json({"type": "event", "payload": event})
    except WebSocketDisconnect:
        return
