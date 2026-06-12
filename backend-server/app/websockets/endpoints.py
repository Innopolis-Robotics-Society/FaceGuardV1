"""WebSocket endpoints."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token, verify_device_token
from app.models import Device, User
from app.websockets.manager import manager

router = APIRouter()


@router.websocket("/ws/devices/{device_id}")
async def device_websocket(device_id: UUID, websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    """WebSocket endpoint for device communication."""
    # Authenticate device
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Parse token
    parts = token.split(":", 1)
    if len(parts) != 2:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    device_code, device_token = parts

    # Verify device
    result = await db.execute(select(Device).where(Device.device_code == device_code))
    device = result.scalar_one_or_none()

    if device is None or device.id != device_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if not verify_device_token(device_token, device.device_token_hash):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Connect
    await manager.connect_device(device_id, websocket)

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "device_id": str(device_id),
            "message": "Connected to FaceGuard backend",
        })

        # Keep connection alive and receive messages
        while True:
            data = await websocket.receive_json()
            # Handle incoming messages from device
            # This can be extended to handle various device events

    except WebSocketDisconnect:
        manager.disconnect_device(device_id)
    except Exception as e:
        manager.disconnect_device(device_id)


@router.websocket("/ws/admin")
async def admin_websocket(websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    """WebSocket endpoint for admin real-time updates."""
    # Authenticate admin
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify JWT
    payload = decode_access_token(token)
    if payload is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    try:
        user_id = UUID(payload.get("sub"))
    except (ValueError, TypeError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify user exists and is active
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()

    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Connect
    await manager.connect_admin(websocket)

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "user": user.username,
            "message": "Connected to FaceGuard admin stream",
        })

        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Ping/pong to keep alive

    except WebSocketDisconnect:
        manager.disconnect_admin(websocket)
    except Exception:
        manager.disconnect_admin(websocket)
