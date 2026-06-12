from __future__ import annotations

import time


def auth_headers() -> dict[str, str]:
    return {"X-Agent-Key": "test-key"}


def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["device_id"]


def test_protected_endpoint_requires_key(client):
    response = client.get("/api/v1/telemetry")
    assert response.status_code == 401


def test_telemetry_and_mock_door(client):
    for _ in range(20):
        health = client.get("/api/v1/health").json()
        if health["camera_ready"]:
            break
        time.sleep(0.05)

    telemetry = client.get("/api/v1/telemetry", headers=auth_headers())
    assert telemetry.status_code == 200
    assert "cpu_percent" in telemetry.json()

    door = client.post(
        "/api/v1/door/open",
        headers=auth_headers(),
        json={"duration_seconds": 0.1, "reason": "pytest"},
    )
    assert door.status_code == 200
    assert door.json()["mode"] == "mock"

    events = client.get("/api/v1/events", headers=auth_headers())
    assert events.status_code == 200
    assert any(event["event_type"] == "manual_door_open" for event in events.json())


def test_simulated_capture_pipeline(client):
    for _ in range(20):
        snapshot = client.get("/api/v1/camera/snapshot", headers=auth_headers())
        if snapshot.status_code == 200:
            break
        time.sleep(0.05)
    assert snapshot.status_code == 200
    assert snapshot.headers["content-type"] == "image/jpeg"

    response = client.post(
        "/api/v1/people/test-user/capture",
        headers=auth_headers(),
        json={
            "display_name": "Test User",
            "count": 2,
            "interval_seconds": 0.05,
            "strict_face_detection": False,
        },
    )
    assert response.status_code == 200
    assert response.json()["saved_count"] == 2

    train = client.post("/api/v1/recognition/train", headers=auth_headers())
    if train.status_code == 422:
        assert "opencv-contrib-python-headless" in train.json()["detail"]
    else:
        assert train.status_code == 200
        assert train.json()["people_count"] == 1
