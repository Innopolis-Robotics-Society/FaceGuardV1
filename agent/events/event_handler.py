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

        logger.info(f"EventHandler initialized (mode: {Config.DOOR_CONTROL_MODE}, servo: {self.use_servo}, led: {self.use_led})")

    async def on_person_recognized(
        self,
        person_id: str,
        confidence: float,
        snapshot_path: str
    ):
        """
        Handle recognized person event

        Args:
            person_id: UUID of recognized person
            confidence: Raw OpenCV LBPH distance (lower is better)
            snapshot_path: Path to event snapshot
        """
        logger.info(f"Person recognized: {person_id} (distance: {confidence:.1f})")

        # Determine access based on confidence
        # For LBPH: lower distance = better match
        # Convert to confidence percentage: higher = better
        confidence_percent = max(0, 100 - confidence)

        door_opened = False

        if confidence_percent >= 60:
            # Access granted
            logger.info(f"Access GRANTED: {confidence_percent:.1f}% confidence")

            # Show green LED if enabled
            if self.use_led and self.led:
                await asyncio.to_thread(self.led.show_access_granted)

            # Open door if servo enabled
            if self.use_servo and self.door:
                door_opened = await asyncio.to_thread(self.door.open_door)
        else:
            # Recognized but low confidence
            logger.info(f"Access DENIED (low confidence): {confidence_percent:.1f}%")

            # Show blue LED if enabled
            if self.use_led and self.led:
                await asyncio.to_thread(self.led.show_low_confidence)

        # Create event
        event_data = {
            "person_id": person_id,
            "event_type": "recognized",
            "confidence": confidence,
            "door_opened": door_opened,
            "photo_path": snapshot_path,
            "video_path": None,
            "created_at": datetime.utcnow().isoformat()
        }

        # Send/buffer event
        await self.sync.add_event(event_data)

        logger.info(f"Event created: recognized person {person_id}")

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
