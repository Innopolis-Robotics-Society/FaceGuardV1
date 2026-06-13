from __future__ import annotations

import logging
import os
import shutil
import subprocess
import threading
import time
import zipfile
from datetime import datetime
from pathlib import Path

from app.config import Settings

logger = logging.getLogger(__name__)


class SystemController:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def collect_logs(self) -> Path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        archive_path = self.settings.backups_dir / f"faceguard_logs_{timestamp}.zip"
        with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as archive:
            for path in self.settings.logs_dir.rglob("*"):
                if path.is_file():
                    archive.write(path, path.relative_to(self.settings.logs_dir.parent))
            if self.settings.sqlite_path.exists():
                archive.write(self.settings.sqlite_path, self.settings.sqlite_path.name)
            for model_file in (self.settings.model_path, self.settings.labels_path):
                if model_file.exists():
                    archive.write(model_file, Path("models") / model_file.name)
        logger.info("Diagnostic archive created: %s", archive_path)
        return archive_path

    def restart_agent(self) -> dict[str, object]:
        return self._run_system_action("restart_agent")

    def reboot_device(self) -> dict[str, object]:
        return self._run_system_action("reboot_device")

    def _run_system_action(self, action: str) -> dict[str, object]:
        if not self.settings.system_commands_enabled:
            logger.warning("[SIMULATION] System action requested: %s", action)
            return {"scheduled": False, "simulated": True, "action": action}

        if self.settings.resolved_hardware_mode != "raspberry_pi":
            logger.warning("System action is enabled but current hardware mode is not Raspberry Pi; simulating")
            return {"scheduled": False, "simulated": True, "action": action}

        if action == "restart_agent":
            command = ["sudo", "systemctl", "restart", self.settings.agent_service_name]
        elif action == "reboot_device":
            command = ["sudo", "systemctl", "reboot"]
        else:
            raise ValueError(f"Unsupported system action: {action}")

        def delayed_run() -> None:
            time.sleep(1.0)
            subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        threading.Thread(target=delayed_run, daemon=True).start()
        logger.warning("Scheduled system action: %s", action)
        return {"scheduled": True, "simulated": False, "action": action}
