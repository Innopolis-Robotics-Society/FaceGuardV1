"""Sync manager for offline buffering and synchronization"""

import asyncio
from typing import Optional
from datetime import datetime

from core.config import Config
from core.database import Database
from core.logging import get_logger
from sync.backend_client import BackendClient


logger = get_logger(__name__)


class SyncManager:
    """Manages offline buffering and synchronization with backend"""

    def __init__(self, backend_client: BackendClient, database: Database):
        self.backend = backend_client
        self.db = database
        self.is_running = False
        self.is_online = False
        self.sync_task: Optional[asyncio.Task] = None

    async def start(self):
        """Start sync manager"""
        if self.is_running:
            logger.warning("Sync manager already running")
            return

        self.is_running = True
        self.sync_task = asyncio.create_task(self._sync_loop())
        logger.info("Sync manager started")

    async def stop(self):
        """Stop sync manager"""
        self.is_running = False

        if self.sync_task:
            self.sync_task.cancel()
            try:
                await self.sync_task
            except asyncio.CancelledError:
                pass

        logger.info("Sync manager stopped")

    async def _sync_loop(self):
        """Main synchronization loop"""
        while self.is_running:
            try:
                # Check connection
                is_online = await self.backend.check_connection()

                if is_online != self.is_online:
                    self.is_online = is_online
                    if is_online:
                        logger.info("Backend connection established")
                        await self._on_reconnect()
                    else:
                        logger.warning("Backend connection lost - entering offline mode")

                if self.is_online:
                    # Sync unsynced data
                    await self._sync_unsynced_events()
                    await self._sync_unsynced_telemetry()

                # Wait before next sync
                await asyncio.sleep(Config.SYNC_INTERVAL)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in sync loop: {e}", exc_info=True)
                await asyncio.sleep(Config.SYNC_INTERVAL)

    async def _on_reconnect(self):
        """Handle reconnection to backend"""
        logger.info("Reconnected to backend - syncing offline data...")

        # Register device if needed
        if not Config.DEVICE_ID:
            try:
                await self.backend.register_device()
            except Exception as e:
                logger.error(f"Failed to register device: {e}")

    async def _sync_unsynced_events(self):
        """Sync unsynced events to backend"""
        try:
            unsynced = self.db.get_unsynced_events(limit=100)

            if not unsynced:
                return

            logger.info(f"Syncing {len(unsynced)} unsynced events...")

            # Convert to backend format
            events_to_sync = []
            for event in unsynced:
                events_to_sync.append({
                    "device_id": Config.DEVICE_ID,
                    "person_id": event.get("person_id"),
                    "event_type": event["event_type"],
                    "confidence": event.get("confidence"),
                    "door_opened": bool(event.get("door_opened")),
                    "photo_path": event.get("photo_path"),
                    "video_path": event.get("video_path")
                })

            # Send batch
            success = await self.backend.sync_events_batch(events_to_sync)

            if success:
                # Mark as synced
                event_ids = [e["id"] for e in unsynced]
                self.db.mark_events_synced(event_ids)
                logger.info(f"Successfully synced {len(unsynced)} events")

        except Exception as e:
            logger.error(f"Failed to sync events: {e}")

    async def _sync_unsynced_telemetry(self):
        """Sync unsynced telemetry to backend"""
        try:
            unsynced = self.db.get_unsynced_telemetry(limit=100)

            if not unsynced:
                return

            logger.info(f"Syncing {len(unsynced)} unsynced telemetry records...")

            # Convert to backend format
            telemetry_to_sync = []
            for telem in unsynced:
                telemetry_to_sync.append({
                    "device_id": Config.DEVICE_ID,
                    "cpu_usage": telem.get("cpu_usage"),
                    "cpu_temperature": telem.get("cpu_temperature"),
                    "ram_usage": telem.get("ram_usage"),
                    "disk_usage": telem.get("disk_usage"),
                    "uptime": telem.get("uptime"),
                    "camera_fps": telem.get("camera_fps"),
                    "network_status": telem.get("network_status")
                })

            # Send batch
            success = await self.backend.sync_telemetry_batch(telemetry_to_sync)

            if success:
                # Mark as synced
                telemetry_ids = [t["id"] for t in unsynced]
                self.db.mark_telemetry_synced(telemetry_ids)
                logger.info(f"Successfully synced {len(unsynced)} telemetry records")

        except Exception as e:
            logger.error(f"Failed to sync telemetry: {e}")

    async def add_event(self, event_data: dict):
        """
        Add event (try to send immediately, fallback to buffer)

        Args:
            event_data: Event data dictionary
        """
        # Always save to local database
        event_data["device_id"] = Config.DEVICE_ID
        event_id = self.db.add_event(event_data)

        # Try to send immediately if online
        if self.is_online:
            try:
                success = await self.backend.send_event(event_data)
                if success:
                    self.db.mark_events_synced([event_id])
                    logger.debug("Event sent immediately")
                else:
                    logger.debug("Event buffered for later sync")
            except Exception as e:
                logger.error(f"Failed to send event: {e}")
        else:
            logger.debug("Offline - event buffered")

    async def add_telemetry(self, telemetry_data: dict):
        """
        Add telemetry (try to send immediately, fallback to buffer)

        Args:
            telemetry_data: Telemetry data dictionary
        """
        # Always save to local database
        telemetry_data["device_id"] = Config.DEVICE_ID
        telemetry_id = self.db.add_telemetry(telemetry_data)

        # Try to send immediately if online
        if self.is_online:
            try:
                success = await self.backend.send_telemetry(telemetry_data)
                if success:
                    self.db.mark_telemetry_synced([telemetry_id])
            except Exception as e:
                logger.debug(f"Telemetry buffered: {e}")

    def get_sync_status(self) -> dict:
        """Get synchronization status"""
        unsynced_events = len(self.db.get_unsynced_events(limit=1000))
        unsynced_telemetry = len(self.db.get_unsynced_telemetry(limit=1000))

        return {
            "is_online": self.is_online,
            "backend_url": Config.BACKEND_URL,
            "device_id": Config.DEVICE_ID,
            "unsynced_events": unsynced_events,
            "unsynced_telemetry": unsynced_telemetry,
            "needs_sync": unsynced_events > 0 or unsynced_telemetry > 0
        }
