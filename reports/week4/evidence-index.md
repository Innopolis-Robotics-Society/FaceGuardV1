# Evidence Index - Week 4

This index tracks public GitHub evidence and private Moodle evidence separately.
Do not commit restricted recording links, credentials, private deployment
access, biometric material, or instructor-only notes.

## Screenshot Evidence

| Evidence filename | Requirement or report section | What the screenshot proves | Related Issue or PR | Status |
| --- | --- | --- | --- | --- |
| `01_sprint_milestone.png` ([View evidence](images/01_sprint_milestone.png)) | Sprint Overview | Sprint 2 milestone dates and completed progress. | Issues #21, #22, #47, #48 | Delivered |
| `02_sprint_backlog.png` ([View evidence](images/02_sprint_backlog.png)) | Sprint Backlog Traceability | Selected Sprint issue rows and linked PR rows in the Project view. PR rows are not counted as extra PBIs. | Issues #21, #22, #47, #48; PRs #49, #50, #51, #52 | Delivered |
| `03_reviewed_pr.png` ([View evidence](images/03_reviewed_pr.png)) | Definition of Done / review evidence | PR #49 was independently reviewed and approved before merge. | Issue #48; PR #49 | Delivered |
| `04_quality_gates_pr.png` ([View evidence](images/04_quality_gates_pr.png)) | CI and Quality Gates | PR #49 quality workflow passed frontend build, Ruff lint, backend tests and coverage, QRTs, and Compose validation. | Issue #48; PR #49 | Delivered |
| `05_critical_coverage.png` ([View evidence](images/05_critical_coverage.png)) | Critical-Module Coverage | Critical modules passed the 30% threshold: `app/api/system.py` 50.00%, `app/core/security.py` 96.15%, and `app/schemas/schemas.py` 100.00%. | Issue #48; protected-main coverage job | Delivered |
| `06_additional_qa.png` ([View evidence](images/06_additional_qa.png)) | Additional QA | Docker Compose configuration validation completed successfully. | Issue #48; protected-main Compose job | Delivered |
| `07_branch_rules.png` ([View evidence](images/07_branch_rules.png)) | Branch Protection | Active ruleset applies to `main`, requires a PR before merge, one approval, resolved conversations, and restricts branch deletion. | Repository ruleset | Delivered |
| `08_protected_main_ci.png` ([View evidence](images/08_protected_main_ci.png)) | Protected-default-branch CI | Quality gates workflow passed after a push to `main` following the Week 4 documentation merge. | Main branch CI | Delivered |
| `09_release.png` ([View evidence](images/09_release.png)) | Deployment and Release | GitHub Release `v1.1.0` is published as the Assignment 4 Sprint increment. | Release `v1.1.0` | Delivered |
| `10_deployed_increment.png` ([View evidence](images/10_deployed_increment.png)) | Deployment and Delivered Increment | FaceGuard is running at the private-network deployment URL with system status visible. | Deployment evidence | Delivered |
| `11_access_logs.png` ([View evidence](images/11_access_logs.png)) | UAT / Access Logs | Access Logs show search, date filters, status filters, event rows, details entry point, and CSV export. | Issue #21; PR #50 | Delivered |
| `12_people_management.png` ([View evidence](images/12_people_management.png)) | UAT / People workflow | People management page shows authorized users and edit actions. | Issue #22; PR #51 | Delivered |
| `13_dashboard_refresh.png` ([View evidence](images/13_dashboard_refresh.png)) | UAT / Dashboard evidence | Dashboard shows manual Refresh action and Last updated feedback. | Issue #47; PR #52 | Delivered |
| `14_reference_photo_capture.png` ([View evidence](images/14_reference_photo_capture.png)) | UAT / reference-photo workflow | Person profile offers reference-photo capture options for 5, 10, or 15 photos. | Issue #22; PR #51 | Delivered |
| `15_access_event_details.png` ([View evidence](images/15_access_event_details.png)) | UAT / Access event details | Event details modal shows person, time, confidence, decision, device, event type, and event image reference. | Issue #21; PR #50 | Delivered |
| `16_customer_confirmation.png` ([View evidence](images/16_customer_confirmation.png)) | UAT / customer confirmation | Customer follow-up message confirms that everything seems fine and all user stories are approved. | UAT scenarios | Delivered |

## Link Evidence

| Requirement | Public evidence | Private evidence | Status | Remaining action |
| --- | --- | --- | --- | --- |
| Product Backlog | [Product Backlog view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/1) | Not required | Delivered | Keep final Project view available. |
| Sprint milestone | [Sprint 2 - Increment](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/milestone/2) | Not required | Delivered | Screenshot evidence is included above. |
| Issue links | [#21](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/21), [#22](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/22), [#47](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/47), [#48](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/48) | Not required | Delivered | All selected issues are closed through merged PRs. |
| PR links | [#49](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/49), [#50](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/50), [#51](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/51), [#52](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/52) | Not required | Delivered | Selected PRs are merged. |
| PR quality workflow | [PR #49 Quality gates run](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28290665283) | Not required | Delivered | All five quality jobs passed. |
| Protected-main CI | [Quality gates run after push to `main`](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056) | Not required | Delivered | All five quality jobs passed after the Week 4 documentation merge. |
| Quality requirement tests | [Quality requirement tests job](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056/job/83922995234) | Not required | Delivered | Protected-main QRT job passed. |
| Backend tests and coverage | [Backend tests and critical coverage job](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056/job/83922995205), [backend coverage artifact](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056/artifacts/7936486952) | Not required | Delivered | Protected-main backend test and coverage evidence is preserved. |
| Docker Compose validation | [Deployment configuration validation job](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056/job/83922995206) | Not required | Delivered | The Compose validation job completed successfully. |
| Project presentation video | [Five-minute project presentation](https://drive.google.com/file/d/1sdwue996O--n4EDrhZsA01T88WiFIMfv/view?usp=sharing) | Raw recording if private | Delivered | Use as the public project presentation evidence. |
| Deployment | http://10.93.26.183:5173/ | Private network access details if needed | Delivered | Customer scenario confirmation is preserved in the screenshot evidence. |
| Release | [FaceGuard v1.1.0](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v1.1.0) | Not required | Delivered | Published Assignment 4 release. |
| UAT | [UAT scenarios](../../docs/user-acceptance-tests.md), [review notes](customer-review-notes.md), [customer confirmation screenshot](images/16_customer_confirmation.png) | Recording/timecodes if private | Delivered | Customer confirmed that all user stories are approved. |
| Customer review | [summary](customer-review-summary.md), [notes](customer-review-notes.md), [sanitized transcript](customer-review-transcript.md) | Recording, consent, and restricted access details | Delivered | Preserve original recording and consent privately. |
