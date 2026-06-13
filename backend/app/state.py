from __future__ import annotations

import asyncio
from typing import Any

from app.config import Settings
from app.services.camera import CameraService
from app.services.central_client import CentralClient
from app.services.door import DoorController
from app.services.event_bus import EventBus
from app.services.recognition import RecognitionService
from app.services.store import LocalStore
from app.services.system_control import SystemController
from app.services.telemetry import TelemetryService


class AgentState:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.store = LocalStore(settings.sqlite_path)
        self.event_bus = EventBus()
        self.camera = CameraService(settings)
        self.door = DoorController(settings)
        self.system = SystemController(settings)
        self.recognition = RecognitionService(settings, self.camera, self.door, self.store, self.event_bus)
        self.telemetry = TelemetryService(settings, self.camera, self.recognition)
        self.central = CentralClient(settings, self.telemetry, self.store, self.execute_command)

    async def start(self) -> None:
        self.recognition.set_event_loop(asyncio.get_running_loop())
        self.camera.start()
        self.recognition.start()
        self.central.start()

    async def stop(self) -> None:
        await self.central.stop()
        self.recognition.stop()
        self.camera.stop()

    async def execute_command(self, command: str, parameters: dict[str, Any]) -> dict[str, Any]:
        command_id = self.store.create_command(command, parameters)
        try:
            if command == "open_door":
                result = await asyncio.to_thread(
                    self.door.open,
                    parameters.get("duration_seconds"),
                    parameters.get("reason", "remote-command"),
                )
            elif command == "reload_faces":
                result = {"reloaded": self.recognition.reload_model()}
            elif command == "train_model":
                result = await asyncio.to_thread(self.recognition.train_model)
            elif command == "capture_photos":
                result = await asyncio.to_thread(
                    self.recognition.capture_person_photos,
                    str(parameters["person_id"]),
                    str(parameters["display_name"]),
                    int(parameters.get("count", 10)),
                    float(parameters.get("interval_seconds", 0.35)),
                    bool(parameters.get("strict_face_detection", True)),
                )
            elif command == "collect_logs":
                archive = await asyncio.to_thread(self.system.collect_logs)
                result = {"archive_path": str(archive)}
            elif command == "restart_agent":
                result = self.system.restart_agent()
            elif command == "reboot_device":
                result = self.system.reboot_device()
            else:
                raise ValueError(f"Unsupported command: {command}")
            self.store.complete_command(command_id, result=result)
            return {"command_id": command_id, **result}
        except Exception as exc:
            self.store.complete_command(command_id, error_message=str(exc))
            raise
