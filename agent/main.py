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

from core.config import Config
from core.logging import get_logger
from core.database import Database
from camera.camera_service import CameraService
from camera.capture_service import CaptureService
from recognition.recognizer import RecognitionService
from recognition.recognition_loop import RecognitionLoop
from door.door_controller import DoorController
from door.led_indicator import LEDIndicator
from telemetry.telemetry_service import TelemetryService
from sync.backend_client import BackendClient
from sync.sync_manager import SyncManager
from commands.command_executor import CommandExecutor
from commands.command_poller import CommandPoller
from events.event_handler import EventHandler
from api.stream_server import StreamServer


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
        self.door = DoorController() if Config.use_servo() else None
        self.led = LEDIndicator() if Config.use_led() else None

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
        self.event_handler = EventHandler(self.door, self.sync_manager, self.led)

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
        self.stream_server_task = None

        # Stream server
        self.stream_server = StreamServer(self.camera)

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
        logger.info(f"Door control mode: {Config.DOOR_CONTROL_MODE}")
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
        self.stream_server_task = asyncio.create_task(self._run_stream_server())

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

        # Stop recognition loop first (blocking operation)
        logger.info("Stopping recognition loop...")
        self.recognition_loop.stop()

        # Give recognition thread time to stop
        await asyncio.sleep(0.5)

        # Stop command poller
        logger.info("Stopping command poller...")
        await self.command_poller.stop()

        # Stop sync manager
        logger.info("Stopping sync manager...")
        await self.sync_manager.stop()

        # Cancel background tasks with timeout
        logger.info("Cancelling background tasks...")
        tasks_to_cancel = []
        if self.heartbeat_task and not self.heartbeat_task.done():
            self.heartbeat_task.cancel()
            tasks_to_cancel.append(self.heartbeat_task)
        if self.telemetry_task and not self.telemetry_task.done():
            self.telemetry_task.cancel()
            tasks_to_cancel.append(self.telemetry_task)
        if self.stream_server_task and not self.stream_server_task.done():
            self.stream_server_task.cancel()
            tasks_to_cancel.append(self.stream_server_task)

        # Wait for tasks to complete with timeout
        if tasks_to_cancel:
            try:
                await asyncio.wait_for(
                    asyncio.gather(*tasks_to_cancel, return_exceptions=True),
                    timeout=2.0
                )
            except asyncio.TimeoutError:
                logger.warning("Some background tasks did not stop in time")

        # Stop camera
        logger.info("Stopping camera...")
        self.camera.stop()
        await asyncio.sleep(0.3)

        # Close backend client
        logger.info("Closing backend connection...")
        try:
            await asyncio.wait_for(self.backend.close(), timeout=2.0)
        except asyncio.TimeoutError:
            logger.warning("Backend client close timed out")

        # Release hardware
        logger.info("Releasing hardware...")
        if self.door:
            self.door.release()
        if self.led:
            self.led.release()
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

    async def _run_stream_server(self):
        """Run HTTP stream server"""
        try:
            import uvicorn
            app = self.stream_server.create_app()

            stream_port = getattr(Config, 'STREAM_PORT', 8001)

            config = uvicorn.Config(
                app,
                host="0.0.0.0",
                port=stream_port,
                log_level="info"
            )
            server = uvicorn.Server(config)

            logger.info(f"Stream server starting on port {stream_port}")
            await server.serve()

        except ImportError:
            logger.error("uvicorn not installed - stream server disabled")
        except asyncio.CancelledError:
            logger.info("Stream server stopped")
        except Exception as e:
            logger.error(f"Error in stream server: {e}")

    def _print_status(self):
        """Print agent status"""
        logger.info("")
        logger.info("Status:")
        logger.info(f"  Camera: {'[OK] Available' if self.camera.is_available() else '[!] Not available'}")
        logger.info(f"  Recognition: {'[OK] Trained' if self.recognition.is_trained else '[!] Not trained'}")

        if self.door:
            logger.info(f"  Door controller: {'[OK] Ready' if self.door.get_status()['available'] else '[!] Not available'}")
        else:
            logger.info(f"  Door controller: [DISABLED]")

        if self.led:
            logger.info(f"  LED indicator: {'[OK] Ready' if self.led.get_status()['available'] else '[!] Not available'}")
        else:
            logger.info(f"  LED indicator: [DISABLED]")

        sync_status = self.sync_manager.get_sync_status()
        logger.info(f"  Backend: {'[OK] Online' if sync_status['is_online'] else '[!] Offline'}")

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

    # Download required models if not present
    try:
        from scripts.download_models import download_models
        print("Checking required models...")
        download_models(force=False, skip_optional=False)
        print()
    except Exception as e:
        logger.warning(f"Failed to download models: {e}")
        logger.info("Continuing without optional models...")
        print()

    # Create agent
    agent = FaceGuardAgent()

    # Setup signal handlers
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    def signal_handler(signum, frame):
        logger.info(f"Received signal {signum}, initiating shutdown...")
        agent.shutdown()

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Run agent
    try:
        loop.run_until_complete(agent.start())
    except KeyboardInterrupt:
        logger.info("Keyboard interrupt received")
        agent.shutdown()
    finally:
        try:
            logger.info("Running cleanup...")
            loop.run_until_complete(agent.stop())
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
        finally:
            # Force close any remaining tasks
            pending = asyncio.all_tasks(loop)
            for task in pending:
                task.cancel()

            # Wait briefly for cancellation
            if pending:
                loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))

            loop.close()
            logger.info("Agent shutdown complete")

            # Force exit if still hanging
            import sys
            sys.exit(0)


if __name__ == "__main__":
    main()
