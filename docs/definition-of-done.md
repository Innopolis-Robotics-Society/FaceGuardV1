# Definition of Done

A PBI is Done only when all applicable conditions are satisfied:

- Acceptance criteria are verified with evidence.
- Implementation PR is linked to the Issue.
- Implementation is merged through an issue-linked reviewed PR.
- The PR is reviewed by another participant.
- Required CI checks are green.
- Relevant unit and integration tests pass.
- Linked Quality Requirement Tests pass.
- Every affected critical module has at least 30% line coverage.
- Manual checks and environment are documented.
- Documentation and exact run/access instructions are updated.
- Meaningful changes are added to `CHANGELOG.md`.
- Week 4 evidence is preserved when the PBI belongs to the Assignment 4 increment.
- No credentials, biometric data, customer data, private evidence, PII, or unsafe credentials are committed.
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
- Assignment 4 quality-gate work must update the quality requirements, QRT traceability, testing guide, coverage evidence, and Week 4 report links.
