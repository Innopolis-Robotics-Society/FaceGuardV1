# FaceGuard Quality Requirements

This document defines measurable quality requirements for the Assignment 4
FaceGuard quality gates. The requirements use ISO/IEC 25010 terminology and are
linked to automated Quality Requirement Tests in
[quality-requirement-tests.md](quality-requirement-tests.md).

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

### Limitations

This is an in-process CI measurement with FastAPI TestClient. It is not a
production network benchmark and does not measure reverse proxies, container
networking, database readiness, camera integrations, or internet latency.

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

### Limitations

This automated check does not replace penetration testing, complete
role-authorisation testing, token revocation checks, or production security
review. It covers the documented invalid-identity boundary only.

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

### Limitations

This requirement validates backend schema boundaries only. It does not cover
frontend form usability, localisation, duplicate names, profanity filtering, or
database-level constraints.
