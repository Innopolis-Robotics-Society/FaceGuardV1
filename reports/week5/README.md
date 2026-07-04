# Assignment 5 / Week 5 Report

Project: FaceGuard, an MVP access-control system combining an administrator
web app, central backend, PostgreSQL persistence, an edge recognition agent, and
local camera/door hardware integration.

## 1. Sprint 3 MVP v2 Overview

- Product Backlog board/view:
  [GitHub Project view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/1)
- Sprint Backlog board/view:
  [GitHub Project Sprint view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/2)
- Sprint milestone:
  [Sprint 3 - MVP v2](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/milestone/3)
- Sprint dates: Pending confirmation from the Sprint 3 milestone fields.
- Sprint Goal: document the current architecture and development process,
  extend recognition-score correctness tests, preserve the Assignment 4 quality
  baseline, and prepare truthful MVP v2 delivery evidence.
- Total selected Story Points: 24.
- Current public product access artifact:
  [repository run instructions](../../README.md#run-the-central-backend).

## 2. Selected PBIs and Scope

| Issue | Title | SP | Implementer | Reviewer | Current status |
| --- | --- | ---: | --- | --- | --- |
| [#59](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/59) | PBI-A5-ARCH: Document FaceGuard architecture and architecture decisions | 5 | Sparta2016840 | rmxqwo | Local repository work prepared; PR/review pending. |
| [#60](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/60) | PBI-A5-PROC: Document the development and configuration process | 3 | Sparta2016840 | etherealboop | Local repository work prepared; PR/review pending. |
| [#61](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/61) | PBI-A5-QA: Extend testing and CI for MVP v2 | 3 | Sparta2016840 | privel | Local tests/docs prepared; customer UAT and protected-main CI pending. |
| [#62](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/62) | PBI-A5-DELIVERY: Prepare the MVP v2 delivery and Week 5 evidence | 5 | Sparta2016840 | rmxqwo | Public structure prepared; external evidence pending. |
| [#35](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35) | BUG-01: Recognition agent requires restart after authorized-person changes | 5 | privel | Sparta2016840 | Open; documented as not fully fixed in this repository state. |
| [#58](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/58) | BUG-02: Recognition confidence is displayed in reverse | 3 | privel | Sparta2016840 | Local score-semantics fix/tests prepared; PR/review pending. |

Delivered repository-side MVP v2 changes:

- Corrected recognition-score presentation so raw OpenCV LBPH distance is not
  displayed as a fake higher-is-better confidence percentage.
- Added deterministic tests for recognition threshold boundary and UI score
  presentation.
- Added maintained architecture views and ADRs.
- Added development-process and configuration-management documentation.
- Added hosted-docs configuration and Week 5 report structure.

## 3. Customer Feedback Response

| Feedback point or product risk | Resulting PBI or issue | Status | Response |
| --- | --- | --- | --- |
| Authorized-person changes should become effective without manually restarting the recognition agent. | [#35](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35), [#61](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/61) | Pending customer execution and full implementation evidence | Added UAT scenario and documented the blocker. A complete fix still needs reliable dataset/model sync for web-uploaded and agent-captured photos. |
| Strong and weak recognition results were confusing because raw LBPH distance was presented as confidence. | [#58](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/58), [#61](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/61) | Repository tests added; customer execution pending | UI helper tests verify lower LBPH distance displays as stronger and higher distance as weaker. |
| Architecture, workflow, and configuration-management evidence must be maintainable. | [#59](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/59), [#60](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/60) | Local documentation prepared; PR/review pending | Added maintained docs under `docs/`, diagrams-as-code, ADRs, and development-process documentation. |

Deferred feedback explanation: the stale authorized-person model refresh bug is
not claimed as fully fixed in this repository state because the current backend
photo upload stores originals/thumbnails but does not create processed training
images on the agent. A safe complete fix needs dataset synchronization or
backend/agent photo processing plus atomic model reload.

## 4. Maintained Documentation Links

- [Roadmap](../../docs/roadmap.md)
- [Definition of Done](../../docs/definition-of-done.md)
- [Testing guide](../../docs/testing.md)
- [Quality requirements](../../docs/quality-requirements.md)
- [Quality requirement tests](../../docs/quality-requirement-tests.md)
- [User acceptance tests](../../docs/user-acceptance-tests.md)
- [Development process and configuration management](../../docs/development-process.md)
- [Architecture overview](../../docs/architecture/README.md)
- [Static architecture view](../../docs/architecture/static-view/component-diagram.svg)
- [Dynamic architecture view](../../docs/architecture/dynamic-view/recognition-workflow.svg)
- [Deployment architecture view](../../docs/architecture/deployment-view/deployment-diagram.svg)
- [ADR index](../../docs/architecture/README.md#adr-index)
- [CHANGELOG](../../CHANGELOG.md)
- Hosted documentation site:
  [FaceGuard documentation](https://innopolis-robotics-society.github.io/FaceGuardV1/)
  - Pending until GitHub Pages deployment completes.

## 5. Architecture Summary

FaceGuard keeps central administration and persistence in the FastAPI backend
while the recognition agent remains close to local camera and door hardware.
The static view documents the browser, frontend, backend, database, agent, and
hardware boundary. The dynamic view documents recognition event submission. The
deployment view documents the central service host, edge recognition host, and
customer-facing browser path.

Quality-to-ADR traceability:

- [ADR-001 - Backend integration boundary](../../docs/architecture/adr/ADR-001-backend-integration-boundary.md)
  supports authentication and validation requirements.
- [ADR-002 - Recognition score semantics](../../docs/architecture/adr/ADR-002-recognition-score-semantics.md)
  supports consistent score interpretation.
- [ADR-003 - Central server and edge agent](../../docs/architecture/adr/ADR-003-central-server-and-edge-agent.md)
  supports the current hardware/deployment split.

## 6. Testing and CI Status

Automated tests added for Sprint 3 / Assignment 5:

- `test_distance_below_threshold_is_match`
- `test_distance_equal_threshold_uses_documented_boundary`
- `test_distance_above_threshold_is_not_match`
- `test_good_match_has_positive_display`
- `test_bad_match_has_negative_display`

Local validation status:

| Command | Status |
| --- | --- |
| `npm run build` in `frontend/faceguard-web` | Passed locally. |
| `npm test -- --run` in `frontend/faceguard-web` | Passed locally. |
| `pytest tests -v` in `backend-service` | Passed locally. |
| `pytest tests/qrt -m qrt -v` in `backend-service` | Passed locally. |
| `ruff check app/api/system.py app/core/security.py app/schemas/schemas.py tests scripts` | Passed locally. |
| `pytest tests -v --cov=app --cov-report=term-missing --cov-report=xml:coverage.xml --cov-report=json:coverage.json` | Passed locally. |
| `python scripts/check_critical_coverage.py coverage.json` | Passed locally. |
| `mkdocs build --strict` | Passed locally. |
| `java -jar C:\tmp\plantuml.jar -tsvg ...` | Passed locally after installing a Java-8-compatible PlantUML jar. |
| `docker compose -f backend-service/docker-compose.yml config --quiet` | Not run locally; Docker is not available in PATH. |

CI pipeline:
[Quality gates](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/workflows/quality.yml).

Latest protected-default-branch CI run: Pending after reviewed PR merge to
protected `main`.

## 7. Release, Demo, UAT, and Hosted Docs Evidence

- SemVer release mapped to MVP v2: Pending. It must be created from protected
  `main` after required PR review and CI evidence.
- Public sanitized MVP v2 demo shorter than two minutes: Pending.
- Public sanitized UAT result summary: Pending customer-executed UAT.
- Hosted documentation deployment: Pending GitHub Pages workflow run.
- Sprint Review notes: [sprint-review-notes.md](sprint-review-notes.md)
- Sprint Review summary: [sprint-review-summary.md](sprint-review-summary.md)
- Sprint Review transcript: not published in this repository state. Use notes
  until a real permitted transcript exists.

## 8. Week 5 Supporting Files

- [Reflection](reflection.md)
- [Retrospective](retrospective.md)
- [LLM report](llm-report.md)
- Screenshot directory: [images/](images/)

## 9. Screenshot Evidence

Required screenshots are Pending and should be added under `reports/week5/images/`
after the corresponding evidence exists:

| Required screenshot | Status |
| --- | --- |
| Sprint milestone | Pending. |
| Board or project workflow view | Pending. |
| Latest protected-default-branch CI run | Pending. |
| SemVer release | Pending. |
| Example reviewed issue-linked PR | Pending. |
| Hosted docs site | Pending. |
| Product access artifact where useful | Pending. |

## 10. Contribution Traceability

| Team member / GitHub username | Sprint 3 / Assignment 5 responsibility | Current public evidence |
| --- | --- | --- |
| Sparta2016840 | Implementer for #59, #60, #61, #62 | Local repository work prepared; commit/PR evidence pending. |
| rmxqwo | Reviewer for #59 and #62 | Review evidence pending. |
| etherealboop | Reviewer for #60 | Review evidence pending. |
| privel | Implementer for #35 and #58; reviewer for #61 | Review/merge evidence pending. |

## 11. Current Product Status and Next Steps

Current status: repository-side MVP v2 documentation, score-semantics tests, UI
score presentation, architecture diagrams, ADRs, and hosted-docs configuration
are prepared locally. External delivery evidence is not yet complete.

Next steps:

1. Commit and push focused issue-linked branches.
2. Open PRs for #59, #60, #61, and #62 and request the assigned reviewers.
3. Run CI and merge only after review approval and required checks pass.
4. Publish hosted documentation through GitHub Pages.
5. Execute customer UAT and Sprint Review, keeping private recordings and
   timecodes out of the repository.
6. Add permitted screenshots and public demo link.
7. Publish the MVP v2 SemVer release from protected `main`.

## 12. Moodle PDF Checklist

The private Moodle PDF must include team member identities, university emails,
GitHub usernames, Scrum roles, technical responsibilities, who did what,
non-participation notes, commit-hash permalinks, private Sprint Review/UAT
recording links or timecodes, exact private access instructions, limited
credentials where needed, and private consent or customer-identifying evidence.
None of that private material should be committed.
