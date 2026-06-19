"""
FaceGuard Raspberry Pi Agent

Main entry point for the agent service.
"""

import asyncio
import signal
import sys
from pathlib import Path
from typing import Optional

# Add agent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from agent.core.config import Config
from agent.core.logging import get_logger
from agent.core.database import Database
from agent.camera.camera_service import CameraService
from agent.camera.capture_service import CaptureService
from agent.recognition.recognizer import RecognitionService
from agent.recognition.recognition_loop import RecognitionLoop
from agent.door.door_controller import DoorController
from agent.telemetry.telemetry_service import TelemetryService
from agent.sync.backend_client import BackendClient
from agent.sync.sync_manager import SyncManager
from agent.commands.command_executor import CommandExecutor
from agent.commands.command_poller import CommandPoller
from agent.events.event_handler import EventHandler


logger = get_logger(__name__)


class FaceGuardAgent:
    """Main agent orchestrator"""

    def __init__(self):
        self.shutdown_event = asyncio.Event()

        # Initialize components
        logger.info("Initializing FaceGuard Agent...")

        # Core services
        self.database = Database()
        self.backend = BackendClient()

        # Hardware services
        self.camera = CameraService()
        self.door = DoorController()

        # Recognition services
        self.recognition = RecognitionService()
        self.capture_service = CaptureService(self.camera)

        # Telemetry
        self.telemetry = TelemetryService()

        # Sync and commands
        self.sync_manager = SyncManager(self.backend, self.database)
        self.command_executor = CommandExecutor(
            self.capture_service,
            self.recognition,
            self.door,
            self.database
        )
        self.command_poller = CommandPoller(self.backend, self.command_executor)

        # Event handling
        self.event_handler = EventHandler(self.door, self.sync_manager)

        # Recognition loop
        self.recognition_loop = RecognitionLoop(
            self.camera,
            self.recognition,
            on_recognized=self._on_recognized_wrapper,
            on_unknown=self._on_unknown_wrapper
        )

        # Background tasks
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.heartbeat_task = None
        self.telemetry_task = None

        logger.info("Agent initialized successfully")

    def _on_recognized_wrapper(self, person_id: str, confidence: float, snapshot_path: str):
        """Schedule recognized-person handling from the recognition thread."""
        self._schedule_event_handler(
            self.event_handler.on_person_recognized(person_id, confidence, snapshot_path)
        )

    def _on_unknown_wrapper(self, confidence: float, snapshot_path: str):
        """Schedule unknown-person handling from the recognition thread."""
        self._schedule_event_handler(
            self.event_handler.on_unknown_person(confidence, snapshot_path)
        )

    def _schedule_event_handler(self, coroutine):
        """Run an event handler coroutine on the main asyncio loop."""
        if self.loop is None or self.loop.is_closed():
            logger.error("Cannot schedule event handler: asyncio loop is not running")
            coroutine.close()
            return

        future = asyncio.run_coroutine_threadsafe(coroutine, self.loop)

        def log_callback_error(done_future):
            try:
                done_future.result()
            except Exception as e:
                logger.error(f"Error in event handler callback: {e}", exc_info=True)

        future.add_done_callback(log_callback_error)

    async def start(self):
        """Start all agent services"""
        self.loop = asyncio.get_running_loop()

        logger.info("Starting FaceGuard Agent...")
        logger.info(f"Hardware mode: {Config.HARDWARE_MODE}")
        logger.info(f"Backend URL: {Config.BACKEND_URL}")
        logger.info(f"Device code: {Config.DEVICE_CODE}")

        # Validate configuration
        try:
            Config.validate()
        except ValueError as e:
            logger.error(f"Configuration validation failed: {e}")
            return

        # Start camera
        self.camera.start()
        logger.info("Camera started")

        # Start sync manager
        await self.sync_manager.start()
        logger.info("Sync manager started")

        # Start command poller
        await self.command_poller.start()
        logger.info("Command poller started")

        # Start recognition loop if model is trained
        if self.recognition.is_trained:
            self.recognition_loop.start()
            logger.info("Recognition loop started")
        else:
            logger.warning("Recognition model not trained - recognition loop not started")
            logger.info("Train model with: POST /api/v1/commands (type: rebuild_model)")

        # Start background tasks
        self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
        self.telemetry_task = asyncio.create_task(self._telemetry_loop())

        logger.info("=" * 60)
        logger.info("FaceGuard Agent is running")
        logger.info("=" * 60)

        # Print status
        self._print_status()

        # Wait for shutdown signal
        await self.shutdown_event.wait()

    async def stop(self):
        """Stop all agent services"""
        logger.info("Stopping FaceGuard Agent...")

        # Stop recognition loop
        self.recognition_loop.stop()

        # Stop command poller
        await self.command_poller.stop()

        # Stop sync manager
        await self.sync_manager.stop()

        # Stop background tasks
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
        if self.telemetry_task:
            self.telemetry_task.cancel()

        # Stop camera
        self.camera.stop()

        # Close backend client
        await self.backend.close()

        # Release hardware
        self.door.release()
        self.camera.release()

        logger.info("Agent stopped successfully")

    async def _heartbeat_loop(self):
        """Send heartbeat to backend"""
        while True:
            try:
                telemetry = self.telemetry.collect_telemetry(
                    camera_fps=self.camera.get_fps(),
                    recognition_running=self.recognition_loop.is_active()
                )

                await self.backend.send_heartbeat(telemetry)

                await asyncio.sleep(Config.HEARTBEAT_INTERVAL)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in heartbeat loop: {e}")
                await asyncio.sleep(Config.HEARTBEAT_INTERVAL)

    async def _telemetry_loop(self):
        """Collect and send telemetry"""
        while True:
            try:
                telemetry = self.telemetry.collect_telemetry(
                    camera_fps=self.camera.get_fps(),
                    recognition_running=self.recognition_loop.is_active()
                )

                await self.sync_manager.add_telemetry(telemetry)

                await asyncio.sleep(Config.TELEMETRY_INTERVAL)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in telemetry loop: {e}")
                await asyncio.sleep(Config.TELEMETRY_INTERVAL)

    def _print_status(self):
        """Print agent status"""
        logger.info("")
        logger.info("Status:")
        logger.info(f"  Camera: {'✓ Available' if self.camera.is_available() else '✗ Not available'}")
        logger.info(f"  Recognition: {'✓ Trained' if self.recognition.is_trained else '✗ Not trained'}")
        logger.info(f"  Door controller: {'✓ Ready' if self.door.get_status()['available'] else '✗ Not available'}")

        sync_status = self.sync_manager.get_sync_status()
        logger.info(f"  Backend: {'✓ Online' if sync_status['is_online'] else '✗ Offline'}")

        if sync_status['needs_sync']:
            logger.info(f"  Unsynced: {sync_status['unsynced_events']} events, {sync_status['unsynced_telemetry']} telemetry")

        telemetry_summary = self.telemetry.get_summary()
        logger.info("")
        logger.info("System:")
        logger.info(f"  CPU: {telemetry_summary['cpu']}")
        logger.info(f"  Temperature: {telemetry_summary['temperature']}")
        logger.info(f"  RAM: {telemetry_summary['ram']}")
        logger.info(f"  Disk: {telemetry_summary['disk']}")
        logger.info(f"  Uptime: {telemetry_summary['uptime']}")
        logger.info("")

    def shutdown(self):
        """Trigger graceful shutdown"""
        logger.info("Shutdown signal received")
        self.shutdown_event.set()


def main():
    """Main entry point"""
    # Print banner
    print("=" * 60)
    print("FaceGuard Raspberry Pi Agent")
    print("Version 1.0.0")
    print("=" * 60)
    print()

    # Create agent
    agent = FaceGuardAgent()

    # Setup signal handlers
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    def signal_handler(signum, frame):
        logger.info(f"Received signal {signum}")
        agent.shutdown()

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Run agent
    try:
        loop.run_until_complete(agent.start())
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
    finally:
        loop.run_until_complete(agent.stop())
        loop.close()
        logger.info("Agent shutdown complete")


if __name__ == "__main__":
    main()
