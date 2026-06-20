"""Command polling service for fetching commands from backend"""

import asyncio
from typing import Optional

from agent.core.config import Config
from agent.core.logging import get_logger
from agent.sync.backend_client import BackendClient
from agent.commands.command_executor import CommandExecutor


logger = get_logger(__name__)


class CommandPoller:
    """Polls backend for pending commands and executes them"""

    def __init__(
        self,
        backend_client: BackendClient,
        command_executor: CommandExecutor
    ):
        self.backend = backend_client
        self.executor = command_executor
        self.is_running = False
        self.poll_task: Optional[asyncio.Task] = None

    async def start(self):
        """Start command polling"""
        if self.is_running:
            logger.warning("Command poller already running")
            return

        self.is_running = True
        self.poll_task = asyncio.create_task(self._poll_loop())
        logger.info("Command poller started")

    async def stop(self):
        """Stop command polling"""
        self.is_running = False

        if self.poll_task:
            self.poll_task.cancel()
            try:
                await self.poll_task
            except asyncio.CancelledError:
                pass

        logger.info("Command poller stopped")

    async def _poll_loop(self):
        """Main polling loop"""
        while self.is_running:
            try:
                # Get pending commands
                commands = await self.backend.get_pending_commands()

                if commands:
                    logger.info(f"Processing {len(commands)} commands...")

                    for command in commands:
                        try:
                            # Execute command
                            result = await self.executor.execute_command(command)

                            # Update backend with result
                            command_id = command.get("id")
                            if command_id:
                                await self.backend.update_command_status(
                                    command_id=command_id,
                                    status="completed" if result.get("success") else "failed",
                                    result=result.get("result"),
                                    error=result.get("error")
                                )

                        except Exception as e:
                            logger.error(f"Failed to execute command: {e}")

                # Wait before next poll
                await asyncio.sleep(Config.COMMAND_POLL_INTERVAL)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in command poll loop: {e}", exc_info=True)
                await asyncio.sleep(Config.COMMAND_POLL_INTERVAL)
