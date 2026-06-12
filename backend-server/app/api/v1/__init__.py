"""API v1 router."""
from fastapi import APIRouter

from app.api.v1 import auth, users, people, devices, events, system

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(people.router)
api_router.include_router(devices.router)
api_router.include_router(events.router)
api_router.include_router(system.router)
