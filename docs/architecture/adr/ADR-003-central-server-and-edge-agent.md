# ADR-003 - Central Server and Edge Agent

- Status: Accepted for MVP v2 documentation
- Date: 2026-07-02
- Related quality requirements: [QR-PERF-001](../../quality-requirements.md#qr-perf-001-health-endpoint-response-time), [QR-REL-001](../../quality-requirements.md#qr-rel-001-recognition-score-semantics-are-consistent)
- Related modules: `backend-service/docker-compose.yml`, `agent/main.py`, `agent/sync`, `agent/commands`
- Related issue: [#59](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/59)

## Context

FaceGuard must combine central administration and auditability with local
camera/door hardware. The camera and door relay are not reliable public cloud
resources and may process biometric data.

## Decision

The system uses a central backend/frontend/database and a separate edge
recognition agent connected to local hardware. The edge agent sends heartbeat,
telemetry, events, and command status to the backend and buffers events locally.

## Alternatives Considered

- Run recognition inside the backend service. This would tie central uptime to
  camera hardware availability and increase biometric-data exposure.
- Run all administration locally on the device. This would make multi-user
  administration and central audit logs weaker.
- Use a fully managed cloud recognition service. This is outside the current
  repository implementation and would change privacy and deployment assumptions.

## Consequences

The split supports hardware locality and central audit workflows. It also
requires clear synchronization for model rebuilds, event delivery, command
polling, and offline behaviour.
