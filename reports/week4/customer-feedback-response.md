# Customer and Stakeholder Feedback Response

This file separates confirmed customer feedback from course requirements and
team-identified improvements. It does not invent Week 4 feedback because the
Week 4 customer session is still pending.

| ID | Source | Feedback/request | Team decision | PBI/Issue | PR | Status | Explanation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CFR-001 | Customer Review | The Week 3 customer accepted the MVP v1 direction and recommended continuing in the same direction. | Continue building the administrator workflow instead of changing product direction. | Sprint 2 selected scope | Multiple | In Progress | Confirmed in [Week 3 customer review summary](../week3/customer-review-summary.md). |
| CFR-002 | Customer Review | Stabilize and test on Ubuntu before moving further toward Raspberry Pi deployment. | Keep Raspberry Pi deployment as future work and avoid claiming production hardware verification in Week 4. | [#35](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35) | Not Yet Available | Planned | Confirmed in Week 3 customer review summary. |
| CFR-003 | Customer Review | Recognition data refresh after person changes is a known limitation. | Keep the limitation visible and track it as a follow-up bug. | [#35](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35) | Not Yet Available | Planned | The known limitation remains outside the selected Week 4 scope. |
| CFR-004 | Customer Review | Add a practical limit to repeated user-photo capture. | Keep as future backlog work unless selected in a later Sprint. | Not Yet Available | Not Yet Available | Planned | Mentioned in Week 3 customer review summary; no Week 4 implementation PR found. |
| CFR-005 | Course Requirement | Assignment 4 requires measurable quality requirements, QRT traceability, tests, coverage, and CI gates. | Implement QA baseline in PR #49. | [#48](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/48) | [#49](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/49) | Delivered | Course requirement, not customer feedback. |
| CFR-006 | Team Retrospective | Report evidence was updated late in previous work. | Prepare Week 4 report structure before the customer session and final release. | Assignment 4 report | This documentation PR | In Progress | Based on Week 3 retrospective and the merge/report timing observed on June 28, 2026. |
| CFR-007 | Technical Risk | Link-check failures appeared on product PRs and latest `main`; generated ZIP content also reached `main`. | Keep Lychee separate from additional QA, fix broken links before final submission, clean generated artifacts, and do not claim protected-main CI success until rechecked. | Selected Sprint scope | PR #50, PR #51, PR #52 | In Progress | GitHub Actions and repository-tree evidence from June 28, 2026. |
| CFR-008 | Team Retrospective | Dashboard data needed clearer manual refresh feedback. | Implement manual refresh and last-updated state. | [#47](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/47) | [#52](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/52) | Delivered | PR #52 was merged to `main` on June 28, 2026. |
| CFR-009 | Customer Review | Customer could not access the deployment during the Week 4 session. | Verify deployment access path and collect follow-up customer self-test confirmation if required. | Deployment verification | Not Yet Available | Pending Deployment Verification | Confirmed in Week 4 customer review transcript at 00:03:40-00:04:32. |
| CFR-010 | Customer Review | Hardware work and anti-spoofing are important. | Prioritize Raspberry Pi integration, recognition-model improvement, and anti-spoofing in the next Sprint. | Future Sprint scope | Not Yet Available | Planned | Confirmed in Week 4 customer review transcript at 00:08:26-00:09:06. |

## Pending Week 4 Customer Feedback

Status: Customer Review Completed

The table above includes only confirmed feedback from Week 3 and Week 4
customer review evidence. Do not add recording links, credentials, or restricted
deployment details to the public repository.
