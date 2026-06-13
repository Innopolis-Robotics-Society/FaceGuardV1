from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import events_websocket, router
from app.config import settings
from app.logging_setup import configure_logging
from app.state import AgentState

configure_logging(settings)
agent_state = AgentState(settings)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.agent = agent_state
    await agent_state.start()
    try:
        yield
    finally:
        await agent_state.stop()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Offline-first FaceGuard device agent for Raspberry Pi and Windows testing.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.environment == "development" else [],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket) -> None:
    await events_websocket(websocket)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/api/v1/health",
    }
