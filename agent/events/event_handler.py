"""Event handler for recognition events"""

import asyncio
from datetime import datetime
from typing import Optional

from core.config import Config
from core.logging import get_logger


logger = get_logger(__name__)


class EventHandler:
    """Handles recognition events and triggers actions"""

    def __init__(self, door_controller, sync_manager, led_indicator=None):
        self.door = door_controller
        self.sync = sync_manager
        self.led = led_indicator
        self.use_servo = Config.use_servo()
        self.use_led = Config.use_led()
        self.is_door_opening = False  # Flag to block recognition during door operation

        logger.info(f"EventHandler initialized (mode: {Config.DOOR_CONTROL_MODE}, servo: {self.use_servo}, led: {self.use_led})")

    async def on_person_recognized(
        self,
        person_id: str,
        confidence: float,
        snapshot_path: str,
        raw_distance: float = None
    ):
        """
        Handle recognized person event

        Args:
            person_id: UUID of recognized person
            confidence: Confidence percentage (0-100%, higher is better)
            snapshot_path: Path to event snapshot
            raw_distance: Raw LBPH distance for backend compatibility (optional)
        """
        logger.info(f"Person recognized: {person_id} (confidence: {confidence:.1f}%)")

        door_opened = False
        led_duration = Config.LED_DURATION

        if confidence >= Config.LED_CONFIDENCE_THRESHOLD:
            # Access granted
            logger.info(f"Access GRANTED: {confidence:.1f}% confidence")

            # Set flag to block recognition during LED/door operation
            self.is_door_opening = True

            # Calculate operation duration
            # If servo enabled: LED duration = door open time
            # If only LED: LED duration = DOOR_OPEN_DURATION (for consistency)
            operation_duration = Config.DOOR_OPEN_DURATION
            led_duration = operation_duration

            # Show green LED if enabled (will stay on during operation)
            if self.use_led and self.led:
                # Start LED in background (non-blocking)
                asyncio.create_task(self._show_led_async(self.led.show_access_granted, led_duration))

            # Open door if servo enabled
            if self.use_servo and self.door:
                door_opened = await asyncio.to_thread(self.door.open_door)
            else:
                # If no servo, just wait for LED duration to keep recognition blocked
                await asyncio.sleep(operation_duration)

            # Clear flag after operation completes
            self.is_door_opening = False

        else:
            # Recognized but low confidence
            logger.info(f"Access DENIED (low confidence): {confidence:.1f}%")

            # Show blue LED if enabled
            if self.use_led and self.led:
                await asyncio.to_thread(self.led.show_low_confidence)

        # Create event
        # Send raw_distance to backend for compatibility (backend expects LBPH distance)
        # If raw_distance not provided, use confidence for backward compatibility
        event_data = {
            "person_id": person_id,
            "event_type": "recognized",
            "confidence": raw_distance if raw_distance is not None else confidence,
            "door_opened": door_opened,
            "photo_path": snapshot_path,
            "video_path": None,
            "created_at": datetime.utcnow().isoformat()
        }

        # Send/buffer event
        await self.sync.add_event(event_data)

        logger.info(f"Event created: recognized person {person_id}")

    async def _show_led_async(self, led_func, duration: float):
        """Helper to show LED asynchronously"""
        try:
            await asyncio.to_thread(led_func, duration)
        except Exception as e:
            logger.error(f"Error showing LED: {e}")

    async def on_unknown_person(
        self,
        confidence: float,
        snapshot_path: str
    ):
        """
        Handle unknown person event

        Args:
            confidence: Raw OpenCV LBPH distance (lower is better)
            snapshot_path: Path to event snapshot
        """
        logger.info(f"Unknown person detected (distance: {confidence:.1f})")

        # Unknown person - red LED (access denied)
        if self.use_led and self.led:
            await asyncio.to_thread(self.led.show_access_denied)

        # Create event
        event_data = {
            "person_id": None,
            "event_type": "unknown",
            "confidence": confidence,
            "door_opened": False,
            "photo_path": snapshot_path,
            "video_path": None,
            "created_at": datetime.utcnow().isoformat()
        }

        # Send/buffer event
        await self.sync.add_event(event_data)

        logger.info("Event created: unknown person")

    async def on_access_denied(
        self,
        person_id: Optional[str],
        reason: str,
        snapshot_path: str
    ):
        """
        Handle access denied event

        Args:
            person_id: UUID of person (if recognized)
            reason: Reason for denial
            snapshot_path: Path to event snapshot
        """
        logger.warning(f"Access denied: {reason}")

        # Access denied - red LED
        if self.use_led and self.led:
            await asyncio.to_thread(self.led.show_access_denied)

        # Create event
        event_data = {
            "person_id": person_id,
            "event_type": "access_denied",
            "confidence": None,
            "door_opened": False,
            "photo_path": snapshot_path,
            "video_path": None,
            "created_at": datetime.utcnow().isoformat()
        }

        # Send/buffer event
        await self.sync.add_event(event_data)

        logger.info("Event created: access denied")

    async def on_manual_open(self, user_id: Optional[str] = None):
        """
        Handle manual door open event

        Args:
            user_id: ID of user who triggered manual open
        """
        logger.info("Manual door open")

        # Create event
        event_data = {
            "person_id": None,
            "event_type": "manual_open",
            "confidence": None,
            "door_opened": True,
            "photo_path": None,
            "video_path": None,
            "created_at": datetime.utcnow().isoformat()
        }

        # Send/buffer event
        await self.sync.add_event(event_data)

        logger.info("Event created: manual open")
