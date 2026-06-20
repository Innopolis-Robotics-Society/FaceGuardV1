"""Telemetry service for system monitoring"""

import psutil
import time
from typing import Dict, Any, Optional
from datetime import datetime

from agent.core.config import Config
from agent.core.logging import get_logger


logger = get_logger(__name__)


class TelemetryService:
    """System telemetry and monitoring"""

    def __init__(self):
        self.start_time = time.time()
        self.boot_time = psutil.boot_time()

    def get_cpu_usage(self) -> float:
        """Get CPU usage percentage"""
        try:
            return psutil.cpu_percent(interval=1)
        except Exception as e:
            logger.error(f"Failed to get CPU usage: {e}")
            return 0.0

    def get_cpu_temperature(self) -> Optional[float]:
        """Get CPU temperature (Raspberry Pi specific)"""
        try:
            if Config.is_raspberry_pi():
                # Read from thermal zone
                with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
                    temp = float(f.read().strip()) / 1000.0
                    return temp
            else:
                # Try psutil sensors (may not work on all systems)
                temps = psutil.sensors_temperatures()
                if temps:
                    # Get first available temperature
                    for name, entries in temps.items():
                        if entries:
                            return entries[0].current
                return None
        except Exception as e:
            logger.debug(f"Could not read CPU temperature: {e}")
            return None

    def get_ram_usage(self) -> float:
        """Get RAM usage percentage"""
        try:
            return psutil.virtual_memory().percent
        except Exception as e:
            logger.error(f"Failed to get RAM usage: {e}")
            return 0.0

    def get_disk_usage(self) -> float:
        """Get disk usage percentage"""
        try:
            return psutil.disk_usage(str(Config.DATA_DIR)).percent
        except Exception as e:
            logger.error(f"Failed to get disk usage: {e}")
            return 0.0

    def get_uptime(self) -> int:
        """Get system uptime in seconds"""
        try:
            return int(time.time() - self.boot_time)
        except Exception as e:
            logger.error(f"Failed to get uptime: {e}")
            return 0

    def get_network_status(self) -> str:
        """Get network status"""
        try:
            # Check network interfaces
            net_io = psutil.net_io_counters()
            if net_io.bytes_sent > 0 or net_io.bytes_recv > 0:
                return "online"
            return "offline"
        except Exception as e:
            logger.error(f"Failed to get network status: {e}")
            return "unknown"

    def collect_telemetry(
        self,
        camera_fps: Optional[float] = None,
        recognition_running: bool = False
    ) -> Dict[str, Any]:
        """
        Collect all telemetry data

        Args:
            camera_fps: Current camera FPS
            recognition_running: Whether recognition is active

        Returns:
            Dictionary with all telemetry data
        """
        return {
            "device_id": Config.DEVICE_ID,
            "cpu_usage": self.get_cpu_usage(),
            "cpu_temperature": self.get_cpu_temperature(),
            "ram_usage": self.get_ram_usage(),
            "disk_usage": self.get_disk_usage(),
            "uptime": self.get_uptime(),
            "camera_fps": camera_fps,
            "network_status": self.get_network_status(),
            "recognition_running": recognition_running,
            "created_at": datetime.utcnow().isoformat()
        }

    def get_summary(self) -> Dict[str, Any]:
        """Get telemetry summary"""
        temp = self.get_cpu_temperature()
        temp_str = f"{temp:.1f}°C" if temp is not None else "N/A"

        return {
            "cpu": f"{self.get_cpu_usage():.1f}%",
            "temperature": temp_str,
            "ram": f"{self.get_ram_usage():.1f}%",
            "disk": f"{self.get_disk_usage():.1f}%",
            "uptime": self._format_uptime(self.get_uptime()),
            "network": self.get_network_status()
        }

    def _format_uptime(self, seconds: int) -> str:
        """Format uptime in human-readable format"""
        days = seconds // 86400
        hours = (seconds % 86400) // 3600
        minutes = (seconds % 3600) // 60

        if days > 0:
            return f"{days}d {hours}h {minutes}m"
        elif hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"
