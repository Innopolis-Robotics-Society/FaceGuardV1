"""Door controller for managing servo motor"""

import time
from typing import Optional
from core.config import Config
from core.logging import get_logger


logger = get_logger(__name__)


class DoorController:
    """Control door via GPIO servo motor"""

    def __init__(self):
        self.servo = None
        self.is_open = False
        self._initialize_servo()

    def _initialize_servo(self):
        """Initialize servo based on hardware mode"""
        try:
            if Config.is_raspberry_pi():
                self._init_gpio_servo()
            else:
                self._init_mock_servo()
        except Exception as e:
            logger.error(f"Failed to initialize servo: {e}")
            self._init_mock_servo()

    def _init_gpio_servo(self):
        """Initialize real GPIO servo for Raspberry Pi"""
        try:
            from gpiozero import Servo
            from gpiozero.pins.pigpio import PiGPIOFactory

            logger.info(f"Initializing GPIO servo on pin {Config.SERVO_GPIO_PIN}...")

            # Try to use pigpio for better PWM (reduces jitter)
            try:
                factory = PiGPIOFactory()
                self.servo = Servo(
                    Config.SERVO_GPIO_PIN,
                    pin_factory=factory,
                    min_pulse_width=0.5/1000,
                    max_pulse_width=2.5/1000
                )
                logger.info("GPIO servo initialized with pigpio")
            except Exception:
                # Fallback to default pin factory
                self.servo = Servo(
                    Config.SERVO_GPIO_PIN,
                    min_pulse_width=0.5/1000,
                    max_pulse_width=2.5/1000
                )
                logger.info("GPIO servo initialized with default factory")

            self.servo_type = "gpio"
            logger.info("GPIO servo initialized successfully")

        except ImportError:
            logger.warning("gpiozero not available, using mock servo")
            self._init_mock_servo()
        except Exception as e:
            logger.error(f"GPIO servo initialization failed: {e}")
            raise

    def _init_mock_servo(self):
        """Initialize mock servo for development"""
        logger.info("Initializing mock servo (development mode)...")
        self.servo = None
        self.servo_type = "mock"
        logger.info("Mock servo initialized")

    def open_door(self, duration: Optional[int] = None) -> bool:
        """
        Open door for specified duration

        Args:
            duration: Seconds to keep door open (default: Config.DOOR_OPEN_DURATION)

        Returns:
            True if successful
        """
        if duration is None:
            duration = Config.DOOR_OPEN_DURATION

        try:
            logger.info(f"Opening door for {duration} seconds...")

            if self.servo_type == "gpio" and self.servo:
                # Move servo to open position (max angle)
                self.servo.max()
                self.is_open = True
                logger.info("Servo moved to OPEN position")

                # Wait
                time.sleep(duration)

                # Return to closed position
                self.servo.min()
                self.is_open = False
                logger.info("Servo moved to CLOSED position")

            elif self.servo_type == "mock":
                logger.info(f"[MOCK] Door opened for {duration} seconds")
                self.is_open = True

                # Simulate delay
                time.sleep(duration)

                self.is_open = False
                logger.info("[MOCK] Door closed")

            logger.info("Door operation completed successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to open door: {e}")
            return False

    def emergency_open(self):
        """Emergency open without auto-close"""
        try:
            logger.warning("EMERGENCY DOOR OPEN")

            if self.servo_type == "gpio" and self.servo:
                self.servo.max()
                self.is_open = True
                logger.info("Servo moved to OPEN position (emergency)")

            elif self.servo_type == "mock":
                logger.info("[MOCK] Emergency door open")
                self.is_open = True

            return True

        except Exception as e:
            logger.error(f"Failed emergency open: {e}")
            return False

    def close_door(self):
        """Manually close door"""
        try:
            if not self.is_open:
                logger.info("Door already closed")
                return True

            logger.info("Manually closing door...")

            if self.servo_type == "gpio" and self.servo:
                self.servo.min()
                self.is_open = False
                logger.info("Servo moved to CLOSED position")

            elif self.servo_type == "mock":
                logger.info("[MOCK] Door closed manually")
                self.is_open = False

            return True

        except Exception as e:
            logger.error(f"Failed to close door: {e}")
            return False

    def get_status(self) -> dict:
        """Get door status"""
        return {
            "servo_type": self.servo_type,
            "is_open": self.is_open,
            "gpio_pin": Config.SERVO_GPIO_PIN if self.servo_type == "gpio" else None,
            "available": self.servo is not None or self.servo_type == "mock"
        }

    def release(self):
        """Release servo resources"""
        try:
            if self.servo_type == "gpio" and self.servo:
                self.servo.close()
                logger.info("GPIO servo released")
        except Exception as e:
            logger.error(f"Error releasing servo: {e}")

    def __del__(self):
        """Cleanup on deletion"""
        self.release()
