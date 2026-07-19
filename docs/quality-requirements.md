# FaceGuard Quality Requirements

This document defines measurable quality requirements for the Assignment 4
FaceGuard quality gates. The requirements use ISO/IEC 25010 terminology and are
linked to automated Quality Requirement Tests in
[quality-requirement-tests.md](quality-requirement-tests.md).

## Table of Contents

- [QR-PERF-001 - Health endpoint response time](#qr-perf-001-health-endpoint-response-time)
- [QR-SEC-001 - Invalid administrator identity is rejected](#qr-sec-001-invalid-administrator-identity-is-rejected)
- [QR-USE-001 - Invalid person names are rejected](#qr-use-001-invalid-person-names-are-rejected)
- [QR-REL-001 - Recognition score semantics are consistent](#qr-rel-001-recognition-score-semantics-are-consistent)
- [QR-USE-002 - Access decision signal is understandable](#qr-use-002-access-decision-signal-is-understandable)

<a id="qr-perf-001-health-endpoint-response-time"></a>

## QR-PERF-001 - Health endpoint response time

- Stable ID: `QR-PERF-001`
- Characteristic: Performance efficiency
- Sub-characteristic: Time behaviour
- Status: Approved for Assignment 4 automation
- Priority: Must Have
- Linked test: `QRT-PERF-001`

### Quality Scenario

- Source: automated CI test client.
- Stimulus: 20 sequential requests to `GET /api/v1/system/health`.
- Environment: GitHub-hosted Ubuntu runner using FastAPI TestClient.
- Artifact: FaceGuard backend health endpoint.
- Response: HTTP 200 and JSON field `status: "ok"`.
- Response measure:
  - 20 of 20 requests return HTTP 200;
  - 20 of 20 responses contain `status: "ok"`;
  - p95 response time is below 1000 ms.

### Rationale

The health endpoint is the first signal used by operators, deployment scripts,
and CI smoke checks to decide whether the backend application is alive. A slow
or inconsistent health endpoint makes deployment feedback unreliable.

### Traceability

- Quality Requirement Test: `QRT-PERF-001`
- Test source: `backend-service/tests/qrt/test_quality_requirements.py`
- CI job: `Quality requirement tests`
- Related ADR: [ADR-003 - Central server and edge agent](architecture/adr/ADR-003-central-server-and-edge-agent.md)

### Limitations

This is an in-process CI measurement with FastAPI TestClient. It is not a
production network benchmark and does not measure reverse proxies, container
networking, database readiness, camera integrations, or internet latency.

<a id="qr-sec-001-invalid-administrator-identity-is-rejected"></a>

## QR-SEC-001 - Invalid administrator identity is rejected

- Stable ID: `QR-SEC-001`
- Characteristic: Security
- Sub-characteristic: Authenticity
- Status: Approved for Assignment 4 automation
- Priority: Must Have
- Linked test: `QRT-SEC-001`

### Quality Scenario

- Source: client without a valid administrator identity.
- Stimulus:
  - request to `GET /api/v1/auth/me` without Authorization;
  - request with a malformed bearer token.
- Environment: automated backend test environment.
- Artifact: FaceGuard authentication boundary.
- Response: request is rejected without authenticated identity data.
- Response measure:
  - 100% of tested requests return HTTP 401 or 403;
  - response does not expose `username`, `role` or user `id`.

### Rationale

The administrator identity endpoint returns account data only after a valid
identity has been established. Rejecting missing and malformed credentials is a
minimum authenticity gate for protected administrator workflows.

### Traceability

- Quality Requirement Test: `QRT-SEC-001`
- Test source: `backend-service/tests/qrt/test_quality_requirements.py`
- CI job: `Quality requirement tests`
- Related ADR: [ADR-001 - Backend integration boundary](architecture/adr/ADR-001-backend-integration-boundary.md)

### Limitations

This automated check does not replace penetration testing, complete
role-authorisation testing, token revocation checks, or production security
review. It covers the documented invalid-identity boundary only.

<a id="qr-use-001-invalid-person-names-are-rejected"></a>

## QR-USE-001 - Invalid person names are rejected

- Stable ID: `QR-USE-001`
- Characteristic: Usability
- Sub-characteristic: User error protection
- Status: Approved for Assignment 4 automation
- Priority: Must Have
- Linked test: `QRT-USE-001`

### Quality Scenario

- Source: administrator or frontend client.
- Stimulus: person creation or update using an invalid name.
- Environment: automated backend validation environment.
- Artifact: `PersonCreate` and `PersonUpdate` schemas.
- Response: invalid data is rejected before persistence logic.
- Response measure:
  - empty names are rejected;
  - names longer than 255 characters are rejected;
  - a one-character name is accepted;
  - a 255-character name is accepted;
  - all tested invalid values raise a Pydantic validation error.

### Rationale

The person name is a primary administrator-facing field. Rejecting empty or
overlong names protects users from avoidable input mistakes and prevents
invalid values from reaching persistence logic.

### Traceability

- Quality Requirement Test: `QRT-USE-001`
- Test source: `backend-service/tests/qrt/test_quality_requirements.py`
- CI job: `Quality requirement tests`
- Related ADR: [ADR-001 - Backend integration boundary](architecture/adr/ADR-001-backend-integration-boundary.md)

### Limitations

This requirement validates backend schema boundaries only. It does not cover
frontend form usability, localisation, duplicate names, profanity filtering, or
database-level constraints.

<a id="qr-rel-001-recognition-score-semantics-are-consistent"></a>

## QR-REL-001 - Recognition score semantics are consistent

- Stable ID: `QR-REL-001`
- Characteristic: Reliability
- Sub-characteristic: Fault tolerance
- Status: Approved for Sprint 3 / Assignment 5 automation
- Priority: Must Have
- Linked tests: `test_distance_below_threshold_is_match`,
  `test_distance_equal_threshold_uses_documented_boundary`,
  `test_distance_above_threshold_is_not_match`,
  `test_good_match_has_positive_display`,
  `test_bad_match_has_negative_display`

### Quality Scenario

- Source: recognition agent and administrator UI.
- Stimulus: raw OpenCV LBPH recognition scores below, equal to, and above the
  configured threshold.
- Environment: automated unit/helper tests without camera hardware, biometric
  images, or a trained recognition model.
- Artifact: recognition threshold helper and frontend recognition-distance
  display helper.
- Response: lower distances are treated as better matches, equality with the
  threshold is rejected, and the UI displays stronger matches as stronger.
- Response measure:
  - distance below threshold is accepted;
  - distance equal to threshold is rejected;
  - distance above threshold is rejected;
  - a good lower-distance match has positive display state;
  - a bad higher-distance match has negative display state.

### Rationale

OpenCV LBPH returns a raw distance, not a higher-is-better probability. A
consistent interpretation prevents access decisions and UI feedback from
contradicting each other.

### Traceability

- Backend/helper tests:
  `backend-service/tests/unit/test_recognition_score.py`
- Frontend/helper tests:
  `frontend/faceguard-web/src/utils/recognitionScore.test.mjs`
- CI jobs: `Backend tests and critical coverage`,
  `Frontend recognition score tests`
- Related ADR: [ADR-002 - Recognition score semantics](architecture/adr/ADR-002-recognition-score-semantics.md)

### Limitations

This requirement verifies deterministic threshold and display semantics only.
It does not test camera capture, real-face recognition accuracy, agent model
reloads, dataset versioning, WebSocket delivery, concurrency, or browser
end-to-end behaviour.

<a id="qr-use-002-access-decision-signal-is-understandable"></a>

## QR-USE-002 - Access decision signal is understandable

- Stable ID: `QR-USE-002`
- Characteristic: Usability
- Sub-characteristic: Operability
- Status: Assignment 6 manual/hardware validation required
- Priority: Must Have
- Linked issue: [#75](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/75)

### Quality Scenario

- Source: person requesting access and customer/operator.
- Stimulus: granted, calibrating/operator-attention, and denied/unknown scanner
  states.
- Environment: Raspberry Pi hardware with the configured LED GPIO pins.
- Artifact: FaceGuard recognition agent access-indicator controller.
- Response: the scanner emits a visible LED signal matching the documented
  customer color mapping.
- Response measure:
  - blue LED is used for granted/manual-open signal;
  - yellow LED is available for calibrating/operator-attention signal;
  - red LED is used for unknown or denied signal;
  - the mapping is documented in README and customer handover.

### Rationale

The access requester needs immediate feedback without reading the administrator
panel. The customer explicitly corrected the Week 6 motor-based assumption to an
LED-based design.

### Traceability

- Implementation: `agent/door/door_controller.py`
- Configuration: `agent/core/config.py`, `agent/.env.example`
- Public handover: [customer-handover.md](customer-handover.md)

### Limitations

The repository can validate syntax and documentation only. Physical GPIO
operation, brightness, wiring, and customer acceptance require Raspberry Pi
hardware evidence and private/public confirmation artifacts.
