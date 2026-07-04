from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_endpoint_contract():
    response = client.get("/api/v1/system/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "service" in body
    assert "version" in body
    assert "environment" in body
    assert "time" in body


def test_auth_me_rejects_missing_credentials():
    response = client.get("/api/v1/auth/me")

    assert response.status_code in {401, 403}
