"""WebSocket endpoint for real-time events"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from typing import Optional, Set
import json
import asyncio
from datetime import datetime

from app.core.security import decode_access_token

router = APIRouter()


class ConnectionManager:
    """Manage WebSocket connections"""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        """Accept and register a new connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        print(f"[WebSocket] Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a connection"""
        self.active_connections.discard(websocket)
        print(f"[WebSocket] Client disconnected. Total: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific client"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"[WebSocket] Error sending message: {e}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"[WebSocket] Error broadcasting to client: {e}")
                disconnected.add(connection)

        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)


manager = ConnectionManager()


async def verify_websocket_token(token: Optional[str]) -> bool:
    """Verify JWT token for WebSocket connection"""
    if not token:
        return False

    try:
        # Verify token (reuse existing auth logic)
        payload = decode_access_token(token)
        return payload is not None
    except Exception as e:
        print(f"[WebSocket] Token verification failed: {e}")
        return False


@router.websocket("/ws/events")
async def websocket_events(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time event streaming

    Client receives:
    - recognition_event: When person is recognized/unknown
    - door_event: When door is opened
    - command_status: When command execution status changes
    - telemetry_update: System telemetry updates
    """

    # Verify authentication
    # TODO: Move token auth to header when frontend supports it
    is_authenticated = await verify_websocket_token(token)

    if not is_authenticated:
        await websocket.close(code=1008, reason="Unauthorized")
        return

    # Accept connection
    await manager.connect(websocket)

    try:
        # Send welcome message
        await manager.send_personal_message({
            "type": "connected",
            "message": "Connected to FaceGuard events",
            "timestamp": datetime.utcnow().isoformat()
        }, websocket)

        # Keep connection alive and listen for client messages
        while True:
            try:
                # Receive messages from client (for ping/pong or commands)
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)

                # Handle client messages
                try:
                    message = json.loads(data)
                    if message.get("type") == "ping":
                        await manager.send_personal_message({
                            "type": "pong",
                            "timestamp": datetime.utcnow().isoformat()
                        }, websocket)
                except json.JSONDecodeError:
                    pass

            except asyncio.TimeoutError:
                # Send keepalive ping
                try:
                    await manager.send_personal_message({
                        "type": "keepalive",
                        "timestamp": datetime.utcnow().isoformat()
                    }, websocket)
                except Exception:
                    break

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("[WebSocket] Client disconnected normally")
    except Exception as e:
        manager.disconnect(websocket)
        print(f"[WebSocket] Connection error: {e}")


async def broadcast_event(event_type: str, data: dict):
    """
    Broadcast event to all connected WebSocket clients

    Args:
        event_type: Type of event (recognition_event, door_event, etc.)
        data: Event data
    """
    message = {
        "type": event_type,
        **data,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.broadcast(message)


# Helper functions for broadcasting specific events

async def broadcast_recognition_event(
    event_type: str,
    person_id: Optional[str],
    person_name: Optional[str],
    confidence: Optional[float],
    door_opened: bool
):
    """Broadcast recognition event"""
    await broadcast_event("recognition_event", {
        "event_type": event_type,
        "person_id": person_id,
        "person_name": person_name,
        "confidence": confidence,
        "door_opened": door_opened
    })


async def broadcast_door_event(door_opened: bool, reason: str):
    """Broadcast door event"""
    await broadcast_event("door_event", {
        "door_opened": door_opened,
        "reason": reason
    })


async def broadcast_command_status(
    command_id: str,
    command_type: str,
    status: str,
    result: Optional[dict] = None,
    error: Optional[str] = None
):
    """Broadcast command status update"""
    await broadcast_event("command_status", {
        "command_id": command_id,
        "command_type": command_type,
        "status": status,
        "result": result,
        "error": error
    })
