"""Logging configuration."""
from __future__ import annotations

import logging
import sys
from pathlib import Path

from app.core.config import settings


def setup_logging() -> None:
    """Configure application logging."""
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    # Create formatter
    if settings.log_format == "json":
        # In production, use structured JSON logging
        formatter = logging.Formatter(
            '{"time":"%(asctime)s","level":"%(levelname)s","name":"%(name)s","message":"%(message)s"}'
        )
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)

    # File handler
    if settings.logs_dir:
        settings.logs_dir.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(settings.logs_dir / "backend.log")
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)

        # Configure root logger
        logging.root.setLevel(log_level)
        logging.root.addHandler(console_handler)
        logging.root.addHandler(file_handler)
    else:
        logging.root.setLevel(log_level)
        logging.root.addHandler(console_handler)

    # Suppress noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
