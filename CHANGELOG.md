# Changelog

All notable user-visible changes to this project are documented in this file.

## [Unreleased]

### Added

- Added Assignment 3 reporting cleanup and final submission evidence links.
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
- Added Assignment 4 / Week 4 public report structure, evidence index,
  customer-review templates, UAT scenarios, release draft, demo script,
  presentation outline, and Moodle submission template.
- Added Dashboard manual refresh and last-updated feedback through the merged
  Assignment 4 Dashboard refresh PR.

### Changed

- Updated the roadmap to show the current Assignment 4 Sprint, selected PBIs,
  real issue/PR states, and pending release/customer-session work.
- Updated project documentation links to include Week 4 report and UAT
  documentation.

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
- Documented the recognition-agent refresh limitation as a known post-MVP bug instead of hiding it in the delivered scope.

### Known

- The recognition agent currently requires restart or model rebuild after authorized-person changes. This is tracked as [BUG-01 / issue #35](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35).
