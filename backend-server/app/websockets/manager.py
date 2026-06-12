"""WebSocket manager for device and admin connections."""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Dict, Set
from uuid import UUID

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        self.device_connections: Dict[UUID, WebSocket] = {}
        self.admin_connections: Set[WebSocket] = set()

    async def connect_device(self, device_id: UUID, websocket: WebSocket) -> None:
        """Connect a device."""
        await websocket.accept()
        self.device_connections[device_id] = websocket
        logger.info(f"Device {device_id} connected via WebSocket")

    def disconnect_device(self, device_id: UUID) -> None:
        """Disconnect a device."""
        if device_id in self.device_connections:
            del self.device_connections[device_id]
            logger.info(f"Device {device_id} disconnected")

    async def connect_admin(self, websocket: WebSocket) -> None:
        """Connect an admin client."""
        await websocket.accept()
        self.admin_connections.add(websocket)
        logger.info("Admin client connected via WebSocket")

    def disconnect_admin(self, websocket: WebSocket) -> None:
        """Disconnect an admin client."""
        self.admin_connections.discard(websocket)
        logger.info("Admin client disconnected")

    async def send_to_device(self, device_id: UUID, message: dict) -> bool:
        """Send message to specific device."""
        if device_id not in self.device_connections:
            return False

        try:
            await self.device_connections[device_id].send_json(message)
            return True
        except Exception as e:
            logger.error(f"Error sending to device {device_id}: {e}")
            self.disconnect_device(device_id)
            return False

    async def broadcast_to_admins(self, message: dict) -> None:
        """Broadcast message to all admin clients."""
        disconnected = []
        for websocket in self.admin_connections:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to admin: {e}")
                disconnected.append(websocket)

        for ws in disconnected:
            self.disconnect_admin(ws)


# Global connection manager
manager = ConnectionManager()
