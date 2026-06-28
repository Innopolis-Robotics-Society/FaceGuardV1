# Week 4 Report - Assignment 4

## 1. Project Identification

- Project: FaceGuard
- Team number: Not Yet Available in the repository evidence reviewed on June 28,
  2026.
- Repository: [Innopolis-Robotics-Society/FaceGuardV1](https://github.com/Innopolis-Robotics-Society/FaceGuardV1)
- Public report purpose: document the Assignment 4 / Week 4 increment, quality
  gates, Sprint evidence, and remaining submission work without exposing private
  customer or credential material.
- Assignment 4 increment: Sprint 2 - Increment.
- Report status: In Progress; public documentation prepared, customer session
  pending.
- Latest evidence date: June 28, 2026.

## 2. Team

Team identity is reused from the maintained Week 3 report.

| Name | GitHub | Sprint role | Main responsibility |
| --- | --- | --- | --- |
| Danila Naboishchikov | [Sparta2016840](https://github.com/Sparta2016840) | Scrum Master / Developer | Assignment 4 QA gates, testing documentation, review of Dashboard refresh PR. |
| Emil Vagizov | [etherealboop](https://github.com/etherealboop) | Developer | US-09 access-events review implementation. |
| Eldar Bayazitov | [rmxqwo](https://github.com/rmxqwo) | Developer | US-10 authorized-person edit/removal implementation and PR review for US-09. |
| Oleg Korchagin | [privel](https://github.com/privel) | Developer | Dashboard refresh implementation and review of QA gates. |

## 3. Sprint Overview

- Milestone: [Sprint 2 - Increment](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/milestone/2)
- Sprint dates: June 22, 2026 to June 29, 2026.
- Sprint Goal: Improve the FaceGuard administrator experience by completing
  access-log review, making person removal safer, adding clear Dashboard refresh
  feedback, and introducing automated quality requirements, tests, coverage
  enforcement, and CI quality gates.
- Selected scope: issues #21, #22, #47, and #48.
- Selected scope total: 10 Story Points.
- Milestone progress at latest evidence collection: selected Sprint issues #21,
  #22, #47, and #48 are closed through merged PRs. The broader Sprint 2
  milestone may still contain other open issues.

## 4. Sprint Backlog Traceability

| PBI | Outcome | SP | Implementer | Reviewer | Issue | PR | Current status |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| US-09: Review access-attempt events | Access Logs should show timestamp, granted/denied/unknown result, person or Unknown, device/location, filters, newest-first ordering, and 25-item pagination. | 3 | [etherealboop](https://github.com/etherealboop) | [rmxqwo](https://github.com/rmxqwo) | [#21](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/21) | [#50](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/50) | Delivered; merged to `main` on June 28, 2026. |
| US-10: Edit or remove authorized people | People records should support edit, notes/photo update, safe typed delete confirmation, success feedback, and immediate list update. | 3 | [rmxqwo](https://github.com/rmxqwo) | [etherealboop](https://github.com/etherealboop) | [#22](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/22) | [#51](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/51) | Delivered; merged to `main` on June 28, 2026. |
| PBI-A4-16: Dashboard refresh | Dashboard has a manual refresh action and last-updated feedback. | 1 | [privel](https://github.com/privel) | [Sparta2016840](https://github.com/Sparta2016840) | [#47](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/47) | [#52](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/52) | Delivered; merged to `main` on June 28, 2026. |
| PBI-A4-QA: Quality gates | Quality requirements, QRTs, unit/integration tests, coverage enforcement, and CI jobs are defined and automated. | 3 | [Sparta2016840](https://github.com/Sparta2016840) | [privel](https://github.com/privel) | [#48](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/48) | [#49](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/49) | Delivered; merged to `main` on June 28, 2026. |

## 5. Delivered and Pending Increment

### Delivered to `main`

- [#47](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/47)
  via [PR #52](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/52):
  manual Dashboard refresh and last-updated feedback.
- [#48](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/48)
  via [PR #49](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/49):
  quality gates and tests.
- [#22](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/22)
  via [PR #51](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/51):
  authorized-person edit and safe removal.
- [#21](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/21)
  via [PR #50](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/50):
  Access Logs integration.

### In Review

No selected Sprint scope PR is in review at the latest evidence point. This
documentation update is delivered through a separate documentation PR because
PR #49 was merged before the expanded Week 4 report commit reached `main`.

### Pending Implementation

No selected Sprint 2 issue is without an implementation PR. The remaining work
is final documentation PR review/merge, cleanup of the generated ZIP archive
that reached `main`, protected-main evidence refresh, deployment verification,
UAT, customer review, and release.

## 6. Customer and Stakeholder Feedback Response

Detailed response table: [customer-feedback-response.md](customer-feedback-response.md)

| Feedback source | Feedback | Response | PBI/Issue | Status | Rationale |
| --- | --- | --- | --- | --- | --- |
| Customer Review | Continue the accepted MVP v1 direction and stabilize on Ubuntu before Raspberry Pi. | Keep local-camera model and track hardware stabilization as follow-up. | [#35](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35) | Planned | Confirmed in Week 3 customer review summary. |
| Customer Review | Recognition data refresh after person changes remains a limitation. | Keep the bug visible and avoid hiding the limitation in Assignment 4 evidence. | [#35](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35) | Planned | Confirmed in Week 3 customer review summary. |
| Course quality requirement | Assignment 4 requires measurable quality requirements, QRTs, tests, coverage, and CI. | Implement through QA gates PR. | [#48](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/48) | Delivered | Course requirement, not customer feedback. |
| Team-identified improvement | Dashboard needed clearer manual refresh feedback. | Implemented manual refresh and last-updated state. | [#47](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/47) | Delivered | Delivered through PR #52. |

## 7. Quality Requirements

Full documents:

- [Quality requirements](../../docs/quality-requirements.md)
- [Quality requirement tests](../../docs/quality-requirement-tests.md)

| QR | ISO/IEC 25010 characteristic | Sub-characteristic | Measure | QRT |
| --- | --- | --- | --- | --- |
| `QR-PERF-001` | Performance efficiency | Time behaviour | 20 health requests return HTTP 200 with `status: "ok"` and p95 below 1000 ms in TestClient CI measurement. | `QRT-PERF-001` |
| `QR-SEC-001` | Security | Authenticity | Missing and malformed administrator identity requests are rejected with HTTP 401 or 403 and expose no identity fields. | `QRT-SEC-001` |
| `QR-USE-001` | Usability | User error protection | Invalid person names are rejected; one-character and 255-character names are accepted. | `QRT-USE-001` |

## 8. Automated Testing

Testing guide: [docs/testing.md](../../docs/testing.md)

| Test group | Test files | Command | Current verified status |
| --- | --- | --- | --- |
| Unit tests | `backend-service/tests/unit/test_security.py` | `cd backend-service && pytest tests/unit -v` | Verified locally after this documentation update: 8 passed. |
| Integration tests | `backend-service/tests/integration/test_system_api.py` | `cd backend-service && pytest tests/integration -v` | Verified locally after this documentation update: 2 passed. |
| QRTs | `backend-service/tests/qrt/test_quality_requirements.py` | `cd backend-service && pytest tests/qrt -m qrt -v` | Verified locally after this documentation update: 10 passed. |
| Frontend build | `frontend/faceguard-web` | `npm ci && npm run build` | Verified locally after this documentation update; Vite reported a large chunk warning. |

## 9. Critical-Module Coverage

The following values are from the latest verified PR #49 coverage evidence at
the time this report was prepared. They must be refreshed if tests are rerun and
coverage changes.

| Critical module | Required | Actual | Evidence |
| --- | ---: | ---: | --- |
| `app/api/system.py` | 30% | 50.00% | [PR #49](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/49) body and successful `Quality gates` run. |
| `app/core/security.py` | 30% | 96.15% | [PR #49](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/49) body and successful `Quality gates` run. |
| `app/schemas/schemas.py` | 30% | 100.00% | [PR #49](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/49) body and successful `Quality gates` run. |

## 10. CI and Additional QA

PR #49 adds these visible jobs in `.github/workflows/quality.yml`:

- `Frontend production build`
- `Backend Ruff lint`
- `Backend tests and critical coverage`
- `Quality requirement tests`
- `Deployment configuration validation`

The additional QA check is Docker Compose configuration validation:

```bash
docker compose -f backend-service/docker-compose.yml config --quiet
```

Lychee is link checking and is not counted as the additional QA check.

| Evidence type | Status | Evidence |
| --- | --- | --- |
| Successful PR CI | Delivered for PR #49 before this documentation commit | [Quality gates run](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28290665283) and [link-check run](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28290665286). |
| Successful protected-main CI | Not Yet Available | Must be rechecked after this documentation PR and any cleanup PRs. |
| Protected-main quality workflow | Pending Deployment Verification | `quality.yml` is now on `main`, but final evidence must be linked after this documentation PR. |
| Local Compose validation | Not Yet Available | Docker CLI was not available on the local machine; GitHub Actions must provide the Compose validation evidence. |

## 11. Definition of Done

Definition of Done: [docs/definition-of-done.md](../../docs/definition-of-done.md)

The Assignment 4 Definition of Done requires verified Acceptance Criteria,
issue-linked PRs, independent review, relevant tests, linked QRTs, per-critical
module coverage, CI, documentation, changelog updates, and evidence preservation.

## 12. Deployment and Release

- Release status: Pending documentation PR, deployment verification, customer
  session, and release publication.
- Current published release: [FaceGuard MVP v1 / v1.0.0](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v1.0.0), which belongs to Assignment 3.
- Assignment 4 release: Not Yet Available.
- Draft release notes: [release-notes-v0.2.0-draft.md](release-notes-v0.2.0-draft.md)
- Deployment verification: Pending Deployment Verification.

## 13. UAT

UAT scenarios: [docs/user-acceptance-tests.md](../../docs/user-acceptance-tests.md)

- Execution status: Pending Customer Session.
- UAT results: Not Yet Available.
- UAT timecodes: Not Yet Available.

## 14. Sprint Review

- Status: Pending Customer Session.
- Summary template: [customer-review-summary.md](customer-review-summary.md)
- Notes template: [customer-review-notes.md](customer-review-notes.md)

No Week 4 Sprint Review is claimed in this report.

## 15. Retrospective

Retrospective: [retrospective.md](retrospective.md)

The current retrospective focuses on evidence from GitHub: small Sprint PBIs,
parallel implementation, issue-linked PRs, automated quality gates, late report
preparation, merge timing, generated artifact cleanup, and CI evidence gaps near
submission.

## 16. Reflection

Reflection: [reflection.md](reflection.md)

The reflection explains the shift from a functional MVP toward a
quality-controlled increment and records the need to prepare UAT and customer
review evidence earlier.

## 17. LLM Usage

LLM report: [llm-report.md](llm-report.md)

The report documents Codex-assisted repository inspection, documentation
drafting, traceability extraction, consistency review, and limitations.

## 18. Public Demo and Presentation

- Public demo script: [demo-script.md](demo-script.md)
- Presentation outline: [presentation-outline.md](presentation-outline.md)
- Public demo video: Pending recording after the final increment is deployed.
- Rehearsal video: Private Moodle evidence - pending.

## 19. Evidence Index

Evidence index: [evidence-index.md](evidence-index.md)

## 20. Contribution Traceability

Contribution traceability: [contribution-traceability.md](contribution-traceability.md)

## 21. Public and Private Evidence Separation

### Public GitHub Evidence

- code;
- Issues;
- PRs;
- reviews;
- CI;
- coverage;
- documentation;
- release notes;
- public demo material after sanitization.

### Private Moodle Evidence

- customer recording and consent details;
- UAT timecodes;
- credentials or private deployment access;
- rehearsal video;
- instructor-only notes.

Private material must not be committed to the public repository.

## 22. Remaining Work

- [x] Prepare public Week 4 report structure.
- [x] Prepare UAT scenarios.
- [x] Prepare customer review templates.
- [x] Prepare release notes draft.
- [x] Merge PR #49.
- [x] Merge PR #50.
- [x] Merge PR #51.
- [ ] Remove `frontend/faceguard-web.zip` from `main` in a cleanup PR unless
  explicitly justified.
- [ ] Merge this documentation PR after checks remain green.
- [ ] Verify latest `main` CI after this documentation PR and cleanup PRs are
  merged.
- [ ] Add coverage artifact evidence after final CI run.
- [ ] Add QRT evidence after final CI run.
- [ ] Add branch protection/rules evidence from an account with sufficient
  repository permissions.
- [ ] Complete customer Sprint Review.
- [ ] Execute UAT scenarios with the customer.
- [ ] Add customer review summary and notes based on the real session.
- [ ] Verify deployment or runnable release artifact.
- [ ] Publish Assignment 4 release.
- [ ] Record sanitized public demo.
- [ ] Prepare private Moodle PDF with recording, timecodes, credentials/access
  details if required, and instructor-only evidence.
