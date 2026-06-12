"""Mock Raspberry Pi Agent for testing."""
from __future__ import annotations

import asyncio
import json
import logging
import os
import random
import sys
from datetime import datetime, timezone
from typing import Any

import httpx
import websockets

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mock-agent")


class MockAgent:
    """Mock Raspberry Pi agent for testing."""

    def __init__(self):
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        self.device_code = os.getenv("DEVICE_CODE", "mock-device-001")
        self.device_token = os.getenv("DEVICE_TOKEN", "")
        self.device_id: str | None = None
        self.running = False
        self.ws = None

        if not self.device_token:
            logger.error("DEVICE_TOKEN not set. Please create a device first.")
            sys.exit(1)

    async def connect_websocket(self) -> None:
        """Connect to backend WebSocket."""
        ws_url = self.backend_url.replace("http://", "ws://").replace("https://", "wss://")
        ws_url = f"{ws_url}/ws/devices/{self.device_id}?token={self.device_token}"

        try:
            async with websockets.connect(ws_url) as websocket:
                self.ws = websocket
                logger.info("WebSocket connected")

                # Receive welcome message
                welcome = await websocket.recv()
                logger.info(f"Received: {welcome}")

                # Keep listening for commands
                async for message in websocket:
                    await self.handle_websocket_message(json.loads(message))

        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            await asyncio.sleep(5)

    async def handle_websocket_message(self, message: dict[str, Any]) -> None:
        """Handle incoming WebSocket messages."""
        msg_type = message.get("type")
        logger.info(f"Received message type: {msg_type}")

        if msg_type == "command":
            command = message.get("command")
            logger.info(f"Executing command: {command}")
            await self.execute_command(command)

    async def send_heartbeat(self) -> None:
        """Send heartbeat to backend."""
        url = f"{self.backend_url}/api/v1/devices/{self.device_id}/heartbeat"
        headers = {"X-Device-Token": self.device_token}

        telemetry = {
            "cpu_usage": random.uniform(10, 50),
            "cpu_temperature": random.uniform(40, 60),
            "ram_usage": random.uniform(30, 70),
            "disk_usage": random.uniform(20, 60),
            "uptime": random.randint(1000, 100000),
            "camera_fps": random.uniform(10, 30),
            "network_status": "connected",
        }

        payload = {
            "software_version": "1.0.0-mock",
            "camera_status": "ready",
            "recognition_status": "ready",
            "telemetry": telemetry,
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"Heartbeat sent successfully. Commands: {len(data.get('commands', []))}")

                    # Process commands
                    for command in data.get("commands", []):
                        await self.execute_command(command)
                else:
                    logger.error(f"Heartbeat failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Error sending heartbeat: {e}")

    async def execute_command(self, command: dict[str, Any]) -> None:
        """Execute a command."""
        command_id = command.get("id")
        command_type = command.get("command_type")
        parameters = command.get("parameters", {})

        logger.info(f"Executing command {command_id}: {command_type}")

        # Update command status to running
        await self.update_command_status(command_id, "running")

        # Simulate command execution
        await asyncio.sleep(2)

        # Simulate success or failure
        success = random.random() > 0.1  # 90% success rate

        if success:
            result = {
                "success": True,
                "message": f"Command {command_type} executed successfully",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            await self.update_command_status(command_id, "completed", result)
            logger.info(f"Command {command_id} completed successfully")
        else:
            await self.update_command_status(
                command_id,
                "failed",
                error_message="Simulated failure for testing",
            )
            logger.warning(f"Command {command_id} failed (simulated)")

    async def update_command_status(
        self,
        command_id: str,
        status: str,
        result: dict | None = None,
        error_message: str | None = None,
    ) -> None:
        """Update command status."""
        url = f"{self.backend_url}/api/v1/devices/{self.device_id}/commands/{command_id}/result"
        headers = {"X-Device-Token": self.device_token}

        payload = {
            "status": status,
            "result": result,
            "error_message": error_message,
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=10)
                if response.status_code == 200:
                    logger.info(f"Command {command_id} status updated to {status}")
                else:
                    logger.error(f"Failed to update command status: {response.status_code}")
        except Exception as e:
            logger.error(f"Error updating command status: {e}")

    async def send_recognition_event(self) -> None:
        """Simulate sending a recognition event."""
        url = f"{self.backend_url}/api/v1/events"
        headers = {"X-Device-Token": self.device_token}

        # Simulate recognized or unknown person
        is_recognized = random.random() > 0.3  # 70% recognized

        if is_recognized:
            event = {
                "person_id": None,  # Would be actual person UUID
                "event_type": "recognized",
                "confidence": random.uniform(0.7, 0.95),
                "door_opened": True,
            }
        else:
            event = {
                "person_id": None,
                "event_type": "unknown",
                "confidence": random.uniform(0.3, 0.6),
                "door_opened": False,
            }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=event, headers=headers, timeout=10)
                if response.status_code == 201:
                    logger.info(f"Recognition event sent: {event['event_type']}")
                else:
                    logger.error(f"Failed to send event: {response.status_code}")
        except Exception as e:
            logger.error(f"Error sending recognition event: {e}")

    async def heartbeat_loop(self) -> None:
        """Periodic heartbeat loop."""
        while self.running:
            await self.send_heartbeat()
            await asyncio.sleep(10)

    async def recognition_loop(self) -> None:
        """Periodic recognition event simulation."""
        while self.running:
            await asyncio.sleep(random.randint(30, 120))
            await self.send_recognition_event()

    async def run(self) -> None:
        """Run the mock agent."""
        logger.info("Starting mock agent...")
        logger.info(f"Backend URL: {self.backend_url}")
        logger.info(f"Device code: {self.device_code}")

        # Extract device ID from token
        parts = self.device_token.split(":")
        if len(parts) != 2 or parts[0] != self.device_code:
            logger.error("Invalid device token format")
            return

        # Get device ID by authenticating
        # For simplicity, we'll extract it from the first heartbeat response
        self.device_id = "00000000-0000-0000-0000-000000000000"  # Placeholder

        self.running = True

        # Start background tasks
        tasks = [
            asyncio.create_task(self.heartbeat_loop()),
            asyncio.create_task(self.recognition_loop()),
        ]

        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            logger.info("Shutting down mock agent...")
            self.running = False
            for task in tasks:
                task.cancel()


if __name__ == "__main__":
    agent = MockAgent()
    asyncio.run(agent.run())
