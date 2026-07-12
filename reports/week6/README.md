# Week 6 Report — Sprint 4 (FaceGuard, Assignment 6)

**Project:** FaceGuard — real-time face-recognition access & monitoring system for Artyom Tuzóv.

## Sprint 4 Overview

- **Product Backlog board:** [GitHub Project view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/1)
- **Sprint 4 Backlog board:** [GitHub Project Sprint view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/2)
- **Sprint 4 milestone:** [Sprint 4](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/milestone/4)
- **Sprint dates:** 2026-07-06 → 2026-07-13
- **Sprint Goal:** Deliver a stable, customer-trialable release of FaceGuard (Week 6 trial / handover-candidate) with reviewed customer-facing documentation, so the customer can independently try the product and give feedback ahead of final transition in Week 7.
- **Total Sprint 4 size:** 15 Story Points

## Selected PBIs and Scope

| Issue | Title | SP | Implementer | Reviewer | Current status |
| --- | --- | ---: | --- | --- | --- |
| [#69](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/69) | PBI-A6-TRIAL-RELEASE: Deploy the Week 6 trial release | 5 | @privel (Oleg Korchagin) | @rmxqwo | Closed — delivered via [PR #73](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/73) |
| [#70](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/70) | PBI-A6-DOCS: Polish customer-facing documentation for handover | 3 | rmxqwo | @etherealboop | Reviewed — closed via [PR #74](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/74) |
| [#71](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/71) | PBI-A6-WEEK6-EVIDENCE: Prepare Week 6 report and evidence package | 2 | rmxqwo | etherealboop | In progress — this report is being completed now. |
| [#72](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/72) | PBI-A6-ANTISPOOF: Add anti-spoofing / liveness detection to recognition agent | 5 | @privel (Oleg Korchagin) | Danila Naboishchikov ([@Sparta2016840](https://github.com/Sparta2016840)) | Closed — delivered via [PR #73](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/73) |

> Note: GitHub's issue metadata for #72 lists `@etherealboop` as reviewer; the team confirms the actual review was done by Danila Naboishchikov. [TODO: update the GitHub issue's reviewer field to match, or add a comment clarifying, so the public record is consistent with this report.]

## Week 6 Trial-Release Summary

Sprint 4 focused on turning MVP v2 into a customer-trialable handover candidate. #69 (trial release) and #72 (anti-spoofing) were both closed through [PR #73 — "Add Docker Compose and improve face recognition features"](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/73), merged by Danila Naboishchikov (@Sparta2016840). In substance, PR #73 synchronized the fork's `main` with the upstream repository, pulling in upstream MVP v2.0.0 documentation infrastructure (MkDocs, ADRs, architecture diagrams), CI quality gates, and the testing framework, while resolving a merge conflict in `agent/Dockerfile` to preserve the fork's Raspberry Pi camera dependencies and existing antispoofing setup. The antispoofing / liveness-detection capability itself was **preserved through this merge rather than newly built in Sprint 4** — it already existed on the fork beforehand. [TODO: confirm which earlier PR/commit originally introduced the antispoofing model and library, so that work can be credited and its license documented, since #72's acceptance criteria (library/license disclosure, live-vs-spoof test evidence, `docs/quality-requirements.md` / `docs/testing.md` updates) aren't evidenced in PR #73's description.]

- **Product access artifact (trial release):** [TODO: confirm final link — expected at `https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v2.1.0`, following on from the v2.0.0 release cut in Week 5. Please confirm the tag was actually created on `main` before this goes in the final submission.]
- **Access / run instructions:** [TODO link, likely README.md § Access & Running the Product. Note: PR #73's description only mentions `Dockerfile` conflict resolution, not a new `docker-compose.yml` — confirm whether run instructions actually changed before claiming a "Docker Compose" deployment path.]
- **Week 6 SemVer release:** v2.1.0 (next release after Week 5's v2.0.0) — [TODO: confirm tag exists and link it]

## Repository & Documentation Links

- [README.md](../../README.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/customer-handover.md](../../docs/customer-handover.md)
- [Hosted documentation site](https://innopolis-robotics-society.github.io/FaceGuardV1/)
- [docs/roadmap.md](../../docs/roadmap.md)
- [CHANGELOG.md](../../CHANGELOG.md)
- Maintained docs updated this Sprint: [docs/customer-handover.md](../../docs/customer-handover.md) (via #70)

## Customer-Facing Documentation Review

Reviewed with the customer: README.md, docs/customer-handover.md, access/usage instructions, deployment/installation instructions, troubleshooting notes, known limitations.

| Found clear | Found unclear | Found missing |
|---|---|---|
| [TODO — the July 12 customer check-in covered antispoofing/hardware status only, not a documentation walkthrough. A dedicated documentation review with the customer is still needed before this table can be filled in honestly.] | [TODO] | [TODO] |

## Transition-Readiness Summary

As of this draft (July 12, 2026), the Sprint 4 Backlog items are effectively complete: #69 (trial release) and #72 (anti-spoofing) are closed via PR #73, and #71 (this report) is in progress. #70 (documentation polish) has been reviewed by @etherealboop and closed via [PR #74](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/74). A July 12 check-in with the customer confirmed antispoofing is functionally working (~58 FPS locally, ~24 FPS stable on Raspberry Pi) and clarified the hardware access-indicator design (LEDs rather than a motor). However, this check-in did **not** amount to a formal transition-readiness review: no documentation walkthrough, UAT, or explicit trial-acceptance sign-off took place. Instead, the customer assigned additional work — repository cleanup, doc updates, GitHub repo description/tags, and optional GitHub Pages function docs — before the next check-in (Monday). [TODO: a dedicated transition-readiness conversation with the customer, covering documentation review and UAT, is still needed before Sprint 4 can honestly be called trial-ready.]

## Customer Feedback → Resulting PBIs/Issues

| Feedback point | Resulting PBI / Issue | Status |
|---|---|---|
| Access indicator should use LEDs (blue/yellow/red), not the motor-based design already built | [TODO — create issue] | Planned — Oleg to swap and test with customer Monday |
| Repository has unnecessary/inefficient code that should be cleaned up (memory efficiency) | [TODO — create issue] | Planned for Sprint 5 |
| README and setup/run docs need updating | [TODO — create issue] | Planned for Sprint 5 |
| GitHub repo description and tags missing/incomplete | [TODO — create issue] | Planned for Sprint 5 |
| Function-level documentation on GitHub Pages, parsed from code comments | [TODO — create issue] | Stretch goal for Sprint 5 ("if it works out") |

**Feedback not yet addressed:** documentation review, UAT, and formal transition-readiness feedback were not collected in this check-in and remain open — see Transition-Readiness Summary above.

## UAT / Customer-Trial Results

| UAT scenario | Result | Notes |
|---|---|---|
| Antispoofing runs on recognition agent | Informal pass | Oleg demonstrated it running during the July 12 check-in; no formal live-vs-spoof pass/fail count documented yet (see #72 open items). |
| Recognition performance on Raspberry Pi | Informal pass | ~58 FPS locally, stable ~24 FPS on Pi with a brief freeze on detection events — reported by Oleg, not independently verified by the customer in this session. |
| [TODO — remaining scenarios from `docs/user-acceptance-tests.md`, pending a full customer UAT walkthrough] | Pass/Fail | [TODO] |

## Sprint Review & Retrospective

- Sprint Review transcript: [reports/week6/sprint-review-transcript.md](sprint-review-transcript.md) *(or: publication refused — shared privately via Moodle only)*
- Sprint Review summary: [reports/week6/sprint-review-summary.md](sprint-review-summary.md)
- Reflection: [reports/week6/reflection.md](reflection.md)
- Retrospective: [reports/week6/retrospective.md](retrospective.md)
- LLM usage report: [reports/week6/llm-report.md](llm-report.md)

## Current Status & Expected Week 7 Follow-Up

As of this draft (July 12, 2026), Sprint 4 is in its final day. #69 (trial release) and #72 (anti-spoofing) are both **Closed**, both delivered through PR #73, which synced the fork's `main` with upstream MVP v2.0.0 (docs, CI, testing framework) while preserving the fork's existing Raspberry Pi camera and antispoofing setup through a `Dockerfile` conflict resolution. #71 (this evidence report) is **in progress**, being completed now. #70 (documentation polish) has been reviewed by @etherealboop and closed via [PR #74](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/74). Note that #72's original acceptance criteria (disclosed library/license, live-vs-spoof test evidence, `docs/quality-requirements.md` / `docs/testing.md` updates) are not evidenced in PR #73 and are carried forward as an open item — either resolved by end of Sprint 4 or explicitly flagged as Sprint 5 follow-up. The customer meeting happening today will determine what else, if anything, carries into Sprint 5, which per the team's plan is focused on polishing the product and completing transition to the customer rather than new features.

## Contribution Traceability

| Team member | Issues | PRs/MRs | Review activity | Testing | Docs | Transition/Deployment |
|---|---|---|---|---|---|---|
| Emil Vagizov | | | Reviewer on team PRs this Sprint | | | |
| Danila Naboishchikov (@Sparta2016840) | | Merged/closed [#73](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/73) | Reviewer on #72 | | | Deployment (merged trial release + Docker Compose) |
| Oleg Korchagin (@privel) | [#69](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/69), [#72](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/72) | Implementer, [#73](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/73) | | [TODO — live-vs-spoof test evidence not yet documented, see #72 acceptance criteria] | | Implementer, trial release: merged upstream MVP v2.0.0 sync into fork `main`, preserved Raspberry Pi + antispoofing setup through `Dockerfile` conflict resolution |
| rmxqwo | [#70](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/70), [#71](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/71) | Implementer, [#74](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/74) | Reviewer on #69 | | Docs polish (#70), Week 6 report (#71) | |
| etherealboop | | | Reviewer on #70, #71 | | | |

## Evidence Screenshots

<!-- TODO: embed screenshots from reports/week6/images/ here: Sprint 4 milestone, Week 6 release, an example reviewed issue-linked PR/MR, other Week 6 evidence. -->
