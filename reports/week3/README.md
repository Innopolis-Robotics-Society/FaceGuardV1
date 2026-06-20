# Week 3 Report - FaceGuard

## 1. Project and License

FaceGuard is an access-control system for restricted rooms and protected areas. It combines an administrator web interface, a central backend service, and a device-side camera agent.

License: [MIT License](../../LICENSE)

## 2. MVP v1 Scope and Change Since Assignment 2

Assignment 2 defined the initial MVP v1 scope as US-01, US-02 and US-03. During Assignment 3 backlog refinement, the team identified that a real camera connection was necessary to deliver a coherent end-to-end FaceGuard increment. The proposed expanded scope adds US-11, View connected entrance camera, while preserving the historical Week 2 artifact. Low-light recognition, anti-spoofing, physical door control and guaranteed recognition accuracy remain outside the mandatory MVP v1 scope unless separately completed and verified.

Current index: [docs/user-stories.md](../../docs/user-stories.md)

## 3. Customer Feedback from Assignment 2 Addressed

- The two-outcome access model from the Week 2 customer discussion remains the working model: authorized people are granted access, unknown people are denied access.
- Revoked access should remove a person from the authorized list rather than introduce a separate blocked identity state.
- Anti-spoofing is deferred beyond the core MVP v1 commitment unless separately completed and verified.
- [TODO: document which feedback points were actually implemented in MVP v1 after verification]

## 4. Historical Week 2 User Stories

[reports/week2/user-stories.md](../week2/user-stories.md)

## 5. Current User-Story Index

[docs/user-stories.md](../../docs/user-stories.md)

## 6. Product Backlog View

[TODO: GitHub Project Product Backlog view link]

## 7. Sprint Backlog View

[TODO: GitHub Project Sprint Backlog view link]

## 8. Sprint Milestone, Dates and Sprint Goal

Milestone: [Sprint 1](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/milestone/1)

- Start date: [TODO]
- Finish date: [TODO]
- Sprint Goal: [TODO: define in milestone description and mirror summary here]

## 9. Product Backlog Story Point Total

[TODO: total Product Backlog SP after team estimation]

## 10. Current Sprint Story Point Total

[TODO: total current Sprint SP after team estimation]

## 11. MVP Version Grouped or Filtered View

[TODO: GitHub Project MVP version grouped or filtered view link]

## 12. Selected MVP v1 Scope

- [US-01: View all people with access](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/13)
- [US-02: Add a person to the access list](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/14)
- [US-03: View system dashboard](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/15)
- US-11: View connected entrance camera - [TODO: issue link]
- Supporting PBIs for central backend, database, device agent, camera integration, deployment, smoke testing, and release - [TODO: issue links]

## 13. PBI Types, Statuses, Priorities, Milestone and Decomposition

The Product Backlog should use issue-based PBIs with these visible fields: Type, Work Status, MoSCoW priority, Story Points, MVP version, milestone, assignee, and reviewer. User stories preserve stable IDs such as `US-01`; supporting PBIs link back to their parent user stories.

Course Tasks are tracked separately when useful, but they do not count toward the minimum 15 qualifying PBIs. Current Sprint items must have acceptance criteria before they can be treated as Ready. MVP v1 items require at least three acceptance criteria and evidence before they can be marked Done.

## 14. Roadmap Summary

The current roadmap focuses MVP v1 on the administrator flow plus real camera visibility. MVP v2 should expand toward low-light evaluation, scanner signals, service monitoring, remote-access hardening, access-event workflow, and recognition calibration.

Roadmap: [docs/roadmap.md](../../docs/roadmap.md)

## 15. Acceptance and Verification Evidence

- [TODO: PR links with acceptance-criteria verification tables]
- [TODO: test logs or smoke-check links]
- [TODO: deployment/runtime evidence]

## 16. Current Product Status

The repository contains MVP v0 frontend evidence from Week 2 and implementation directories for the central backend and device-side agent. MVP v1 must not be treated as delivered until the selected PBIs are completed, reviewed, verified, released, and linked here.

## 17. Next Steps

- Create US-11 and all required supporting PBIs.
- Fill Project fields and Sprint metadata.
- Complete MVP v1 implementation through issue-linked PRs.
- Verify acceptance criteria and update this report with evidence.
- Prepare customer review, release, deployment/access link, and under-two-minute public demo.

## 18. Contribution Traceability

| Team member | GitHub username | Issues / PBIs | PRs | Reviews and meaningful comments |
|---|---|---|---|---|
| [TODO] | [TODO] | [TODO] | [TODO] | [TODO] |
| [TODO] | [TODO] | [TODO] | [TODO] | [TODO] |
| [TODO] | [TODO] | [TODO] | [TODO] | [TODO] |

## 19. SemVer Release

[TODO: MVP v1 SemVer release link]

## 20. Changelog

[CHANGELOG.md](../../CHANGELOG.md)

## 21. Process Requirements

[TODO: Process_Requirements.md course location]

## 22. Definition of Done and Roadmap

- [docs/definition-of-done.md](../../docs/definition-of-done.md)
- [docs/roadmap.md](../../docs/roadmap.md)

## 23. Issue Templates and PR Template

- [User Story template](../../.github/ISSUE_TEMPLATE/user-story.md)
- [Other PBI template](../../.github/ISSUE_TEMPLATE/other-pbi.md)
- [Course Task template](../../.github/ISSUE_TEMPLATE/course-task.md)
- [Bug Report template](../../.github/ISSUE_TEMPLATE/bug-report.md)
- [Pull Request template](../../.github/pull_request_template.md)

## 24. Week 3 Reviewed PR Links

[TODO: reviewed issue-linked Week 3 PR links]

## 25. Deployment / Access Point

[TODO: delivered MVP v1 deployment, runnable artifact, or equivalent access point]

## 26. Root Run Instructions

[README.md](../../README.md)

## 27. Under-Two-Minute Public Demo

[TODO: public sanitized demo video link shorter than two minutes]

## 28. Required Screenshots from `images/`

- Product Backlog view: [TODO: add screenshot to `reports/week3/images/`]
- Sprint Backlog view: [TODO: add screenshot to `reports/week3/images/`]
- Sprint milestone: [TODO: add screenshot to `reports/week3/images/`]
- MVP version field, grouped view, or filtered view: [TODO: add screenshot to `reports/week3/images/`]
- SemVer release: [TODO: add screenshot to `reports/week3/images/`]
- Delivered MVP v1: [TODO: add screenshot to `reports/week3/images/`]
- Example reviewed issue-linked PR/MR: [TODO: add screenshot to `reports/week3/images/`]

## 29. Customer Review Transcript / Notes Handling

No Week 3 transcript or notes file has been committed yet. Before the customer review, ask for recording permission and publication/private-sharing permission. Commit `customer-review-transcript.md` only if public publication is permitted. If public publication is refused but private instructor sharing is permitted, share the sanitized transcript only through Moodle or the approved private channel. If recording or private sharing is refused, create sanitized chronological notes in `customer-review-notes.md`.

## 30. Customer Review Summary

[customer-review-summary.md](./customer-review-summary.md)

## 31. Reflection

[reflection.md](./reflection.md)

## 32. Retrospective

[retrospective.md](./retrospective.md)

## 33. LLM Report

[llm-report.md](./llm-report.md)
