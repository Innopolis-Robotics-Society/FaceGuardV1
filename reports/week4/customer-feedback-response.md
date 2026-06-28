# Customer and Stakeholder Feedback Response

This file separates confirmed customer feedback from course requirements and
team-identified improvements. It uses the Week 4 customer review transcript and
keeps private recording links, credentials, and deployment access details out of
the public repository.

| ID | Source | Feedback/request | Team decision | PBI/Issue | PR | Status | Explanation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CFR-001 | Customer Review | The Week 3 customer accepted the MVP v1 direction and recommended continuing in the same direction. | Continue building the administrator workflow instead of changing product direction. | Sprint 2 selected scope | Multiple | Delivered | Confirmed in [Week 3 customer review summary](../week3/customer-review-summary.md). |
| CFR-005 | Course Requirement | Assignment 4 requires measurable quality requirements, QRT traceability, tests, coverage, and CI gates. | Implement QA baseline in PR #49. | [#48](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/48) | [#49](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/49) | Delivered | Course requirement, not customer feedback. |
| CFR-006 | Team Retrospective | Report evidence was updated late in previous work. | Preserve Week 4 report structure, release evidence, deployment evidence, and screenshot index before submission. | Assignment 4 report | Documentation updates | Delivered | Week 4 report now links the published release, protected-main CI, deployment screenshot, and evidence screenshots. |
| CFR-007 | Technical Risk | Link-check failures appeared on product PRs and latest `main`. | Keep Lychee separate from additional QA and record protected-main quality-gates evidence separately from PR CI. | Selected Sprint scope | PR #50, PR #51, PR #52 | Delivered for quality gates | Protected-main quality workflow passed after a push to `main`: https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056. |
| CFR-008 | Team Retrospective | Dashboard data needed clearer manual refresh feedback. | Implement manual refresh and last-updated state. | [#47](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/47) | [#52](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/52) | Delivered | PR #52 was merged to `main` on June 28, 2026. |
| CFR-009 | Customer Follow-up | Customer confirmed the checked scenario list and approved all user stories. | Preserve the customer confirmation screenshot as UAT evidence. | UAT scenarios | Not required | Delivered | Customer replied: "Everything seems fine. All USs are approved. Continue, you have the right vision." |
| CFR-010 | Customer Review | Hardware work and anti-spoofing are important. | Prioritize Raspberry Pi integration, recognition-model improvement, and anti-spoofing in the next Sprint. | Future Sprint scope | Future PR | Planned | Confirmed in Week 4 customer review transcript at 00:08:26-00:09:06. |

## Confirmed Feedback Scope

Status: Customer Review Completed

The table above includes only confirmed feedback from Week 3 and Week 4
customer review evidence. Do not add recording links, credentials, or restricted
deployment details to the public repository.
