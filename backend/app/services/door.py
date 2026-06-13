from __future__ import annotations

import logging
import threading
import time

from app.config import Settings

logger = logging.getLogger(__name__)


class DoorController:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.mode = settings.resolved_hardware_mode
        self._servo = None
        self._lock = threading.Lock()
        self._open = False

        if self.mode == "raspberry_pi":
            try:
                from gpiozero import Servo

                self._servo = Servo(settings.servo_gpio_pin)
                self._servo.value = settings.servo_closed_value
                logger.info("GPIO servo initialized on pin %s", settings.servo_gpio_pin)
            except Exception as exc:
                logger.exception("GPIO initialization failed, switching to mock mode: %s", exc)
                self.mode = "mock"

    @property
    def is_open(self) -> bool:
        return self._open

    def open(self, duration_seconds: float | None = None, reason: str = "manual") -> dict[str, object]:
        duration = duration_seconds or self.settings.door_open_seconds
        with self._lock:
            logger.info("Opening door for %.2f seconds; reason=%s; mode=%s", duration, reason, self.mode)
            self._set_position(opened=True)
            self._open = True
            time.sleep(duration)
            self._set_position(opened=False)
            self._open = False
        return {"opened": True, "duration_seconds": duration, "reason": reason, "mode": self.mode}

    def _set_position(self, *, opened: bool) -> None:
        if self.mode == "mock" or self._servo is None:
            logger.info("[MOCK SERVO] %s", "OPEN" if opened else "CLOSED")
            return
        self._servo.value = self.settings.servo_open_value if opened else self.settings.servo_closed_value
