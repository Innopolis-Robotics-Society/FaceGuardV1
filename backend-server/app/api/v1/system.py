"""System API endpoints."""
from __future__ import annotations

import shutil
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import CurrentUser, require_permission
from app.core.config import settings
from app.core.database import get_db
from app.core.permissions import Permission
from app.schemas.system import HealthResponse, SystemInfo, StorageInfo

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)) -> dict:
    """Health check endpoint."""
    db_status = "connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "version": settings.app_version,
        "database": db_status,
        "timestamp": datetime.now(timezone.utc),
    }


@router.get("/info", response_model=SystemInfo)
async def system_info(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission(Permission.VIEW_LOGS)),
) -> dict:
    """Get system information."""
    db_connected = True
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_connected = False

    # Get storage info
    stat = shutil.disk_usage(settings.data_dir)
    storage = StorageInfo(
        total_gb=stat.total / (1024**3),
        used_gb=stat.used / (1024**3),
        free_gb=stat.free / (1024**3),
        usage_percent=(stat.used / stat.total) * 100,
    )

    return {
        "version": settings.app_version,
        "environment": settings.environment,
        "database_connected": db_connected,
        "storage": storage,
    }


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)) -> dict:
    """Readiness check for Kubernetes/Docker."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception:
        return {"status": "not_ready"}
