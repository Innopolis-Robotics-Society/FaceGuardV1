#!/usr/bin/env python3
"""
Test script for LED indicator

Tests all LED colors and patterns on Raspberry Pi.
"""

import sys
import time
from pathlib import Path

# Add agent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from door.led_indicator import LEDIndicator, LEDStatus
from core.logging import get_logger

logger = get_logger(__name__)


def test_basic_colors():
    """Test basic LED colors"""
    print("\n=== Testing Basic LED Colors ===\n")

    led = LEDIndicator()

    print("Testing RED LED (Access Denied)...")
    led.show_access_denied(duration=2.0)
    time.sleep(0.5)

    print("Testing GREEN LED (Access Granted)...")
    led.show_access_granted(duration=2.0)
    time.sleep(0.5)

    print("Testing BLUE LED (Low Confidence)...")
    led.show_low_confidence(duration=2.0)
    time.sleep(0.5)

    print("Turning OFF...")
    led.turn_off()

    led.release()
    print("\nBasic color test completed!")


def test_blinking():
    """Test LED blinking patterns"""
    print("\n=== Testing LED Blinking ===\n")

    led = LEDIndicator()

    print("Blinking RED...")
    led.blink(LEDStatus.ACCESS_DENIED, times=3, interval=0.3)
    time.sleep(0.5)

    print("Blinking GREEN...")
    led.blink(LEDStatus.ACCESS_GRANTED, times=3, interval=0.3)
    time.sleep(0.5)

    print("Blinking BLUE...")
    led.blink(LEDStatus.LOW_CONFIDENCE, times=3, interval=0.3)
    time.sleep(0.5)

    led.release()
    print("\nBlink test completed!")


def test_status():
    """Test LED status reporting"""
    print("\n=== Testing LED Status ===\n")

    led = LEDIndicator()

    status = led.get_status()
    print(f"LED Type: {status['led_type']}")
    print(f"Available: {status['available']}")

    if status['led_type'] == 'gpio':
        print(f"Red Pin: {status['red_pin']}")
        print(f"Green Pin: {status['green_pin']}")
        print(f"Blue Pin: {status['blue_pin']}")

    led.release()
    print("\nStatus test completed!")


def test_scenarios():
    """Test real-world scenarios"""
    print("\n=== Testing Real-World Scenarios ===\n")

    led = LEDIndicator()

    # Scenario 1: Unknown person detected
    print("Scenario 1: Unknown person detected")
    print("  → Showing RED LED (access denied)")
    led.show_access_denied(duration=2.0)
    time.sleep(1.0)

    # Scenario 2: Known person, high confidence
    print("Scenario 2: Known person recognized (75% confidence)")
    print("  → Showing GREEN LED (access granted)")
    led.show_access_granted(duration=2.0)
    time.sleep(1.0)

    # Scenario 3: Known person, low confidence
    print("Scenario 3: Known person recognized (45% confidence)")
    print("  → Showing BLUE LED (low confidence)")
    led.show_low_confidence(duration=2.0)
    time.sleep(1.0)

    led.release()
    print("\nScenario test completed!")


def main():
    """Run all tests"""
    print("=" * 60)
    print("FaceGuard LED Indicator Test")
    print("=" * 60)

    try:
        test_status()
        test_basic_colors()
        test_blinking()
        test_scenarios()

        print("\n" + "=" * 60)
        print("All tests completed successfully!")
        print("=" * 60)

    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        logger.error(f"Test failed: {e}", exc_info=True)
        print(f"\nError: {e}")
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
