# ADR-001 - Backend Integration Boundary

- Status: Accepted for MVP v2 documentation
- Date: 2026-07-02
- Related quality requirements: [QR-SEC-001](../../quality-requirements.md#qr-sec-001-invalid-administrator-identity-is-rejected), [QR-USE-001](../../quality-requirements.md#qr-use-001-invalid-person-names-are-rejected)
- Related modules: `backend-service/app/api`, `backend-service/app/models`, `frontend/faceguard-web/src/services`
- Related issue: [#59](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/59)

## Context

FaceGuard has a browser administrator UI, a central backend, persistent
database models, and a device-side agent. Administrator workflows need a stable
contract for people, photos, devices, commands, events, and telemetry.

## Decision

The FastAPI backend is the integration and persistence boundary for the
administrator frontend and recognition agent. The frontend and agent use backend
HTTP/WebSocket contracts instead of reading or writing database tables directly.

## Alternatives Considered

- Let the frontend access storage directly. This would bypass authentication
  and validation boundaries.
- Let the agent write PostgreSQL directly. This would couple hardware runtime
  code to central schema details and make offline buffering harder.
- Use only local files for all state. This would not support central audit logs
  or administrator workflows.

## Consequences

The backend can enforce authentication, validation, auditability, and API
compatibility in one place. The cost is that backend API contracts and sync
behaviour must evolve carefully when frontend or agent data needs change.
