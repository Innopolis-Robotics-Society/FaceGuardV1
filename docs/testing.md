# Testing and QA Strategy

This document records maintained automated testing, coverage, CI, and additional QA checks for FaceGuard.

## Test Layers

| Layer | Purpose | Test location | CI job | Current status |
|---|---|---|---|---|
| Unit tests | Verify critical product logic in isolation | TBD | TBD | Draft |
| Integration tests | Verify important interactions between product components | TBD | TBD | Draft |
| Automated QRTs | Verify measurable quality requirements | [docs/quality-requirement-tests.md](./quality-requirement-tests.md) | TBD | Draft |
| Build checks | Verify runnable frontend/backend artifacts | TBD | TBD | Draft |
| Link checks | Verify public documentation links | `.github/workflows/links.yml` | Check links | Active |
| Additional QA check | Assignment 4 QA check distinct from linting, formatting, type checking, build, tests, coverage, QRTs, and link checking | TBD | TBD | Draft |

## Critical Modules and Coverage Expectations

Critical modules must each reach at least 30% automated line coverage unless a TA-approved exception is linked.

| Critical module | Why critical | Coverage command/report | Current line coverage | Status |
|---|---|---|---|---|
| `backend-service/app/api/people.py` | Authorized-person management path | TBD | TBD | Draft |
| `backend-service/app/api/events.py` | Recognition/access event history path | TBD | TBD | Draft |
| `backend-service/app/core/security.py` | Authentication/security helpers | TBD | TBD | Draft |
| `frontend/faceguard-web/src/app/components/pages/People.tsx` | Main operator people-management UI | TBD | TBD | Draft |
| `frontend/faceguard-web/src/app/components/pages/Dashboard.tsx` | Main system-status UI | TBD | TBD | Draft |

## Unit Tests

- TBD: link to backend unit tests.
- TBD: link to frontend unit tests.
- TBD: link to agent unit tests if included in Assignment 4 scope.

## Integration Tests

- TBD: link to backend API integration tests.
- TBD: link to frontend/backend integration or mocked API tests.
- TBD: link to device-agent/backend contract tests if included in Assignment 4 scope.

## Additional QA Check Options Considered

| Option | Risk addressed | Selected? | Notes |
|---|---|---|---|
| Secret scanning or sensitive-data scan | Public evidence leakage | TBD | Must be distinct from link checking and required tests. |
| Dependency vulnerability audit | Known vulnerable dependencies | TBD | Requires package-manager-specific command and documented limitations. |
| Container image smoke/security check | Runtime packaging risk | TBD | Useful if Docker artifacts become part of release evidence. |
| API schema validation | Backend contract drift | TBD | Useful if OpenAPI schema is used by frontend or agents. |

## Selected Additional QA Check

- **Check:** TBD.
- **Objective or risk addressed:** TBD.
- **Why the risk matters:** TBD.
- **Where it runs in CI:** TBD.
- **Limitations or deferred work:** TBD.

## CI Evidence

| Evidence | Link |
|---|---|
| CI pipeline | TBD |
| Latest protected-default-branch CI run | TBD |
| Branch protection or rules evidence | TBD |
| Test report screenshot or artifact | TBD |
| Coverage report screenshot or artifact | TBD |
| Additional QA check result | TBD |
