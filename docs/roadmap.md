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
| [#21 - US-09: Review access-attempt events](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/21) | Administrators can review access attempts with timestamp, result, person or Unknown, device/location, date and status filtering, newest-first ordering, and 25 item pagination. | 3 | [etherealboop](https://github.com/etherealboop) | [rmxqwo](https://github.com/rmxqwo) | Delivered | [PR #50](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/50) | Merged to `main` on June 28, 2026. |
| [#22 - US-10: Edit or remove authorized people](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/22) | Administrators can edit person details and safely remove a person with typed `DELETE` confirmation and immediate list feedback. | 3 | [rmxqwo](https://github.com/rmxqwo) | [etherealboop](https://github.com/etherealboop) | Delivered | [PR #51](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/51) | Merged to `main` on June 28, 2026. |
| [#47 - PBI-A4-16: Add manual Dashboard refresh and last-updated feedback](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/47) | Dashboard has a compact manual refresh action, refresh loading feedback, and a readable last-updated time without reloading the page. | 1 | [privel](https://github.com/privel) | [Sparta2016840](https://github.com/Sparta2016840) | Delivered | [PR #52](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/52) | Merged to `main` on June 28, 2026. |
| [#48 - PBI-A4-QA: Define and automate FaceGuard quality gates](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/48) | FaceGuard has measurable quality requirements, automated QRTs, backend unit and integration tests, critical-module coverage gates, and CI quality jobs. | 3 | [Sparta2016840](https://github.com/Sparta2016840) | [privel](https://github.com/privel) | Delivered | [PR #49](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/49) | Merged to `main` on June 28, 2026. |

### Current Sprint Status

- Selected scope total: 10 Story Points.
- Delivered to `main`: #21, #22, #47, and #48, 10 Story Points.
- In Review or Pending Merge: none in the selected Sprint scope at the time of
  this update.
- Customer review: completed on June 28, 2026.
- UAT: demonstrated during the customer review and confirmed by the customer
  in follow-up written feedback.
- Assignment 4 release: [v1.1.0](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v1.1.0)
  is published.
- Deployment: available at `http://10.93.26.183:5173/` on the Innopolis
  University private network.
- Protected-main CI:
  [quality gates run](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056)
  passed after a push to `main`.
- Protected-main evidence includes the
  [Quality requirement tests job](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056/job/83922995234),
  [Backend tests and critical coverage job](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056/job/83922995205),
  [backend coverage artifact](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056/artifacts/7936486952),
  and [Docker Compose validation job](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056/job/83922995206).
- Customer confirmation:
  [Week 4 evidence index](../reports/week4/evidence-index.md) records the
  customer message approving all user stories.

Successful PR CI is tracked separately from protected-main CI evidence. The
selected scope is merged, released, and confirmed by the customer.

## Next Sprint

Likely follow-up scope after Assignment 4:

- Raspberry Pi integration and hardware-oriented deployment work.
- Anti-spoofing research and implementation.
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

- Branch protection evidence currently proves only the visible active ruleset
  applied to `main`, pull request before merge, one required approval,
  conversation resolution, and restricted branch deletion.
- Customer Review was completed on June 28, 2026, and follow-up written
  confirmation approved the checked user stories.
