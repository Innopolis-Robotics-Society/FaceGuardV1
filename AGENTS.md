# Agent Guidance

This file is for maintainers and AI coding agents working in this repository.

## Product Boundaries

FaceGuard has four active product surfaces:

- `frontend/faceguard-web` - React administrator UI.
- `backend-service` - FastAPI backend, PostgreSQL models, API contracts, and
  tests.
- `agent` - camera/recognition/anti-spoofing/LED indicator runtime for local
  hardware.
- `docs` and `reports` - maintained public project evidence.

Avoid broad refactors across these surfaces unless the issue explicitly needs
them. Prefer small, reviewable changes tied to the current Sprint or handover
state.

## Safety Rules

- Never commit real `.env` files, credentials, customer data, biometric samples,
  private recordings, or private Moodle evidence.
- Do not replace public evidence with invented customer confirmation. If a
  meeting, UAT, deployment, release, or customer acceptance is missing, state it
  as missing.
- Keep hardware-dependent claims specific. A laptop/simulated-camera check is
  not a Raspberry Pi customer-side deployment.
- Keep the LED indicator contract current: blue means access granted, yellow
  means calibrating/operator attention, red means denied or unknown.

## Useful Commands

```bash
git status --short --branch
mkdocs build --strict
docker compose -f backend-service/docker-compose.yml config --quiet
```

Backend:

```bash
cd backend-service
pytest tests/unit -v
pytest tests/integration -v
pytest tests/qrt -m qrt -v
```

Frontend:

```bash
cd frontend/faceguard-web
npm ci
npm run build
npm test -- --run
```

Agent syntax smoke check:

```bash
python -m py_compile agent/core/config.py agent/door/door_controller.py agent/events/event_handler.py
```

## Documentation Rule

For every behavior or setup change, update the public route where a grader,
customer, or teammate would expect to find it:

- public entry point: `README.md`;
- customer transition: `docs/customer-handover.md`;
- Sprint evidence: `reports/week6` or `reports/week7`;
- quality/testing: `docs/testing.md`, `docs/quality-requirements.md`, and
  `docs/quality-requirement-tests.md`;
- user-visible change log: `CHANGELOG.md`.
