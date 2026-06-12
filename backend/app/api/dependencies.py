from __future__ import annotations

import secrets

from fastapi import Header, HTTPException, Request, status

from app.state import AgentState


def get_state(request: Request) -> AgentState:
    return request.app.state.agent


def require_api_key(request: Request, x_agent_key: str | None = Header(default=None)) -> None:
    expected = request.app.state.agent.settings.api_key
    if not x_agent_key or not secrets.compare_digest(x_agent_key, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid X-Agent-Key")
