from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import audit, auth, commands, devices, events, people, photos, sync, system, telemetry
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="FaceGuard Backend API - система умного домофона",
)

# CORS middleware для frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(system.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(people.router, prefix="/api/v1")
app.include_router(photos.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")
app.include_router(telemetry.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(commands.router, prefix="/api/v1")
app.include_router(sync.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "message": "FaceGuard API",
        "version": settings.app_version,
        "docs": "/docs",
    }
