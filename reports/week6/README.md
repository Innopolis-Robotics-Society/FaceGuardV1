# Week 6 Report — Sprint 4 (FaceGuard, Assignment 6)

**Project:** FaceGuard — real-time face-recognition access & monitoring system for [TODO: CUSTOMER_NAME].

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
| [#69](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/69) | PBI-A6-TRIAL-RELEASE: Deploy the Week 6 trial release | [TODO] | [TODO] | [TODO] | [TODO] |
| [#70](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/70) | PBI-A6-DOCS: Polish customer-facing documentation for handover | [TODO] | [TODO] | [TODO] | [TODO] |
| [#71](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/71) | PBI-A6-WEEK6-EVIDENCE: Prepare Week 6 report and evidence package | 2 | rmxqwo | etherealboop | In progress — this report. |
| [#72](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/72) | PBI-A6-ANTISPOOF: Add anti-spoofing / liveness detection to recognition agent | [TODO] | Oleg ([TODO: GitHub username]) | Danila Naboishchikov ([TODO: GitHub username]) | In progress — proved harder than expected; [TODO: current % done / blockers]. |

## Week 6 Trial-Release Summary

Sprint 4 focused on turning MVP v2 into a customer-trialable handover candidate: deploying a Week 6 trial release, polishing the customer-facing documentation set ahead of transition, and adding anti-spoofing / liveness detection to the recognition agent to close a known reliability gap from MVP v2. The anti-spoofing work (#72) was the most demanding item this Sprint. [TODO: 2-4 more sentences — what changed concretely: which docs were touched, what the trial release actually contains, any fixes beyond antispoofing.]

- **Product access artifact (trial release):** [TODO link]
- **Access / run instructions:** [TODO link, likely README.md § Access & Running the Product]
- **Week 6 SemVer release:** [TODO link to tag, e.g. v2.1.0 — not yet cut as of this draft]

## Repository & Documentation Links

- [README.md](../../README.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/customer-handover.md](../../docs/customer-handover.md)
- [Hosted documentation site](https://innopolis-robotics-society.github.io/FaceGuardV1/)
- [docs/roadmap.md](../../docs/roadmap.md)
- [CHANGELOG.md](../../CHANGELOG.md)
- Maintained docs updated this Sprint: [TODO — link the specific docs touched by #70, e.g. customer-handover.md, testing.md]

## Customer-Facing Documentation Review

Reviewed with the customer: README.md, docs/customer-handover.md, access/usage instructions, deployment/installation instructions, troubleshooting notes, known limitations.

| Found clear | Found unclear | Found missing |
|---|---|---|
| [TODO — pending customer review, see Part 5 of Assignment 6] | [TODO] | [TODO] |

## Transition-Readiness Summary

[TODO: is the product complete enough for transition? Sprint 4 is not yet complete (0/4 issues closed as of this draft, antispoofing still in progress) — state honestly whether trial-readiness will be reached by July 13, and what still needs to happen.]

## Customer Feedback → Resulting PBIs/Issues

| Feedback point | Resulting PBI / Issue | Status |
|---|---|---|
| [TODO — pending the Week 6 customer meeting] | [#issue link] | [Planned for Sprint 5 / Won't fix / etc.] |

**Feedback not yet addressed:** [TODO + why]

## UAT / Customer-Trial Results

| UAT scenario | Result | Notes |
|---|---|---|
| [TODO — from docs/user-acceptance-tests.md, pending customer trial] | Pass/Fail | [TODO] |

## Sprint Review & Retrospective

- Sprint Review transcript: [reports/week6/sprint-review-transcript.md](sprint-review-transcript.md) *(or: publication refused — shared privately via Moodle only)*
- Sprint Review summary: [reports/week6/sprint-review-summary.md](sprint-review-summary.md)
- Reflection: [reports/week6/reflection.md](reflection.md)
- Retrospective: [reports/week6/retrospective.md](retrospective.md)
- LLM usage report: [reports/week6/llm-report.md](llm-report.md)

## Current Status & Expected Week 7 Follow-Up

As of this draft (July 12, 2026), Sprint 4 is in its final day with all four Sprint Backlog issues (#69–#72) still open. The anti-spoofing feature (#72) was the hardest item and [TODO: state whether it's done/near-done]. [TODO: 2-3 more sentences on remaining Sprint 4 work and what carries into Sprint 5, which per the team's plan is focused on polishing the product and completing transition to the customer rather than new features.]

## Contribution Traceability

| Team member | Issues | PRs/MRs | Review activity | Testing | Docs | Transition/Deployment |
|---|---|---|---|---|---|---|
| Emil Vagizov | [TODO] | [TODO] | [TODO] | [TODO] | [TODO] | [TODO] |
| Danila Naboishchikov | [TODO — reviewer on #72?] | | [reviewer] | | | |
| Oleg | [#72] | [TODO] | | [TODO] | | [implementer, anti-spoofing] |
| rmxqwo | [#71] | [TODO] | | | [Week 6 report] | |
| etherealboop | | | [reviewer on #71] | | | |

## Evidence Screenshots

*(Embed from `reports/week6/images/`: Sprint 4 milestone, Week 6 release, an example reviewed issue-linked PR/MR, other Week 6 evidence.)*

![Sprint 4 milestone](images/sprint4-milestone.png)
![Week 6 release](images/week6-release.png)
![Example reviewed PR](images/example-pr.png)
