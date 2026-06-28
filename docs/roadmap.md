# Roadmap

This roadmap summarizes the current product direction. The detailed Product
Backlog is maintained in GitHub Issues and GitHub Project views.

## Current Sprint - Assignment 4

- Sprint title: Sprint 2 - Increment
- Start date: June 22, 2026
- End date: June 29, 2026
- Milestone: [Sprint 2 - Increment](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/milestone/2)
- Product Backlog: [GitHub Project view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/1)
- Sprint Backlog: [GitHub Project Sprint view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/2)
- Latest evidence date: June 28, 2026

### Sprint Goal

Improve the FaceGuard administrator experience by completing access-log review,
making person removal safer, adding clear Dashboard refresh feedback, and
introducing automated quality requirements, tests, coverage enforcement, and CI
quality gates.

### Selected Sprint PBIs

| PBI | Expected outcome | SP | Implementer | Reviewer | Current status | Linked PR | Merge status |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| [#21 - US-09: Review access-attempt events](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/21) | Administrators can review access attempts with timestamp, result, person or Unknown, device/location, date and status filtering, newest-first ordering, and 25 item pagination. | 3 | [etherealboop](https://github.com/etherealboop) | [rmxqwo](https://github.com/rmxqwo) | In Review | [PR #50](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/50) | Pending Merge; PR is open and not delivered to `main`. |
| [#22 - US-10: Edit or remove authorized people](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/22) | Administrators can edit person details and safely remove a person with typed `DELETE` confirmation and immediate list feedback. | 3 | [rmxqwo](https://github.com/rmxqwo) | Not Yet Available | In Review | [PR #51](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/51) | Pending Review and Pending Merge; PR is open and not delivered to `main`. |
| [#47 - PBI-A4-16: Add manual Dashboard refresh and last-updated feedback](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/47) | Dashboard has a compact manual refresh action, refresh loading feedback, and a readable last-updated time without reloading the page. | 1 | [privel](https://github.com/privel) | [Sparta2016840](https://github.com/Sparta2016840) | Delivered | [PR #52](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/52) | Merged to `main` on June 28, 2026. |
| [#48 - PBI-A4-QA: Define and automate FaceGuard quality gates](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/48) | FaceGuard has measurable quality requirements, automated QRTs, backend unit and integration tests, critical-module coverage gates, and CI quality jobs. | 3 | [Sparta2016840](https://github.com/Sparta2016840) | [privel](https://github.com/privel) | In Review | [PR #49](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/49) | Pending Merge; PR is approved but not delivered to `main`. |

### Current Sprint Status

- Selected scope total: 10 Story Points.
- Delivered to `main`: #47, 1 Story Point.
- In Review or Pending Merge: #21, #22, #48, 9 Story Points.
- Customer review and UAT: Pending Customer Session.
- Assignment 4 release: Pending completion and merge of the selected Sprint
  increment.

Open PRs are not counted as delivered work until they are merged into `main`.
Successful PR CI is not counted as protected-main CI evidence.

## Next Sprint

Likely follow-up scope after Assignment 4:

- [#35 - BUG-01: Recognition agent requires restart after authorized-person changes](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35).
- Broader authentication and role-authorisation testing.
- Real PostgreSQL integration tests for database-dependent backend paths.
- Frontend component tests for Dashboard, Access Logs, and People flows.
- Production-like performance verification outside FastAPI TestClient.
- Camera and recognition quality testing with representative hardware.
- Further CI and security hardening, including dependency auditing and stricter
  branch protection evidence.

## Quality and Automation Continuation

The Assignment 4 quality requirements, QRTs, coverage threshold, and CI jobs are
maintained project assets. They should be extended when new critical modules are
added, when user-facing workflows become more mature, or when the team starts
testing with real PostgreSQL, camera hardware, and production-like network
paths.

## Risks and Decision Gates

- PR #50 and PR #51 remain open; their user stories are not delivered until
  merged.
- PR #51 currently includes a generated/binary archive in the changed-file list;
  this should be removed before merge unless there is a documented reason.
- Latest `main` link-check evidence is failing after PR #52, so protected-main
  evidence is not complete.
- Branch protection details beyond the public ruleset require repository-owner
  evidence because the branch protection API returned `Requires authentication`.
- Customer Review, UAT execution, deployment verification, demo recording, and
  Assignment 4 release are still pending.
