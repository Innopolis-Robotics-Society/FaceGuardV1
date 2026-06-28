import time

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas import PersonCreate, PersonUpdate


client = TestClient(app)


def _json_keys(value):
    if isinstance(value, dict):
        keys = set(value)
        for child in value.values():
            keys.update(_json_keys(child))
        return keys
    if isinstance(value, list):
        keys = set()
        for child in value:
            keys.update(_json_keys(child))
        return keys
    return set()


@pytest.mark.qrt
def test_qrt_perf_001_health_endpoint_p95():
    durations_ms = []

    for _ in range(20):
        start = time.perf_counter()
        response = client.get("/api/v1/system/health")
        durations_ms.append((time.perf_counter() - start) * 1000)

        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    sorted_durations = sorted(durations_ms)
    p95_index = int(0.95 * len(sorted_durations)) - 1
    p95_ms = sorted_durations[p95_index]

    assert p95_ms < 1000


@pytest.mark.qrt
def test_qrt_sec_001_invalid_identity_is_rejected():
    responses = [
        client.get("/api/v1/auth/me"),
        client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer definitely-not-a-valid-token"},
        ),
    ]

    for response in responses:
        assert response.status_code in {401, 403}
        exposed_keys = _json_keys(response.json())
        assert "username" not in exposed_keys
        assert "role" not in exposed_keys
        assert "id" not in exposed_keys


@pytest.mark.qrt
@pytest.mark.parametrize("schema", [PersonCreate, PersonUpdate])
@pytest.mark.parametrize("invalid_name", ["", "x" * 256])
def test_qrt_use_001_invalid_person_names_are_rejected(schema, invalid_name):
    with pytest.raises(ValidationError):
        schema(name=invalid_name)


@pytest.mark.qrt
@pytest.mark.parametrize("schema", [PersonCreate, PersonUpdate])
@pytest.mark.parametrize("valid_name", ["A", "x" * 255])
def test_qrt_use_001_valid_person_name_boundaries_are_accepted(schema, valid_name):
    person = schema(name=valid_name)

    assert person.name == valid_name
