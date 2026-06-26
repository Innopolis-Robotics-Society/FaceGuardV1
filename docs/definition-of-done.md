# Definition of Done

A PBI is Done only when all applicable conditions are satisfied:

- Acceptance criteria are verified with evidence.
- Implementation is merged through an issue-linked reviewed PR.
- A different team member reviewed the work.
- Required tests/build checks pass.
- Relevant automated quality requirement tests pass.
- Critical-module coverage expectations are met or an approved exception is linked.
- Manual checks and environment are documented.
- Testing evidence is preserved in PRs, CI runs, or linked documentation.
- Documentation and exact run/access instructions are updated.
- `CHANGELOG.md` is updated for every user-visible change.
- No secrets, PII, or unsafe credentials are committed.
- Deployment/runtime smoke check is completed when applicable.
- GitHub Project Work Status is `Done`.
- Linked supporting PBIs required by a user story are also Done.

## Project-Specific Checks

- Frontend changes must pass the active build command and include screenshots or a written N/A reason for visible UI changes.
- Central backend changes must verify the FastAPI health endpoint and database-dependent paths when they are in scope.
- Database changes must document migration, rollback, and seed-data expectations.
- Device-agent changes must verify health, telemetry, camera snapshot or stream, and safe behavior when the central backend is unavailable.
- Camera integration work must state whether it was checked with a real camera, a simulated camera, or both.
- Browser-facing code must call the central backend and must not expose the device-agent API key.
- MVP v1 completion requires a release link, deployment/access point, smoke-check evidence, and customer review outcome.

## Assignment 4 Quality Gates

The following gates are maintained project expectations after Assignment 4 unless superseded by a later documented requirement:

- `docs/quality-requirements.md` defines the active quality requirements with stable IDs and ISO/IEC 25010 sub-characteristics.
- `docs/quality-requirement-tests.md` maps every active quality requirement to at least one automated quality requirement test or a TA-approved exception.
- `docs/testing.md` records the unit, integration, coverage, CI, and additional QA checks used as evidence.
- Critical product modules must have at least 30% automated line coverage unless a TA-approved exception is linked from `docs/testing.md`.
- The latest protected-default-branch CI run must pass before a Sprint increment is released, unless a TA-approved outage or exception is documented.
- User acceptance scenarios in `docs/user-acceptance-tests.md` remain active product checks and must be updated when product behavior changes.
