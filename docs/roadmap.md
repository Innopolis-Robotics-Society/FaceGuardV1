# Roadmap

This roadmap summarizes the reached course outcome. Detailed backlog records
remain in GitHub Issues, milestones, and the GitHub Project board.

## Current Course Outcome - Assignment 6 / MVP v3 Finalization

- Product Backlog: [GitHub Project view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/1)
- Sprint Backlog view: [GitHub Project Sprint view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/2)
- Week 6 Sprint 4 milestone: [Sprint 4](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/milestone/4)
- Week 6 trial release: [v2.1.0](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v2.1.0)
- Week 6 report: [reports/week6/README.md](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/blob/main/reports/week6/README.md)
- Week 7 finalization report: [reports/week7/README.md](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/blob/main/reports/week7/README.md)
- Latest repository evidence date: July 19, 2026

### Sprint 4 / Week 6 Result

Sprint 4 produced a Week 6 trial/handover-candidate release. The public record
shows:

- upstream MVP v2 documentation, CI, testing, and release assets integrated into
  the fork;
- Raspberry Pi camera and anti-spoofing setup preserved through the integration;
- customer-facing handover documentation started;
- v2.1.0 trial release published;
- a customer technical check-in held on July 12, 2026.

The public Week 6 evidence also records gaps: no full documentation walkthrough,
UAT, or transition-readiness sign-off was evidenced in that meeting.

### Sprint 5 / Week 7 Focus

Sprint 5 is a finalization and maintenance Sprint. The fast, high-value scope is
to close handover blockers rather than add unrelated features:

| Item | Issue | Current status |
| --- | --- | --- |
| LED-based scanner/access indicator | [#75](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/75) | Implemented in agent code and documented for Raspberry Pi GPIO. Customer accepted the final handover; separate physical LED evidence remains useful if available. |
| Repository cleanup and memory-efficiency review | [#76](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/76) | Initial cleanup done: unused imports removed and SQLite cleanup retention bug fixed. Wider profiling remains optional. |
| README/setup documentation | [#77](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/77) | Updated public entry point, handover, contribution, and agent guidance. |
| Repository description/topics | [#78](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/78) | Requires GitHub repository admin/settings access; cannot be completed through a code commit. |
| Function-level documentation | [#79](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/79) | Lightweight public code reference added and linked from MkDocs. |

### Final Product State

FaceGuard is a local/private-network deployable MVP with:

- administrator authentication and People workflow;
- access logs, dashboard, service status, and camera/operator screens;
- FastAPI backend with PostgreSQL persistence;
- device commands, telemetry, offline event buffering, and sync endpoints;
- recognition agent with LBPH recognition, optional DeepFace path, basic
  liveness checks, optional MiniFASNet anti-spoofing, and LED indicator output;
- maintained architecture, testing, quality, UAT, and handover documentation.

The product was accepted by the customer for independent use during the recorded
July 19, 2026 final handover review. The product is still not publicly evidenced
as customer-side production deployed or operated.

## Remaining Open Product Risks

| Risk | Status |
| --- | --- |
| Low-light recognition (#16) | Not fully validated with representative IR/low-light hardware. |
| Scanner decision signal (#18) | LED path implemented; audio feedback remains unevidenced. |
| Admin UI clarity (#19) | UI has been improved across MVP v1/v2, but the original issue remains open in GitHub. |
| Remote management (#20) | Web/API management exists, but production HTTPS/customer-side public deployment is not evidenced. |
| Anti-spoofing evidence | Model/license and formal live-vs-spoof pass/fail evidence still need final publication or private submission evidence. |
| Final acceptance | Customer accepted the final handover for independent use on July 19, 2026. |

## Previous Releases

| Release | Date | Summary |
| --- | --- | --- |
| [v1.0.0](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v1.0.0) | 2026-06-21 | MVP v1 end-to-end access-control foundation. |
| [v1.1.0](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v1.1.0) | 2026-06-28 | Assignment 4 quality gates, Access Logs, People edits/removal, Dashboard refresh. |
| [v2.0.0](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v2.0.0) | 2026-07-04 | MVP v2 recognition-score fixes, system status, docs, architecture, CI. |
| [v2.1.0](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v2.1.0) | 2026-07-12 | Week 6 trial/handover-candidate integration release. |

## Maintenance Policy

For the rest of the course, do not add speculative post-course features to this
roadmap. Keep the roadmap focused on the reached product state, final handover
evidence, release state, and actual unresolved limitations.
