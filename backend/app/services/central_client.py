from __future__ import annotations

import asyncio
import logging
from typing import Any, Awaitable, Callable

import httpx

from app.config import Settings
from app.services.store import LocalStore
from app.services.telemetry import TelemetryService

logger = logging.getLogger(__name__)


class CentralClient:
    """Optional outbound connection to the future central FastAPI server.

    When CENTRAL_SERVER_URL is empty, the agent remains fully offline and all
    events stay in the local SQLite queue.
    """

    def __init__(
        self,
        settings: Settings,
        telemetry: TelemetryService,
        store: LocalStore,
        command_handler: Callable[[str, dict[str, Any]], Awaitable[dict[str, Any]]],
    ) -> None:
        self.settings = settings
        self.telemetry = telemetry
        self.store = store
        self.command_handler = command_handler
        self._task: asyncio.Task[None] | None = None
        self._stop_event = asyncio.Event()

    def start(self) -> None:
        if not self.settings.central_server_url or self._task:
            return
        self._stop_event.clear()
        self._task = asyncio.create_task(self._run(), name="central-client")

    async def stop(self) -> None:
        self._stop_event.set()
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _run(self) -> None:
        headers = {}
        if self.settings.central_device_token:
            headers["X-Device-Token"] = self.settings.central_device_token
        timeout = httpx.Timeout(self.settings.central_timeout_seconds)
        async with httpx.AsyncClient(base_url=self.settings.central_server_url, headers=headers, timeout=timeout) as client:
            while not self._stop_event.is_set():
                try:
                    await self._send_heartbeat(client)
                    await self._sync_events(client)
                    await self._poll_commands(client)
                except Exception as exc:
                    logger.warning("Central server unavailable: %s", exc)
                await asyncio.sleep(self.settings.heartbeat_interval_seconds)

    async def _send_heartbeat(self, client: httpx.AsyncClient) -> None:
        response = await client.post(
            f"/api/v1/devices/{self.settings.device_id}/heartbeat",
            json=self.telemetry.collect(),
        )
        response.raise_for_status()

    async def _sync_events(self, client: httpx.AsyncClient) -> None:
        events = self.store.list_events(limit=100, only_unsynced=True)
        if not events:
            return
        response = await client.post(
            f"/api/v1/devices/{self.settings.device_id}/events/batch",
            json={"events": events},
        )
        response.raise_for_status()
        self.store.mark_events_synced([event["id"] for event in events])

    async def _poll_commands(self, client: httpx.AsyncClient) -> None:
        response = await client.get(f"/api/v1/devices/{self.settings.device_id}/commands/next")
        if response.status_code == 204:
            return
        response.raise_for_status()
        payload = response.json()
        command_id = str(payload["id"])
        command = str(payload["command"])
        parameters = dict(payload.get("parameters") or {})
        try:
            result = await self.command_handler(command, parameters)
            status_payload = {"status": "completed", "result": result}
        except Exception as exc:
            status_payload = {"status": "failed", "error": str(exc)}
        result_response = await client.post(
            f"/api/v1/devices/{self.settings.device_id}/commands/{command_id}/result",
            json=status_payload,
        )
        result_response.raise_for_status()
