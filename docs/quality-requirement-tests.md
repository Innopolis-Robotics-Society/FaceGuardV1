# Quality Requirement Tests

Automated Quality Requirement Tests (QRTs) verify the measurable requirements in
[quality-requirements.md](quality-requirements.md). They run locally and in
GitHub Actions without a physical camera, production credentials, biometric
data, or a real PostgreSQL instance.

## Table of Contents

- [Traceability Matrix](#traceability-matrix)
- [Local Command](#local-command)
- [QRT-PERF-001](#qrt-perf-001)
- [QRT-SEC-001](#qrt-sec-001)
- [QRT-USE-001](#qrt-use-001)
- [QRT-REL-001](#qrt-rel-001)

## Traceability Matrix

| QRT ID | QR ID | Test file | Test function | CI job | Pass condition |
| ------ | ----- | --------- | ------------- | ------ | -------------- |
| `QRT-PERF-001` | `QR-PERF-001` | `backend-service/tests/qrt/test_quality_requirements.py` | `test_qrt_perf_001_health_endpoint_p95` | `Quality requirement tests` | 20 health requests return HTTP 200 with `status: "ok"` and p95 is below 1000 ms. |
| `QRT-SEC-001` | `QR-SEC-001` | `backend-service/tests/qrt/test_quality_requirements.py` | `test_qrt_sec_001_invalid_identity_is_rejected` | `Quality requirement tests` | Missing and malformed credentials return HTTP 401 or 403 without identity fields. |
| `QRT-USE-001` | `QR-USE-001` | `backend-service/tests/qrt/test_quality_requirements.py` | `test_qrt_use_001_invalid_person_names_are_rejected`; `test_qrt_use_001_valid_person_name_boundaries_are_accepted` | `Quality requirement tests` | Invalid name boundaries raise `ValidationError`; valid boundary values create schema objects. |
| `QRT-REL-001` | `QR-REL-001` | `backend-service/tests/unit/test_recognition_score.py`; `frontend/faceguard-web/src/utils/recognitionScore.test.mjs` | `test_distance_below_threshold_is_match`; `test_distance_equal_threshold_uses_documented_boundary`; `test_distance_above_threshold_is_not_match`; `test_good_match_has_positive_display`; `test_bad_match_has_negative_display` | `Backend tests and critical coverage`; `Frontend recognition score tests` | LBPH distance below threshold is accepted, equality and above-threshold distances are rejected, and UI helper state shows lower-distance matches as stronger. |

## Local Command

```bash
cd backend-service
pytest tests/qrt -m qrt -v
```

## QRT-PERF-001

- Linked QR: `QR-PERF-001`
- Automation level: automated backend quality requirement test.
- Preconditions: backend Python dependencies are installed; the test runs
  through FastAPI TestClient in process.
- Exact test procedure:
  1. Create a FastAPI TestClient for `app.main.app`.
  2. Send 20 sequential requests to `GET /api/v1/system/health`.
  3. Measure every request with `time.perf_counter`.
  4. Assert every response returns HTTP 200.
  5. Assert every response contains JSON field `status: "ok"`.
  6. Sort the 20 durations and calculate p95.
  7. Assert p95 is below 1000 ms.
- Exact test file: `backend-service/tests/qrt/test_quality_requirements.py`
- Exact test function: `test_qrt_perf_001_health_endpoint_p95`
- Local command: `pytest tests/qrt -m qrt -v`
- Pass condition: all 20 responses satisfy the contract and p95 is below
  1000 ms.
- Produced evidence: pytest terminal output and GitHub Actions job log.
- Scope: this is an in-process CI measurement, not a production network
  benchmark.

## QRT-SEC-001

- Linked QR: `QR-SEC-001`
- Automation level: automated backend quality requirement test.
- Preconditions: backend Python dependencies are installed; no administrator
  credentials are provided to the test.
- Exact test procedure:
  1. Create a FastAPI TestClient for `app.main.app`.
  2. Request `GET /api/v1/auth/me` without Authorization.
  3. Request `GET /api/v1/auth/me` with
     `Authorization: Bearer definitely-not-a-valid-token`.
  4. Assert each response returns HTTP 401 or 403.
  5. Assert each JSON body does not expose authenticated `username`, `role`, or
     user `id` fields.
- Exact test file: `backend-service/tests/qrt/test_quality_requirements.py`
- Exact test function: `test_qrt_sec_001_invalid_identity_is_rejected`
- Local command: `pytest tests/qrt -m qrt -v`
- Pass condition: every invalid identity request is rejected without exposing
  identity fields.
- Produced evidence: pytest terminal output and GitHub Actions job log.
- Scope: this complements, but does not replace, penetration testing or
  complete role-authorisation testing.

## QRT-USE-001

- Linked QR: `QR-USE-001`
- Automation level: automated backend schema validation quality requirement
  test.
- Preconditions: backend Python dependencies are installed; tests import
  `PersonCreate` and `PersonUpdate` schemas directly.
- Exact test procedure:
  1. Instantiate `PersonCreate` and `PersonUpdate` with invalid names `""` and
     `"x" * 256`.
  2. Assert each invalid value raises `pydantic.ValidationError`.
  3. Instantiate `PersonCreate` and `PersonUpdate` with valid boundary names
     `"A"` and `"x" * 255`.
  4. Assert each valid boundary value creates a schema object successfully.
- Exact test file: `backend-service/tests/qrt/test_quality_requirements.py`
- Exact test functions:
  - `test_qrt_use_001_invalid_person_names_are_rejected`
  - `test_qrt_use_001_valid_person_name_boundaries_are_accepted`
- Local command: `pytest tests/qrt -m qrt -v`
- Pass condition: invalid boundaries fail validation and valid boundaries pass
  validation.
- Produced evidence: pytest terminal output and GitHub Actions job log.
- Scope: this checks backend validation only and does not verify frontend form
behaviour.

## QRT-REL-001

- Linked QR: `QR-REL-001`
- Automation level: automated pure-helper tests for recognition-score
  semantics.
- Preconditions: backend Python dependencies and Node.js dependencies are
  installed; no camera, face images, or trained model is required.
- Exact test procedure:
  1. Call `is_distance_match` with distance below, equal to, and above the
     threshold.
  2. Assert that only the below-threshold value is accepted.
  3. Call the frontend recognition-distance display helper with a good low
     distance and bad high distance.
  4. Assert the good match receives positive display state and the bad match
     receives negative display state.
- Exact test files:
  - `backend-service/tests/unit/test_recognition_score.py`
  - `frontend/faceguard-web/src/utils/recognitionScore.test.mjs`
- Local commands:
  - `cd backend-service && pytest tests/unit/test_recognition_score.py -v`
  - `cd frontend/faceguard-web && npm test -- --run`
- Pass condition: all five named tests pass.
- Scope: deterministic score semantics only; no camera, model reload,
  WebSocket, dataset-version, or browser end-to-end coverage is claimed.
