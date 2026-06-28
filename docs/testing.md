# FaceGuard Testing Guide

This guide documents the maintained testing baseline for the active
FaceGuard backend in `backend-service` and frontend in `frontend/faceguard-web`.

## Testing Scope

- Backend unit tests for security helpers and schema validation.
- Backend integration tests for critical API contracts using FastAPI
  TestClient.
- Automated Quality Requirement Tests linked to measurable quality
  requirements.
- Frontend production build verification.
- Deployment configuration validation through Docker Compose.

The tests do not require a physical camera, do not use production credentials,
do not use biometric data, and the initial integration tests do not require a
real PostgreSQL instance.

## Unit Tests

Unit tests cover deterministic backend logic that can run without external
services:

- password hashing and verification in `app/core/security.py`;
- JWT creation and decoding in `app/core/security.py`;
- person-name validation boundaries in `app/schemas/schemas.py`.

Local command:

```bash
cd backend-service
pytest tests/unit -v
```

## Integration Tests

Integration tests use FastAPI TestClient against the active backend app in
`backend-service/app/main.py`.

Current integration coverage:

- `GET /api/v1/system/health` response contract;
- `GET /api/v1/auth/me` rejection when credentials are missing.

Local command:

```bash
cd backend-service
pytest tests/integration -v
```

## Automated QRTs

QRTs are automated tests linked to documented quality requirements:

- `QRT-PERF-001` verifies health endpoint p95 response time in process.
- `QRT-SEC-001` verifies invalid administrator identity rejection.
- `QRT-USE-001` verifies invalid person-name rejection and valid boundaries.

Local command:

```bash
cd backend-service
pytest tests/qrt -m qrt -v
```

## Critical Modules and Coverage Threshold

Each critical module must independently meet the documented minimum line
coverage. The 30% threshold applies separately to every critical module. Global
repository coverage is not this threshold and must not be used as a substitute.

| Module | Minimum line coverage |
| ------ | --------------------: |
| `app/api/system.py` | 30% |
| `app/core/security.py` | 30% |
| `app/schemas/schemas.py` | 30% |

Coverage command:

```bash
cd backend-service
pytest tests -v \
  --cov=app \
  --cov-report=term-missing \
  --cov-report=xml:coverage.xml \
  --cov-report=json:coverage.json
python scripts/check_critical_coverage.py coverage.json
```

## Local Commands

Backend setup and checks:

```bash
cd backend-service
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
ruff check app/api/system.py app/core/security.py app/schemas/schemas.py tests scripts
pytest tests/unit -v
pytest tests/integration -v
pytest tests/qrt -m qrt -v
pytest tests -v \
  --cov=app \
  --cov-report=term-missing \
  --cov-report=xml:coverage.xml \
  --cov-report=json:coverage.json
python scripts/check_critical_coverage.py coverage.json
```

Frontend build:

```bash
cd frontend/faceguard-web
npm ci
npm run build
```

Deployment configuration validation:

```bash
docker compose -f backend-service/docker-compose.yml config --quiet
```

## CI Jobs

The `.github/workflows/quality.yml` workflow runs on pull requests and pushes to
`main`. It provides these visible jobs:

- `Frontend production build`
- `Backend Ruff lint`
- `Backend tests and critical coverage`
- `Quality requirement tests`
- `Deployment configuration validation`

The existing Lychee workflow remains a link checker and is not counted as the
Assignment 4 additional QA check.

## Additional QA Check

The additional QA check is Docker Compose configuration validation:

```bash
docker compose -f backend-service/docker-compose.yml config --quiet
```

This verifies that the backend deployment configuration can be parsed by Docker
Compose before merge.

## Limitations

- FastAPI TestClient performance checks are in-process CI measurements, not
  production network benchmarks.
- The current integration tests avoid real PostgreSQL and do not validate
  database outage behaviour.
- Camera, recognition quality, and biometric matching are outside this automated
  baseline.
- These tests do not replace security review or penetration testing.

## Maintenance Policy

- Keep QRT IDs stable once referenced from quality documentation.
- Update `docs/quality-requirements.md` and
  `docs/quality-requirement-tests.md` when a QRT changes behaviour or scope.
- Add tests with every change to a critical module when behaviour changes.
- Do not reduce thresholds, remove critical modules, or disable CI steps only to
  obtain a green build.
- Do not commit generated coverage files, caches, credentials, biometric data,
  or private evidence.
