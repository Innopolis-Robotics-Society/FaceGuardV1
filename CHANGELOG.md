# Changelog

All notable user-visible changes to this project are documented in this file.

## [Unreleased]

## [v2.0.0] - 2026-07-04

### Added

- Added Sprint 3 / Assignment 5 architecture documentation with static, dynamic, and
  deployment views plus three ADRs.
- Added development-process and configuration-management documentation.
- Added MVP v2 recognition-score helper tests for threshold semantics and UI
  distance presentation.
- Added MkDocs configuration and Week 5 public report structure.
- Added sanitized Week 5 Sprint Review notes, summary, transcript, and UAT
  status updates from the July 4 customer session.
- Marked reviewed and merged Assignment 5 PBIs, BUG-01, BUG-02, and US-05 as
  closed in the public status documentation.
- Added Week 5 screenshot evidence for hosted documentation, CI/pages,
  reviewed PR #65, release v2.0.0, architecture documentation, Access Logs
  confidence display, and Live Camera offline state.
- Added Sprint milestone and GitHub Project board screenshots plus the public
  sanitized MVP v2 demo link.
- Added System service-status screenshot evidence for US-05.

### Changed

- Updated recognition-score UI wording to display OpenCV LBPH output as raw
  match distance where lower is better.
- Updated quality, testing, Definition of Done, UAT, roadmap, and root README
  traceability for Sprint 3 / Assignment 5.

## [v1.1.0] - 2026-06-28

### Added

- Added Assignment 3 reporting cleanup and final submission evidence links.
- Added Access Logs integration with detailed event data, search,
  date/status filtering, newest-first ordering, CSV export, and 25-item
  pagination.
- Added editing support for authorized-person names, notes, and reference
  photographs.
- Added safer authorized-person removal with a warning, confirmation step,
  immediate removal feedback, and automatic list refresh after edits or
  removals.
- Added Dashboard manual refresh, loading state, and last-updated feedback.
- Added measurable Assignment 4 quality requirements for health endpoint
  performance, administrator identity rejection, and person-name validation.
- Added automated Quality Requirement Tests linked to the documented quality
  requirements.
- Added backend unit and integration testing baseline for critical security,
  system API, and validation behaviour.
- Added per-critical-module coverage enforcement for the documented 30% line
  coverage threshold.
- Added GitHub Actions quality gates for frontend build, backend Ruff lint,
  tests with coverage, QRTs, and Docker Compose validation.
- Added Assignment 4 / Week 4 public report structure, embedded screenshot
  evidence, customer-review summary and transcript, UAT scenarios, release
  notes, reflection, retrospective, and LLM usage report.
- Added sanitized Week 4 customer review transcript, review notes, review
  summary, UAT evidence updates, and customer feedback response entries based
  on the June 28, 2026 customer session.
- Added the Week 4 project presentation video link to the Assignment 4 report
  evidence:
  https://drive.google.com/file/d/1sdwue996O--n4EDrhZsA01T88WiFIMfv/view?usp=sharing
- Added customer confirmation evidence approving the checked user stories.

### Changed

- Updated the roadmap to show the current Assignment 4 Sprint, selected PBIs,
  real issue/PR states, completed customer review, published release,
  private-network deployment, and customer scenario confirmation.
- Updated project documentation links to include Week 4 report and UAT
  documentation.
- Removed a generated frontend archive from the repository tree.

## [v1.0.0] - 2026-06-21

### Added

- Added MVP v1 administrator registration/login flow for protected access to the admin panel.
- Added persistent authorized-person storage through the central backend and database.
- Added backend-connected People page data instead of relying on the MVP v0 mock people list.
- Added add-person flow with reference-photo support.
- Added authorized-person removal through the web interface.
- Added camera image/status visibility in the web application.
- Added recognition/access event storage for dashboard and recent-activity use.
- Added dashboard metrics, recent activity, and charts backed by backend data.
- Added supporting Product Backlog Items for MVP v1 scope and verification.
- Added Week 3 customer review transcript, summary, reflection, retrospective, and reporting updates.

### Changed

- Updated the current user-story index to include US-11 and mark the selected MVP v1 stories as completed.
- Updated the roadmap to reflect the delivered MVP v1 increment and next Sprint follow-up work.
- Replaced Week 3 report placeholders with PR, issue, backlog, and customer-review evidence where available.

### Fixed

- Fixed stale report links that pointed to missing repository files.
