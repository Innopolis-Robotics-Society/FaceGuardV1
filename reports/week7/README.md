# Week 7 Report - Sprint 5 / Assignment 6 Finalization

**Project:** FaceGuard - face-recognition access monitoring and local scanner feedback.
**Report status:** public finalization package updated after the July 19, 2026 final customer handover review.

## Required Links

- Week 6 report: [reports/week6/README.md](../week6/README.md)
- Product Backlog board: [GitHub Project view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/1)
- Sprint 5 Backlog board: [GitHub Project Sprint view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/2)
- Sprint 5 milestone: not publicly linked in this repository report; add the link if a maintainer creates it through GitHub.
- Current product access artifact: [v2.1.0 trial release](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v2.1.0) plus the Week 7 technical finalization update.
- Run/access instructions: [README.md](../../README.md)
- Contributor guide: [CONTRIBUTING.md](../../CONTRIBUTING.md)
- Agent guidance: [AGENTS.md](../../AGENTS.md)
- Customer handover: [docs/customer-handover.md](../../docs/customer-handover.md)
- Hosted documentation: [FaceGuard documentation](https://innopolis-robotics-society.github.io/FaceGuardV1/)
- Roadmap: [docs/roadmap.md](../../docs/roadmap.md)
- Changelog: [CHANGELOG.md](../../CHANGELOG.md)
- Sprint Review notes: [sprint-review-notes.md](sprint-review-notes.md)
- Sprint Review summary: [sprint-review-summary.md](sprint-review-summary.md)
- Final customer acceptance summary: [final-customer-acceptance-summary.md](final-customer-acceptance-summary.md)
- Reflection: [reflection.md](reflection.md)
- Retrospective: [retrospective.md](retrospective.md)
- LLM usage report: [llm-report.md](llm-report.md)

## Sprint 5 Goal, Dates, and Scope

- **Sprint dates:** 2026-07-14 to 2026-07-19 target window.
- **Sprint Goal:** close the Week 6 handover blockers, document the final transition state, update the repository entry point, and prepare FaceGuard for MVP v3 final release.
- **Total selected size:** 11 Story Points across the visible Sprint 5 follow-up issues.

| Issue | Title | SP | Status in this report |
| --- | --- | ---: | --- |
| [#75](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/75) | LED-based access indicator | 2 | Implemented in agent code and documented; local syntax smoke passed on July 19; final handover accepted; separate physical LED evidence remains useful if available. |
| [#76](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/76) | Repository cleanup and memory-efficiency review | 3 | Initial cleanup done: unused imports removed, SQLite cleanup retention fixed; wider profiling remains optional. |
| [#77](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/77) | README and setup/run documentation | 2 | README, handover, contributor guide, agent guide, testing, roadmap, and changelog updated. |
| [#78](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/78) | GitHub repository description and tags | 1 | Blocked by repository settings/admin access; cannot be completed by code commit alone. |
| [#79](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/79) | Function-level documentation on GitHub Pages | 3 | Lightweight public code reference added and linked from MkDocs. |

## Week 7 Follow-Up Maintenance and MVP v3 Candidate Changes

- Replaced the legacy servo/motor access path in `agent/door/door_controller.py`
  with the customer-requested LED indicator states:
  - blue/granted;
  - yellow/calibrating/operator attention;
  - red/denied or unknown.
- Preserved the existing backend command contract by keeping `open_door` as a
  backward-compatible granted-signal command.
- Added LED GPIO configuration to `agent/core/config.py` and `agent/.env.example`.
- Updated unknown and denied event handling to trigger the red LED signal.
- Fixed agent SQLite cleanup so the configured retention `days` value is used.
- Reworked the public README and handover docs for the actual Week 7 technical
  finalization state.
- Added `CONTRIBUTING.md`, `AGENTS.md`, and `docs/code-reference.md`.
- Added `QR-USE-002` and a manual QRT for LED signal validation.

## Final Transition Outcome

**Handover level reached:** Accepted for independent local/private-network use.
**Customer-confirmation status:** Accepted during the recorded July 19, 2026 final handover review.

What is available:

- source repository and release history;
- hosted documentation;
- local/private-network run path;
- backend/frontend/agent setup instructions;
- LED indicator implementation and configuration;
- handover, troubleshooting, and known limitations.
- recorded customer acceptance of the final handover package.

What is not publicly evidenced:

- customer-side production deployment or operation;
- final MVP v3 GitHub release after this finalization work;
- public sanitized MVP v3 demo video;
- private credentials/access instructions.

Raw recordings, exact access details, private credentials, and any private
customer evidence belong in the Week 7 Moodle/customer package unless the
customer separately approves publication.

## Customer Feedback Response Table

| Feedback / blocker from Week 6 | Response in Week 7 | Remaining action |
| --- | --- | --- |
| Access indicator should be LED-based, not motor-based | Implemented LED controller and documented blue/yellow/red mapping; syntax smoke passed on July 19 | Capture physical Raspberry Pi LED evidence if available. |
| README/setup docs need updating | README and handover entry points rewritten; MkDocs strict build passed on July 19 | Customer confirmed the handover file and repository were sufficient. |
| Repository cleanup / memory efficiency | Removed unused imports and fixed SQLite cleanup retention bug | Optional deeper profiling on target Pi. |
| Add GitHub repo description/tags | Documented as blocked by repo settings access | Maintainer/admin must update GitHub Settings and Topics. |
| Function-level docs on GitHub Pages | Added public code reference and MkDocs nav entry | Optionally automate generation later if dependencies are approved. |

## Week 7 UAT / Trial Results

| Scenario | Result | Evidence status |
| --- | --- | --- |
| LED access indicator syntax path | Passed on July 19: `python -B -m py_compile agent/core/config.py agent/door/door_controller.py agent/events/event_handler.py` | Local syntax evidence available; does not replace hardware validation. |
| LED access indicator on Raspberry Pi | Not publicly evidenced | Needs hardware/customer evidence. |
| Documentation build | Passed on July 19: `mkdocs build --strict --site-dir C:\tmp\faceguard-mkdocs-check` | Public docs source builds successfully. |
| Backend Docker Compose config | Not completed locally on July 19 because the Docker CLI was unavailable in PATH | Re-run in an environment with Docker before final release evidence. |
| README/handover usability | Updated in repository | Customer confirmed the provided file and repository were sufficient. |
| Final customer transition confirmation | Passed in the July 19 recorded final handover review | Keep raw recording/protocol/transcript in the private evidence package unless publication is separately approved. |

## Final Release and Demo Video

- Final SemVer release mapped to MVP v3: still pending; cut it after the Week 7
  technical finalization update is pushed/merged to protected `main`.
- Public sanitized MVP v3 demo video: still pending; existing public sanitized
  demo video remains the MVP v2 demo linked from the root README.

## Demo Day Preparation

Public repository work now provides the main links needed for a Demo Day slide:

- product context and final state: [README.md](../../README.md);
- roadmap and MVP progression: [docs/roadmap.md](../../docs/roadmap.md);
- handover status and known limitations: [docs/customer-handover.md](../../docs/customer-handover.md);
- code/architecture entry points: [docs/architecture/README.md](../../docs/architecture/README.md) and [docs/code-reference.md](../../docs/code-reference.md).

Slides, rehearsal video, private presentation recordings, and exact access
details must remain in Moodle/private channels.

## Final Product Status

FaceGuard is a customer-accepted local/private-network MVP v3 handover package.
The strongest remaining gaps are not ordinary code gaps: they are physical
hardware evidence, final release publication, public sanitized MVP v3 demo
publication, and GitHub repository metadata that requires admin access.

## Contribution Traceability

| Contributor | Work evidenced in this report |
| --- | --- |
| @privel | Week 6 anti-spoofing / Raspberry Pi work referenced from v2.1.0; expected hardware owner for LED confirmation. |
| rmxqwo | Week 6 documentation/evidence issue owner; Sprint 5 issue creation/coordination visible in GitHub. |
| @Sparta2016840 | Prior reviewer/merger for Week 6 integration and release work; led the July 19 final customer handover review. |
| etherealboop | Week 6 docs review. |
| Team reviewer | Week 6 team review participation. |
| Codex | July 17 repository synchronization, LED implementation, documentation cleanup, Week 7 report drafting, and July 19 report-only status update. |

## Evidence Screenshots

`reports/week7/images/` is reserved for public screenshots. Add only real
screenshots for the final release, Sprint 5 board/milestone, final customer
acceptance evidence, LED hardware confirmation if available, CI checks, and
hosted docs after those artifacts exist.
