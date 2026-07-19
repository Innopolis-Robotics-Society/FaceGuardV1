# Week 6 Report - Sprint 4 Trial Release

**Project:** FaceGuard - real-time face-recognition access and monitoring
system for the customer representative.
**Report status:** post-deadline overview updated on July 19, 2026.

## Sprint 4 Overview

- Product Backlog board: [GitHub Project view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/1)
- Sprint 4 Backlog board: [GitHub Project Sprint view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/2)
- Sprint 4 milestone: [Sprint 4](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/milestone/4)
- Sprint dates: 2026-07-06 to 2026-07-13
- Sprint Goal: deliver a customer-trialable handover-candidate release with
  customer-facing documentation, so Week 7 can focus on transition and final
  fixes.
- Total Sprint 4 size: 15 Story Points

## Selected PBIs and Scope

| Issue | Title | SP | Implementer | Reviewer | Current status |
| --- | --- | ---: | --- | --- | --- |
| [#69](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/69) | PBI-A6-TRIAL-RELEASE: Deploy the Week 6 trial release | 5 | @privel | @rmxqwo | Closed via [PR #73](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/73) |
| [#70](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/70) | PBI-A6-DOCS: Polish customer-facing documentation for handover | 3 | rmxqwo | @etherealboop | Closed via [PR #74](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/74) |
| [#71](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/71) | PBI-A6-WEEK6-EVIDENCE: Prepare Week 6 report and evidence package | 2 | rmxqwo | etherealboop | Closed in Week 6 report package |
| [#72](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/72) | PBI-A6-ANTISPOOF: Add anti-spoofing / liveness detection to recognition agent | 5 | @privel | Danila Naboishchikov | Closed via [PR #73](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/73); model/license and formal test evidence carried into Week 7 |

## Week 6 Trial-Release Summary

Sprint 4 produced the [v2.1.0 trial release](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v2.1.0). The release integrated the fork with upstream MVP v2.0.0 assets while preserving the fork-specific Raspberry Pi camera and anti-spoofing setup.

The anti-spoofing / liveness capability was demonstrated as functionally
working during the July 12 customer technical check-in, with reported
performance around 58 FPS locally and 24 FPS on Raspberry Pi. The public record
does not include final license disclosure or formal live-vs-spoof pass/fail
evidence, so that evidence remains a Week 7 follow-up item.

Access/run instructions now live in the root [README.md](../../README.md) and
agent [SETUP.md](../../agent/SETUP.md).

## Repository and Documentation Links

- [README.md](../../README.md)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/customer-handover.md](../../docs/customer-handover.md)
- [Hosted documentation site](https://innopolis-robotics-society.github.io/FaceGuardV1/)
- [docs/roadmap.md](../../docs/roadmap.md)
- [CHANGELOG.md](../../CHANGELOG.md)
- [docs/testing.md](../../docs/testing.md)
- [docs/quality-requirements.md](../../docs/quality-requirements.md)
- [docs/user-acceptance-tests.md](../../docs/user-acceptance-tests.md)

## Customer-Facing Documentation Review

The July 12 meeting was a narrow technical check-in, not a complete
documentation walkthrough. The public repository does not contain evidence that
the customer reviewed and accepted README, handover, access, deployment,
troubleshooting, and known-limitation docs during Week 6.

This gap is carried into Week 7 as final customer handover confirmation.

## Transition-Readiness Summary

Week 6 reached a trial/handover-candidate state, but not a fully confirmed
transition state. The customer check-in confirmed useful technical progress and
surfaced important follow-up work:

- replace the motor-based access indicator assumption with LED states;
- clean up repository/setup docs;
- add GitHub repository metadata if the team has settings access;
- consider function-level documentation on GitHub Pages;
- document anti-spoofing source/license and formal validation evidence.

## Customer Feedback to Follow-Up Issues

| Feedback point | Resulting issue | Week 7 status |
| --- | --- | --- |
| Access indicator should use LEDs: blue/yellow/red | [#75](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/75) | Implemented in Week 7 code/docs; local syntax smoke passed on July 19; hardware/customer confirmation still needed. |
| Repository has unnecessary/inefficient code and docs gaps | [#76](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/76), [#77](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/77) | Initial cleanup and docs refresh done. |
| GitHub repo description and tags missing | [#78](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/78) | Requires repository admin/settings access. |
| Function-level documentation on GitHub Pages | [#79](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/79) | Lightweight code reference added and linked from MkDocs. |
| Anti-spoofing source/license and formal test evidence | [#72](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/72) | Still needs final evidence. |

## UAT / Customer-Trial Results

| UAT scenario | Result | Notes |
| --- | --- | --- |
| Anti-spoofing runs on recognition agent | Informal pass | Demonstrated during July 12 technical check-in; formal live-vs-spoof evidence not public. |
| Recognition performance on Raspberry Pi | Informal pass | Reported stable around 24 FPS on Pi, with a brief freeze on detection events. |
| Full customer documentation review | Not evidenced | Carried into Week 7. |
| Full transition-readiness sign-off | Not evidenced | Carried into Week 7. |

## Sprint Review and Retrospective

- Sprint Review transcript: [reports/week6/sprint-review-transcript.md](sprint-review-transcript.md)
- Sprint Review summary: [reports/week6/sprint-review-summary.md](sprint-review-summary.md)
- Reflection: [reports/week6/reflection.md](reflection.md)
- Retrospective: [reports/week6/retrospective.md](retrospective.md)
- LLM usage report: [reports/week6/llm-report.md](llm-report.md)

## Current Product Status After Week 6

After Week 6, FaceGuard had a trial release and promising anti-spoofing/Raspberry
Pi progress, but the handover was incomplete. Week 7 technical follow-up work
addressed the LED indicator, repository cleanup, reporting/documentation
alignment, and final customer handover acceptance. Remaining non-code evidence
after the July 19 final review is physical hardware evidence if available,
final release publication, and final public/private evidence packaging.

## Contribution Traceability

| Team member | Issues | PRs/MRs | Review/testing/docs/transition work |
| --- | --- | --- | --- |
| Emil Vagizov | Team review participation | - | Reviewer on team PRs this Sprint. |
| Danila Naboishchikov (@Sparta2016840) | #72 review / release support | Merged [PR #73](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/73) | Trial release integration support and review. |
| Oleg Korchagin (@privel) | [#69](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/69), [#72](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/72) | [PR #73](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/73) | Trial release, Raspberry Pi and anti-spoofing work. |
| rmxqwo | [#70](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/70), [#71](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/71) | [PR #74](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/74) | Documentation polish and Week 6 evidence. |
| etherealboop | #70/#71 review | - | Documentation review. |

## Evidence Screenshots

`reports/week6/images/` exists for public screenshot evidence. Week 6 public
links should be used as canonical evidence where screenshots are absent.
