# Release Notes - v1.1.0

Status: Published GitHub Release.

## Version

- Version: `v1.1.0`
- Title: `FaceGuard v1.1.0 — Assignment 4 Sprint Increment`
- Release type: Assignment 4 / Sprint 2 increment
- Release URL: https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v1.1.0

## Milestone

- [Sprint 2 - Increment](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/milestone/2)

## Product Improvements

### Access Logs

- Added detailed access-event data: timestamp, access result, person name or
  `Unknown`, device or entrance information, confidence, and available event
  image reference.
- Added search, date filtering, status filtering, newest-first ordering,
  25-item pagination, event details, and CSV export.

### People Management

- Added editing for authorized-person names, notes, and reference photographs.
- Added safer authorized-person removal with a warning and confirmation step.
- Added immediate UI feedback after editing or removal.
- Added reference-photo capture options for 5, 10, or 15 photos.

### Dashboard

- Added manual Dashboard refresh.
- Added refresh loading state and last-updated feedback.

## Quality and Automation

- Added measurable performance, security, and usability quality requirements.
- Added automated Quality Requirement Tests.
- Added backend unit and integration tests.
- Added 30% minimum line coverage enforcement for each documented critical
  module.
- Added GitHub Actions jobs for frontend build, Ruff lint, tests, QRTs,
  coverage, and Docker Compose validation.
- Verified PR quality workflow:
  https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28290665283
- Verified protected-main quality workflow after the Week 4 documentation merge:
  https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056
- Verified protected-main QRT job:
  https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056/job/83922995234
- Verified protected-main backend tests and critical coverage job:
  https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056/job/83922995205
- Verified Docker Compose validation job:
  https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056/job/83922995206

## Documentation and Evidence

- Added Assignment 4 report, embedded screenshot evidence, UAT documentation,
  customer-review summary, sanitized transcript, reflection, retrospective,
  LLM usage report, and release documentation.
- Project presentation video:
  https://drive.google.com/file/d/1sdwue996O--n4EDrhZsA01T88WiFIMfv/view?usp=sharing
- Deployment: http://10.93.26.183:5173/

The deployment is customer-accessible on the Innopolis University private
network.

## UAT and Customer Review

- Customer review was completed on June 28, 2026.
- The Sprint increment was demonstrated during the customer review.
- The customer confirmed after the review that everything seems fine and all
  user stories are approved.

## Rollback Note

If the release introduces a blocking regression, revert the specific merged PR
or publish a patch release after fixing the regression. Do not rewrite public
release history without team agreement.
