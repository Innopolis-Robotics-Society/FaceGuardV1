from datetime import datetime, timezone

import psycopg
from fastapi import APIRouter, HTTPException, status

from app.core.config import settings


router = APIRouter(
    prefix="/system",
    tags=["System"],
)


@router.get("/health")
def health_check() -> dict:
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "time": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/readiness")
def readiness_check() -> dict:
    try:
        with psycopg.connect(
            settings.database_url,
            connect_timeout=3,
        ) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()

        if result != (1,):
            raise RuntimeError("Unexpected database response")

        return {
            "status": "ready",
            "database": "connected",
        }

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "not_ready",
                "database": "disconnected",
                "error": str(error),
            },
        ) from error