from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ENVIRONMENT", "test")
    monkeypatch.setenv("API_KEY", "test-key")
    monkeypatch.setenv("HARDWARE_MODE", "mock")
    monkeypatch.setenv("CAMERA_INDEX", "999")
    monkeypatch.setenv("CAMERA_ALLOW_SIMULATION", "true")
    monkeypatch.setenv("RECOGNITION_ENABLED", "false")
    monkeypatch.setenv("DATA_DIR", str(tmp_path / "data"))
    monkeypatch.setenv("FACES_DIR", str(tmp_path / "data" / "faces"))
    monkeypatch.setenv("MODELS_DIR", str(tmp_path / "data" / "models"))
    monkeypatch.setenv("CAPTURES_DIR", str(tmp_path / "data" / "captures"))
    monkeypatch.setenv("EVENTS_DIR", str(tmp_path / "data" / "events"))
    monkeypatch.setenv("LOGS_DIR", str(tmp_path / "data" / "logs"))
    monkeypatch.setenv("BACKUPS_DIR", str(tmp_path / "data" / "backups"))
    monkeypatch.setenv("SQLITE_PATH", str(tmp_path / "data" / "agent.db"))

    from app.config import Settings
    from app.logging_setup import configure_logging
    from app.main import app
    from app.state import AgentState

    test_settings = Settings()
    test_settings.ensure_directories()
    app.state.agent = AgentState(test_settings)

    # app lifespan uses the module-level state, so replace it for this test session.
    import app.main as main_module
    main_module.agent_state = app.state.agent

    with TestClient(app) as test_client:
        yield test_client
