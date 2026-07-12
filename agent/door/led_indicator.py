"""LED indicator for access control status"""

import time
from enum import Enum
from core.config import Config
from core.logging import get_logger


logger = get_logger(__name__)


class LEDStatus(Enum):
    """LED status indicators"""
    ACCESS_DENIED = "red"          # Доступ отказан
    ACCESS_GRANTED = "green"       # Доступ разрешён (>=60%)
    LOW_CONFIDENCE = "blue"        # Распознан, но <60%
    OFF = "off"                    # Выключен


class LEDIndicator:
    """Control RGB LED for visual feedback"""

    def __init__(self):
        self.led_type = None
        self.red_led = None
        self.green_led = None
        self.blue_led = None
        self._initialize_leds()

    def _initialize_leds(self):
        """Initialize LEDs based on hardware mode"""
        try:
            if Config.is_raspberry_pi():
                self._init_gpio_leds()
            else:
                self._init_mock_leds()
        except Exception as e:
            logger.error(f"Failed to initialize LEDs: {e}")
            self._init_mock_leds()

    def _init_gpio_leds(self):
        """Initialize real GPIO LEDs for Raspberry Pi"""
        try:
            from gpiozero import LED

            red_pin = getattr(Config, 'LED_RED_PIN', 17)
            green_pin = getattr(Config, 'LED_GREEN_PIN', 27)
            blue_pin = getattr(Config, 'LED_BLUE_PIN', 22)

            logger.info(f"Initializing GPIO LEDs (R:{red_pin}, G:{green_pin}, B:{blue_pin})...")

            self.red_led = LED(red_pin)
            self.green_led = LED(green_pin)
            self.blue_led = LED(blue_pin)

            self.led_type = "gpio"
            logger.info("GPIO LEDs initialized successfully")

            # Test LEDs
            self._test_leds()

        except ImportError:
            logger.warning("gpiozero not available, using mock LEDs")
            self._init_mock_leds()
        except Exception as e:
            logger.error(f"GPIO LED initialization failed: {e}")
            raise

    def _init_mock_leds(self):
        """Initialize mock LEDs for development"""
        logger.info("Initializing mock LEDs (development mode)...")
        self.led_type = "mock"
        logger.info("Mock LEDs initialized")

    def _test_leds(self):
        """Quick test of all LEDs"""
        try:
            if self.led_type == "gpio":
                logger.info("Testing LEDs...")
                for led, color in [(self.red_led, "red"), (self.green_led, "green"), (self.blue_led, "blue")]:
                    led.on()
                    time.sleep(0.2)
                    led.off()
                logger.info("LED test completed")
        except Exception as e:
            logger.warning(f"LED test failed: {e}")

    def show_status(self, status: LEDStatus, duration: float = 2.0):
        """
        Show status via LED color

        Args:
            status: LEDStatus enum value
            duration: How long to show the status (seconds)
        """
        try:
            if self.led_type == "gpio":
                # Turn off all LEDs first
                self.red_led.off()
                self.green_led.off()
                self.blue_led.off()

                # Set appropriate color
                if status == LEDStatus.ACCESS_DENIED:
                    self.red_led.on()
                    logger.info("LED: RED (Access denied)")
                elif status == LEDStatus.ACCESS_GRANTED:
                    self.green_led.on()
                    logger.info("LED: GREEN (Access granted)")
                elif status == LEDStatus.LOW_CONFIDENCE:
                    self.blue_led.on()
                    logger.info("LED: BLUE (Low confidence)")

                # Keep LED on for duration
                if status != LEDStatus.OFF:
                    time.sleep(duration)
                    # Turn off after duration
                    self.red_led.off()
                    self.green_led.off()
                    self.blue_led.off()

            elif self.led_type == "mock":
                logger.info(f"[MOCK LED] {status.value.upper()} for {duration}s")
                time.sleep(duration)

        except Exception as e:
            logger.error(f"Failed to show LED status: {e}")

    def show_access_granted(self, duration: float = 2.0):
        """Show green LED - access granted (>=60%)"""
        self.show_status(LEDStatus.ACCESS_GRANTED, duration)

    def show_access_denied(self, duration: float = 2.0):
        """Show red LED - access denied"""
        self.show_status(LEDStatus.ACCESS_DENIED, duration)

    def show_low_confidence(self, duration: float = 2.0):
        """Show blue LED - recognized but <60% confidence"""
        self.show_status(LEDStatus.LOW_CONFIDENCE, duration)

    def turn_off(self):
        """Turn off all LEDs"""
        self.show_status(LEDStatus.OFF)

    def blink(self, status: LEDStatus, times: int = 3, interval: float = 0.3):
        """
        Blink LED

        Args:
            status: Which LED to blink
            times: Number of blinks
            interval: Interval between blinks (seconds)
        """
        try:
            for _ in range(times):
                self.show_status(status, duration=interval)
                time.sleep(interval)
        except Exception as e:
            logger.error(f"Failed to blink LED: {e}")

    def get_status(self) -> dict:
        """Get LED status"""
        status = {
            "led_type": self.led_type,
            "available": self.led_type is not None
        }

        if self.led_type == "gpio":
            status.update({
                "red_pin": getattr(Config, 'LED_RED_PIN', 17),
                "green_pin": getattr(Config, 'LED_GREEN_PIN', 27),
                "blue_pin": getattr(Config, 'LED_BLUE_PIN', 22),
                "red_on": self.red_led.is_lit if self.red_led else False,
                "green_on": self.green_led.is_lit if self.green_led else False,
                "blue_on": self.blue_led.is_lit if self.blue_led else False,
            })

        return status

    def release(self):
        """Release LED resources"""
        try:
            if self.led_type == "gpio":
                if self.red_led:
                    self.red_led.close()
                if self.green_led:
                    self.green_led.close()
                if self.blue_led:
                    self.blue_led.close()
                logger.info("GPIO LEDs released")
        except Exception as e:
            logger.error(f"Error releasing LEDs: {e}")

    def __del__(self):
        """Cleanup on deletion"""
        self.release()
