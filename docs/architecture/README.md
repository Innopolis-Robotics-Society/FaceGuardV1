# FaceGuard Architecture

This package documents the current FaceGuard repository architecture for MVP
v2. It describes implemented components only: a React administrator frontend,
a FastAPI backend, PostgreSQL persistence, an edge recognition agent, local
camera integration, and the command/sync APIs between the backend and agent.

## Views

- [Static component view](static-view/component-diagram.svg) with editable
  source in [component-diagram.puml](static-view/component-diagram.puml).
- [Dynamic recognition workflow](dynamic-view/recognition-workflow.svg) with
  editable source in
  [recognition-workflow.puml](dynamic-view/recognition-workflow.puml).
- [Deployment view](deployment-view/deployment-diagram.svg) with editable
  source in [deployment-diagram.puml](deployment-view/deployment-diagram.puml).

## Static View

The static view separates browser, central server, edge agent, and hardware
boundaries. The frontend has high cohesion around administrator workflows and
communicates with the backend through REST and WebSocket services in
`frontend/faceguard-web/src/services`. The backend owns persistence and API
contracts in `backend-service/app`. The recognition agent owns camera capture,
LBPH recognition, local event buffering, door control, heartbeat, and command
polling under `agent`.

The main coupling is intentional and boundary-based: the frontend depends on
backend API contracts; the agent depends on backend sync and command APIs; the
backend depends on database models. The riskiest coupling is the recognition
dataset boundary: web-uploaded photos are stored by the backend, while the
agent trains from local `data/faces/{person_id}/processed` files. That current
structure constrains maintainability for automatic model refresh and is tracked
by the Sprint 3 / Assignment 5 recognition-data work.

Relevant quality requirements: [QR-REL-001](../quality-requirements.md#qr-rel-001-recognition-score-semantics-are-consistent),
[QR-USE-001](../quality-requirements.md#qr-use-001-invalid-person-names-are-rejected),
and [QR-SEC-001](../quality-requirements.md#qr-sec-001-invalid-administrator-identity-is-rejected).

## Dynamic View

The dynamic view documents the recognition event workflow. The agent receives a
camera frame, calls the OpenCV LBPH recognizer, interprets the returned score as
raw distance where lower is better, stores an event locally, and submits it to
the backend. The frontend then reads persisted events from the backend and
displays the raw match distance.

This workflow crosses hardware, edge software, backend persistence, and
administrator UI boundaries. It supports auditability because events are
persisted centrally and buffered locally, but it is constrained by current
agent/backend data synchronization for model rebuilding.

## Deployment View

The deployment view shows the reproducible model used by the repository:
frontend and backend run as central services, PostgreSQL stores shared state,
and the recognition agent runs on a host connected to a camera and door relay
or development stub. This model is appropriate for MVP work because camera and
door access are local hardware concerns while administration and audit data are
centralized.

Operational concerns are explicit:

- the administrator access path is browser to frontend to backend;
- the edge agent needs backend connectivity for sync, heartbeat, and commands;
- local SQLite and `data/faces`/`data/models` preserve edge state;
- biometric data and private access instructions must not be committed.

## ADR Index

- [ADR-001 - Backend integration boundary](adr/ADR-001-backend-integration-boundary.md)
- [ADR-002 - Recognition score semantics](adr/ADR-002-recognition-score-semantics.md)
- [ADR-003 - Central server and edge agent](adr/ADR-003-central-server-and-edge-agent.md)

Together these ADRs explain why FaceGuard keeps the backend as the contract and
persistence boundary, why LBPH output is treated as distance rather than
probability, and why hardware recognition remains on an edge host.
