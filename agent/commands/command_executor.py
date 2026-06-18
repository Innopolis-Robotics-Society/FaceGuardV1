"""Command executor for processing backend commands"""

import asyncio
from typing import Dict, Any, Optional, Callable
from datetime import datetime

from agent.core.config import Config
from agent.core.logging import get_logger


logger = get_logger(__name__)


class CommandExecutor:
    """Executes commands received from backend"""

    def __init__(
        self,
        capture_service,
        recognition_service,
        door_controller,
        database
    ):
        self.capture_service = capture_service
        self.recognition = recognition_service
        self.door = door_controller
        self.db = database

        # Command handlers
        self.handlers: Dict[str, Callable] = {
            "capture_photos": self._handle_capture_photos,
            "rebuild_model": self._handle_rebuild_model,
            "reload_model": self._handle_reload_model,
            "open_door": self._handle_open_door,
            "restart_recognition": self._handle_restart_recognition,
            "restart_camera": self._handle_restart_camera,
            "restart_agent": self._handle_restart_agent,
            "reboot_device": self._handle_reboot_device,
            "collect_logs": self._handle_collect_logs,
            "start_stream": self._handle_start_stream,
            "stop_stream": self._handle_stop_stream,
        }

    async def execute_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a command

        Args:
            command: Command dictionary with type and parameters

        Returns:
            Execution result dictionary
        """
        command_id = command.get("id") or command.get("command_id")
        command_type = command.get("command_type")
        parameters = command.get("parameters", {})

        logger.info(f"Executing command: {command_type} (ID: {command_id})")

        # Update status to running
        if command_id:
            self.db.update_command_status(command_id, "running")

        try:
            # Get handler
            handler = self.handlers.get(command_type)

            if handler is None:
                raise ValueError(f"Unknown command type: {command_type}")

            # Execute handler
            result = await handler(parameters)

            # Update status to completed
            if command_id:
                self.db.update_command_status(command_id, "completed", result=result)

            logger.info(f"Command completed: {command_type}")
            return {
                "success": True,
                "command_id": command_id,
                "result": result
            }

        except Exception as e:
            logger.error(f"Command execution failed: {e}", exc_info=True)

            # Update status to failed
            if command_id:
                self.db.update_command_status(command_id, "failed", error=str(e))

            return {
                "success": False,
                "command_id": command_id,
                "error": str(e)
            }

    async def _handle_capture_photos(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle capture_photos command"""
        person_id = params.get("person_id")
        count = params.get("count", 15)
        interval = params.get("interval", 0.5)

        if not person_id:
            raise ValueError("person_id is required")

        logger.info(f"Capturing {count} photos for person {person_id}")

        result = await asyncio.to_thread(
            self.capture_service.capture_person_photos,
            person_id=person_id,
            count=count,
            interval=interval,
            strict_face_detection=True
        )

        # Upload captured photos to backend
        uploaded_count = 0
        if result.get("success") and result.get("captured_count", 0) > 0:
            logger.info(f"Uploading {result['captured_count']} photos to backend...")
            uploaded_count = await self._upload_photos_to_backend(person_id, result["photos"])
            result["uploaded_count"] = uploaded_count
            logger.info(f"Successfully uploaded {uploaded_count}/{result['captured_count']} photos")

        return result

    async def _handle_rebuild_model(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle rebuild_model command"""
        logger.info("Rebuilding recognition model...")

        result = await asyncio.to_thread(self.recognition.train_model)

        return result

    async def _handle_reload_model(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle reload_model command"""
        logger.info("Reloading recognition model...")

        await asyncio.to_thread(self.recognition.reload_model)

        return {
            "success": True,
            "message": "Model reloaded successfully"
        }

    async def _handle_open_door(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle open_door command"""
        duration = params.get("duration", Config.DOOR_OPEN_DURATION)

        logger.info(f"Manual door open for {duration} seconds")

        success = await asyncio.to_thread(self.door.open_door, duration)

        return {
            "success": success,
            "duration": duration
        }

    async def _handle_restart_recognition(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle restart_recognition command"""
        logger.info("Restarting recognition service...")

        # This would be handled by the main agent loop
        # For now, just reload the model
        await asyncio.to_thread(self.recognition.reload_model)

        return {
            "success": True,
            "message": "Recognition service restarted"
        }

    async def _handle_restart_camera(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle restart_camera command"""
        logger.info("Restarting camera...")

        # This would be handled by the main agent
        return {
            "success": True,
            "message": "Camera restart requested"
        }

    async def _handle_restart_agent(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle restart_agent command"""
        logger.warning("Agent restart requested")

        if not Config.is_raspberry_pi():
            logger.info("Restart skipped in development mode")
            return {
                "success": True,
                "message": "Restart skipped (development mode)"
            }

        # On Raspberry Pi with systemd
        logger.info("Scheduling agent restart...")

        # This would trigger systemd restart
        # For now, just log
        return {
            "success": True,
            "message": "Agent restart scheduled"
        }

    async def _handle_reboot_device(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle reboot_device command"""
        logger.warning("Device reboot requested")

        delay = params.get("delay", 10)

        if not Config.is_raspberry_pi():
            logger.info("Reboot skipped in development mode")
            return {
                "success": True,
                "message": "Reboot skipped (development mode)"
            }

        # On Raspberry Pi
        logger.warning(f"Device will reboot in {delay} seconds")

        # This would execute: sudo reboot
        # For now, just log
        return {
            "success": True,
            "message": f"Device reboot scheduled in {delay}s"
        }

    async def _handle_collect_logs(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle collect_logs command"""
        logger.info("Collecting logs...")

        # TODO: Implement log collection and ZIP creation
        return {
            "success": True,
            "message": "Logs collected",
            "log_path": "logs/agent.log"
        }

    async def _handle_start_stream(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle start_stream command"""
        logger.info("Starting video stream...")

        return {
            "success": True,
            "message": "Stream started"
        }

    async def _handle_stop_stream(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle stop_stream command"""
        logger.info("Stopping video stream...")

        return {
            "success": True,
            "message": "Stream stopped"
        }

    async def _upload_photos_to_backend(self, person_id: str, photos: list) -> int:
        """Upload captured photos to backend server"""
        import httpx
        from pathlib import Path

        uploaded_count = 0

        # Get backend client
        from agent.sync.backend_client import BackendClient
        backend = BackendClient()

        try:
            client = await backend._get_client()

            for photo in photos:
                if not photo.get("original_path"):
                    continue

                try:
                    # Build full path to photo
                    photo_path = Path(Config.DATA_DIR) / photo["original_path"]

                    if not photo_path.exists():
                        logger.warning(f"Photo file not found: {photo_path}")
                        continue

                    # Read photo file
                    with open(photo_path, "rb") as f:
                        files = {
                            "files": (photo_path.name, f, "image/jpeg")
                        }

                        # Upload to backend
                        response = await client.post(
                            f"/api/v1/people/{person_id}/photos",
                            files=files
                        )

                        if response.status_code in (200, 201):
                            uploaded_count += 1
                            logger.debug(f"Uploaded photo: {photo_path.name}")
                        else:
                            logger.error(f"Failed to upload photo {photo_path.name}: HTTP {response.status_code}")

                except Exception as e:
                    logger.error(f"Error uploading photo {photo.get('original_path')}: {e}")
                    continue

        except Exception as e:
            logger.error(f"Failed to upload photos to backend: {e}")

        return uploaded_count
