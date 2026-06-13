from __future__ import annotations

import os
import time
from datetime import datetime, timezone
from pathlib import Path

import psutil

from app.config import Settings
from app.services.camera import CameraService


class TelemetryService:
    def __init__(self, settings: Settings, camera: CameraService, recognition: object) -> None:
        self.settings = settings
        self.camera = camera
        self.recognition = recognition
        self._boot_time = psutil.boot_time()

    def collect(self) -> dict[str, object]:
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage(str(self.settings.data_dir))
        temperature = self._read_cpu_temperature()
        return {
            "device_id": self.settings.device_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "cpu_percent": psutil.cpu_percent(interval=None),
            "memory_percent": memory.percent,
            "memory_used_mb": round(memory.used / 1024 / 1024, 2),
            "memory_total_mb": round(memory.total / 1024 / 1024, 2),
            "disk_percent": disk.percent,
            "disk_free_gb": round(disk.free / 1024 / 1024 / 1024, 2),
            "uptime_seconds": max(0.0, time.time() - self._boot_time),
            "cpu_temperature_c": temperature,
            "camera_ready": self.camera.ready,
            "camera_simulated": self.camera.simulated,
            "camera_fps": round(self.camera.measured_fps, 2),
            "recognition_ready": bool(getattr(self.recognition, "ready", False)),
            "model_people_count": int(getattr(self.recognition, "people_count", 0)),
        }

    @staticmethod
    def _read_cpu_temperature() -> float | None:
        candidates = [
            Path("/sys/class/thermal/thermal_zone0/temp"),
            Path("/sys/class/hwmon/hwmon0/temp1_input"),
        ]
        for candidate in candidates:
            try:
                if candidate.exists():
                    value = float(candidate.read_text().strip())
                    return round(value / 1000 if value > 1000 else value, 2)
            except (OSError, ValueError):
                continue
        try:
            temperatures = psutil.sensors_temperatures()
            for entries in temperatures.values():
                if entries:
                    return round(float(entries[0].current), 2)
        except (AttributeError, OSError):
            pass
        return None
