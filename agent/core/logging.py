"""Logging configuration for FaceGuard Agent"""

import logging
import sys
from pathlib import Path
from typing import Optional

from core.config import Config


class Logger:
    """Centralized logging management"""

    _instance: Optional[logging.Logger] = None

    @classmethod
    def get_logger(cls, name: str = "faceguard_agent") -> logging.Logger:
        """Get or create logger instance"""
        if cls._instance is None:
            cls._instance = cls._setup_logger(name)
        return cls._instance

    @classmethod
    def _setup_logger(cls, name: str) -> logging.Logger:
        """Setup logger with console and file handlers"""
        logger = logging.getLogger(name)
        logger.setLevel(getattr(logging, Config.LOG_LEVEL.upper(), logging.INFO))

        # Clear existing handlers
        logger.handlers.clear()

        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.DEBUG)
        console_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

        # File handler
        log_file = Config.LOGS_DIR / "agent.log"
        try:
            file_handler = logging.FileHandler(log_file, encoding="utf-8")
            file_handler.setLevel(logging.DEBUG)
            file_formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S"
            )
            file_handler.setFormatter(file_formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            logger.warning(f"Could not create file handler: {e}")

        return logger


def get_logger(name: str = "faceguard_agent") -> logging.Logger:
    """Convenience function to get logger"""
    return Logger.get_logger(name)
