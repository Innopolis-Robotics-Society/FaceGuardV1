"""API client for backend communication"""

import httpx
import json
from typing import Dict, Any, List, Optional
from datetime import datetime

from agent.core.config import Config
from agent.core.logging import get_logger


logger = get_logger(__name__)


class BackendClient:
    """HTTP client for communicating with backend service"""

    def __init__(self):
        self.base_url = Config.BACKEND_URL
        self.device_id = Config.DEVICE_ID
        self.device_code = Config.DEVICE_CODE
        self.timeout = 10.0
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=self.timeout,
                headers={
                    "User-Agent": "FaceGuard-Agent/1.0"
                }
            )
        return self._client

    async def close(self):
        """Close HTTP client"""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def register_device(self) -> Dict[str, Any]:
        """Register device with backend"""
        try:
            client = await self._get_client()
            response = await client.post(
                "/api/v1/devices/",
                json={
                    "name": f"Raspberry Pi - {Config.DEVICE_CODE}",
                    "device_code": Config.DEVICE_CODE
                }
            )
            response.raise_for_status()
            data = response.json()

            # Store device_id if returned
            if "id" in data:
                Config.DEVICE_ID = data["id"]
                logger.info(f"Device registered with ID: {Config.DEVICE_ID}")

            return data

        except httpx.HTTPError as e:
            logger.error(f"Failed to register device: {e}")
            raise

    async def send_heartbeat(
        self,
        telemetry: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send heartbeat to backend

        Args:
            telemetry: Optional telemetry data to include

        Returns:
            True if successful
        """
        try:
            if not self.device_id:
                logger.warning("No device_id, attempting to register...")
                await self.register_device()

            client = await self._get_client()

            # Send heartbeat by device_code
            response = await client.post(
                f"/api/v1/devices/by-code/{self.device_code}/heartbeat",
                json={
                    "ip_address": telemetry.get("ip_address") if telemetry else None,
                    "software_version": "1.0.0",
                    "camera_status": "ok" if telemetry else "unknown",
                    "recognition_status": "running" if telemetry and telemetry.get("recognition_running") else "stopped"
                }
            )
            response.raise_for_status()

            logger.debug("Heartbeat sent successfully")
            return True

        except httpx.HTTPError as e:
            logger.error(f"Failed to send heartbeat: {e}")
            return False

    async def send_telemetry(self, telemetry_data: Dict[str, Any]) -> bool:
        """
        Send telemetry to backend

        Args:
            telemetry_data: Telemetry data dictionary

        Returns:
            True if successful
        """
        try:
            if not self.device_id:
                logger.warning("No device_id for telemetry")
                return False

            client = await self._get_client()
            response = await client.post(
                "/api/v1/telemetry/",
                json=telemetry_data
            )
            response.raise_for_status()

            logger.debug("Telemetry sent successfully")
            return True

        except httpx.HTTPError as e:
            logger.error(f"Failed to send telemetry: {e}")
            return False

    async def send_event(self, event_data: Dict[str, Any]) -> bool:
        """
        Send recognition event to backend

        Args:
            event_data: Event data dictionary

        Returns:
            True if successful
        """
        try:
            if not self.device_id:
                logger.warning("No device_id for event")
                return False

            client = await self._get_client()
            response = await client.post(
                "/api/v1/events/",
                json=event_data
            )
            response.raise_for_status()

            logger.info(f"Event sent: {event_data.get('event_type')}")
            return True

        except httpx.HTTPError as e:
            logger.error(f"Failed to send event: {e}")
            return False

    async def sync_events_batch(self, events: List[Dict[str, Any]]) -> bool:
        """
        Sync multiple events in batch

        Args:
            events: List of event dictionaries

        Returns:
            True if successful
        """
        try:
            if not events:
                return True

            if not self.device_id:
                logger.warning("No device_id for batch sync")
                return False

            client = await self._get_client()
            response = await client.post(
                f"/api/v1/sync/events/bulk?device_id={self.device_id}",
                json=events
            )
            response.raise_for_status()

            logger.info(f"Synced {len(events)} events successfully")
            return True

        except httpx.HTTPError as e:
            logger.error(f"Failed to sync events batch: {e}")
            return False

    async def sync_telemetry_batch(self, telemetry_list: List[Dict[str, Any]]) -> bool:
        """
        Sync multiple telemetry records in batch

        Args:
            telemetry_list: List of telemetry dictionaries

        Returns:
            True if successful
        """
        try:
            if not telemetry_list:
                return True

            if not self.device_id:
                logger.warning("No device_id for batch sync")
                return False

            client = await self._get_client()
            response = await client.post(
                f"/api/v1/sync/telemetry/bulk?device_id={self.device_id}",
                json=telemetry_list
            )
            response.raise_for_status()

            logger.info(f"Synced {len(telemetry_list)} telemetry records successfully")
            return True

        except httpx.HTTPError as e:
            logger.error(f"Failed to sync telemetry batch: {e}")
            return False

    async def get_pending_commands(self) -> List[Dict[str, Any]]:
        """
        Get pending commands from backend

        Returns:
            List of command dictionaries
        """
        try:
            if not self.device_id:
                return []

            client = await self._get_client()
            response = await client.get(
                f"/api/v1/commands/pending?device_id={self.device_id}"
            )
            response.raise_for_status()

            commands = response.json()
            if commands:
                logger.info(f"Received {len(commands)} pending commands")

            return commands

        except httpx.HTTPError as e:
            logger.error(f"Failed to get pending commands: {e}")
            return []

    async def update_command_status(
        self,
        command_id: str,
        status: str,
        result: Optional[Dict] = None,
        error: Optional[str] = None
    ) -> bool:
        """
        Update command execution status

        Args:
            command_id: Command ID
            status: New status (completed, failed, etc.)
            result: Optional result data
            error: Optional error message

        Returns:
            True if successful
        """
        try:
            client = await self._get_client()

            update_data = {
                "status": status,
                "completed_at": datetime.utcnow().isoformat()
            }

            if result is not None:
                update_data["result"] = result

            if error is not None:
                update_data["error_message"] = error

            response = await client.patch(
                f"/api/v1/commands/{command_id}",
                json=update_data
            )
            response.raise_for_status()

            logger.info(f"Command {command_id} status updated to {status}")
            return True

        except httpx.HTTPError as e:
            if hasattr(e, 'response') and e.response is not None:
                logger.error(
                    f"Failed to update command status: HTTP {e.response.status_code}; body={e.response.text}; payload={update_data}"
                )
            else:
                logger.error(f"Failed to update command status: {e}; payload={update_data}")
            return False

    async def check_connection(self) -> bool:
        """
        Check if backend is reachable

        Returns:
            True if backend is reachable
        """
        try:
            client = await self._get_client()
            response = await client.get("/api/v1/system/health", timeout=5.0)
            response.raise_for_status()
            return True

        except Exception as e:
            logger.debug(f"Backend not reachable: {e}")
            return False
