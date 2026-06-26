# Week 4 Report - FaceGuard

Use this file as the canonical public Assignment 4 report and submission index. Replace every `TBD` before submission and keep private credentials, private recording links, exact private timecodes, university emails, and customer-identifying evidence out of the public repository.

## 1. Project Summary

FaceGuard is an access-control system for restricted rooms and protected areas. It combines an administrator web interface, central backend service, persistent storage, recognition agent, and camera integration path.

## 2. Product and Sprint Links

- Product Backlog board/view: [GitHub Project Product Backlog](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/1)
- Sprint Backlog board/table: TBD
- Assignment 4 Sprint milestone: TBD
- Sprint Goal: TBD
- Sprint dates: TBD start - TBD finish
- Short scope summary: TBD
- Total Sprint size: TBD Story Points

## 3. Delivered Increment

- Delivered product changes: TBD
- Deployed product, hosted artifact, package, or runnable product: TBD
- Current access or run instructions: [README.md](../../README.md)
- Current product status: TBD
- Next steps: TBD

## 4. Customer Feedback Response

| Feedback point | Resulting PBI or issue | Status | Response |
|---|---|---|---|
| Recognition workflow should be stabilized on Ubuntu/laptop cameras before Raspberry Pi deployment. | TBD | TBD | TBD |
| Recognition data currently requires agent restart/model rebuild after authorized-person changes. | [BUG-01 / #35](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35) | TBD | TBD |
| TBD | TBD | TBD | TBD |

Feedback not addressed in this Sprint: TBD.

## 5. Maintained Project Documents

- Roadmap: [docs/roadmap.md](../../docs/roadmap.md)
- Definition of Done: [docs/definition-of-done.md](../../docs/definition-of-done.md)
- Quality requirements: [docs/quality-requirements.md](../../docs/quality-requirements.md)
- Quality requirement tests: [docs/quality-requirement-tests.md](../../docs/quality-requirement-tests.md)
- Testing and QA strategy: [docs/testing.md](../../docs/testing.md)
- User acceptance tests: [docs/user-acceptance-tests.md](../../docs/user-acceptance-tests.md)
- Changelog: [CHANGELOG.md](../../CHANGELOG.md)

## 6. Quality Model and Quality Requirements

Quality model used: ISO/IEC 25010 quality model.

Selected sub-characteristics:

- Reliability - availability: [QR-01](../../docs/quality-requirements.md#qr-01-availability-of-core-admin-and-backend-paths)
- Performance efficiency - time behaviour: [QR-02](../../docs/quality-requirements.md#qr-02-time-behaviour-for-access-control-feedback)
- Security - confidentiality: [QR-03](../../docs/quality-requirements.md#qr-03-confidentiality-of-sensitive-access-control-data)

Short quality summary: TBD.

## 7. Testing, Coverage, CI, and QA

Testing status summary: TBD.

| Critical module | Line coverage status | Evidence |
|---|---|---|
| `backend-service/app/api/people.py` | TBD | TBD |
| `backend-service/app/api/events.py` | TBD | TBD |
| `backend-service/app/core/security.py` | TBD | TBD |
| `frontend/faceguard-web/src/app/components/pages/People.tsx` | TBD | TBD |
| `frontend/faceguard-web/src/app/components/pages/Dashboard.tsx` | TBD | TBD |

- Unit tests: TBD
- Integration tests: TBD
- Automated quality requirement tests: [docs/quality-requirement-tests.md](../../docs/quality-requirement-tests.md)
- CI pipeline: TBD
- Latest protected-default-branch CI run: TBD
- Branch protection or rules evidence: TBD
- Linting/test/coverage screenshots or report links: TBD

Additional QA check:

- Options considered: TBD
- Selected check: TBD
- QA objective or risk addressed: TBD
- Why the risk matters: TBD
- Where the check runs in CI: TBD
- Limitations or deferred QA work: TBD

Continuity statement: Assignment 4 tests, CI checks, QRTs, coverage expectations, and Definition of Done updates are maintained project gates and must continue to apply to later work unless replaced by documented equivalent or stronger checks.

## 8. Release and Demo

- SemVer release mapped to Assignment 4 Sprint increment: TBD
- Public sanitized demo video under two minutes: TBD
- Optional public sanitized presentation slides: TBD

## 9. UAT and Customer Review

Public sanitized UAT results:

| UAT scenario | Result | Notes |
|---|---|---|
| [UAT-01](../../docs/user-acceptance-tests.md#uat-01-administrator-reviews-authorized-people) | TBD | TBD |
| [UAT-02](../../docs/user-acceptance-tests.md#uat-02-administrator-adds-a-person-with-reference-photographs) | TBD | TBD |
| [UAT-03](../../docs/user-acceptance-tests.md#uat-03-administrator-reviews-dashboard-and-recent-recognition-events) | TBD | TBD |

- Customer review transcript: [customer-review-transcript.md](./customer-review-transcript.md) if public publication is permitted.
- Customer review notes: [customer-review-notes.md](./customer-review-notes.md) if recording or private transcript sharing is refused.
- Customer review summary: [customer-review-summary.md](./customer-review-summary.md)

Private UAT/customer review recordings, exact timecodes, access instructions, consent evidence, credentials, and customer-identifying details are Moodle-only unless explicitly sanitized and approved for public release.

## 10. Sprint Retrospective and Reflection

- Reflection: [reflection.md](./reflection.md)
- Retrospective: [retrospective.md](./retrospective.md)
- LLM report: [llm-report.md](./llm-report.md)

## 11. Contribution Traceability

| Team member | GitHub username | Issues / PBIs | PRs / commits | Reviews | Testing / quality / automation | Documentation |
|---|---|---|---|---|---|---|
| Danila Naboishchikov | [Sparta2016840](https://github.com/Sparta2016840) | TBD | TBD | TBD | TBD | TBD |
| Emil Vagizov | [etherealboop](https://github.com/etherealboop) | TBD | TBD | TBD | TBD | TBD |
| Eldar Bayazitov | [rmxqwo](https://github.com/rmxqwo) | TBD | TBD | TBD | TBD | TBD |
| Oleg Korchagin | [privel](https://github.com/privel) | TBD | TBD | TBD | TBD | TBD |

## 12. Required Screenshots

Store sanitized screenshots in `reports/week4/images/` and embed them below when available.

Expected screenshot slots:

| Slot | Expected file | Evidence |
|---|---|---|
| 1 | `images/01_sprint_milestone.png` | Assignment 4 Sprint milestone |
| 2 | `images/02_latest_ci_run.png` | Latest protected-default-branch CI run |
| 3 | `images/03_branch_protection.png` | Branch protection or rules evidence |
| 4 | `images/04_coverage_or_test_report.png` | Coverage or test report |
| 5 | `images/05_additional_qa_check.png` | Additional QA check result |
| 6 | `images/06_semver_release.png` | SemVer release |
| 7 | `images/07_reviewed_issue_linked_pr.png` | Example reviewed issue-linked PR |

Additional Product Backlog, Sprint Backlog, deployed product, or runnable artifact screenshots: TBD.
