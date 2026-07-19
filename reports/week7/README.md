# Week 7 Report — Assignment 6, Sprint 5 — FaceGuard `MVP v3`

> **Final Assignment 6 submission index.** This report links the complete
> relevant Week 6 evidence instead of duplicating it. Keep this lighter than
> the Week 6 report by focusing on Week 7 follow-up work, final transition
> outcome, and final delivery.

## 1. Project

- **Project:** FaceGuard — MVP access-control system for restricted rooms and
  protected areas.
- **Week 6 report:** [reports/week6/README.md](../week6/README.md)

## 2. Backlog and Sprint Links

| Item | Link |
| --- | --- |
| Product Backlog board/view | [Product Backlog project view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/1) |
| Sprint 5 Backlog board/view | TODO: confirm this is the same board filtered to Sprint 5, or link the correct view |
| Sprint 5 milestone | TODO — paste the Sprint 5 milestone URL (e.g. `.../milestone/N`) |

## 3. Sprint 5 Goal, Dates, Scope

- **Sprint 5 Goal:** TODO — a sentence describing the Week 7 outcome (e.g.
  "close out customer-flagged documentation, discoverability, hardware, and
  code-quality gaps from the Week 6 trial and deliver `MVP v3`")
- **Sprint dates:** TODO (Week 7 start–end)
- **Scope summary:** Documentation accuracy (README/setup docs, function-level
  docs on GitHub Pages), repo discoverability (description/tags), a
  customer-requested hardware change (LED access indicator), and a
  code-quality/memory-efficiency review.
- **Total Sprint 5 size (Story Points):** 11 (2 + 3 + 1 + 3 + 2)

## 4. Week 7 Follow-Up and Final `MVP v3` Changes

**Sprint 5 backlog (all currently milestoned to Sprint 5; status as of last
sync — update as issues close):**

| Issue | Title | Story Points | PR | Status |
| --- | --- | --- | --- | --- |
| [#75](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/75) | PBI-S5-LED-INDICATOR: Swap motor-based access indicator for LED-based design | 2 | TODO | Open |
| [#76](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/76) | PBI-S5-REPO-CLEANUP: Repository cleanup and memory-efficiency review | 3 | TODO | Open |
| [#77](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/77) | PBI-S5-README-DOCS: Update README and setup/run documentation | 2 | [#81](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/81) | PR open |
| [#78](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/78) | PBI-S5-REPO-METADATA: Add GitHub repository description and tags | 1 | TODO | Open |
| [#79](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/79) | PBI-S5-FUNC-DOCS: Publish function-level documentation on GitHub Pages | 3 | TODO | Open |

**Summary of changes (fill in once each issue is closed):**

- **#77 (README/setup docs):** [PR #81](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/81) updates README status/run instructions for v2.1.0, documents the previously-undocumented root `docker-compose.yml`/`DOCKER_SETUP.md` all-in-one stack, and fixes stale links — open, not yet merged
- **#79 (function-level docs on Pages):** stretch goal requested by the
  customer; parses existing code comments into function/module-level docs
  integrated into the existing MkDocs site. TODO — summary once published
- **#78 (repo metadata):** adds a GitHub description + 3–5 topic tags
  (e.g. `face-recognition`, `raspberry-pi`, `fastapi`) for discoverability.
  TODO — confirm final tag list once set
- **#76 (repo cleanup/memory efficiency):** removes unused imports/functions/
  files and fixes memory-heavy patterns flagged by the customer ("written
  nicely but not memory-efficient"). TODO — summary of what was found/fixed
- **#75 (LED access indicator):** replaces the motor-based indicator on pin
  17 with an LED (blue/yellow/red = granted/calibrating/denied), to be tested
  live with the customer. TODO — confirm on-site test result and that
  `docs/customer-handover.md` was updated per the acceptance criteria

> Note: PR #74 ("docs: finalize Week 6 report package and customer-handover
> documentation") is mentioned on both #75 and #79 but was opened before
> Sprint 5 work started — confirm whether it actually closes either issue or
> just references them, and link the real closing PR here once merged.

## 5. Access and Run Instructions

- **Final product access artifact:** TODO — deployed URL, or statement that
  access is via the reproducible run instructions
- **Current access/run instructions:** [README.md](../../README.md#run-the-central-backend)
- **README:** [README.md](../../README.md)
- **CONTRIBUTING:** [CONTRIBUTING.md](../../CONTRIBUTING.md) *(confirm this file exists at repo root)*
- **AGENTS:** [AGENTS.md](../../AGENTS.md) *(confirm this file exists at repo root)*
- **Customer handover doc:** [docs/customer-handover.md](../../docs/customer-handover.md) *(confirm this file exists)*
- **Hosted documentation site:** [FaceGuard documentation](https://innopolis-robotics-society.github.io/FaceGuardV1/)

## 6. Final Transition Outcome

- **Handover level reached** (choose one):
  - `Ready for independent use`
  - `Independently used by customer`
  - `Deployed or operated on customer side`
  - **TODO: which one?**
- **Customer-confirmation status** (choose one):
  - `Accepted`
  - `Accepted with follow-up items`
  - `Not yet accepted`
  - **TODO: which one?**
- **What was transferred/delegated/retained:** TODO — reference
  `docs/customer-handover.md` directly
- **Remaining blockers, limitations, or follow-up items:** TODO

## 7. Customer-Independent Use Evidence

TODO — summary of customer-independent use, customer-side deployment, or
customer-side operation evidence where available.

## 8. Customer Feedback Response Table (Sprint 5 Follow-Up)

| Feedback point (from Week 6 trial) | Resulting PBI/Issue | Status |
| --- | --- | --- |
| TODO | TODO | TODO |

## 9. Week 7 UAT / Customer-Trial Results

TODO — summary of relevant Week 7 UAT or customer-trial results
(`docs/user-acceptance-tests.md`).

## 10. Release and Changelog

- **Final SemVer release (`MVP v3`):** TODO — link to the GitHub release,
  must have higher precedence than `v2.1.0`
- **CHANGELOG:** [CHANGELOG.md](../../CHANGELOG.md)

## 11. Demo Video

- **Public sanitized demo video:** TODO

## 12. Demo Day Preparation

TODO — summary, including a brief note that the required Week 7 rehearsal
preparation was completed.

## 13. Sprint Review

- **Transcript or notes:** TODO — link to
  `reports/week7/sprint-review-transcript.md` (if publication permitted) or
  `reports/week7/sprint-review-notes.md` (if refused), or a statement that
  publication was refused and it's shared via Moodle only.
- **Summary:** [reports/week7/sprint-review-summary.md](sprint-review-summary.md)

## 14. Other Week 7 Reports

- **Reflection:** [reports/week7/reflection.md](reflection.md)
- **Retrospective:** [reports/week7/retrospective.md](retrospective.md)
- **LLM report:** [reports/week7/llm-report.md](llm-report.md)

## 15. Final Product Status

TODO — summary of the final product status.

## 16. Contribution Traceability

| Team member | Issues | PRs/MRs | Review | Testing | Documentation | Transition/Deployment | Demo Day prep |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TODO | | | | | | | |

## 17. Screenshots

Embedded screenshots from `reports/week7/images/` — Sprint milestone, final
release, final product access/deployment evidence, an example reviewed
issue-linked PR, and other inspectable Week 7 evidence.

TODO — add images to `reports/week7/images/` and embed them here, e.g.:

```markdown
![Sprint 5 milestone](images/sprint5-milestone.png)
```
