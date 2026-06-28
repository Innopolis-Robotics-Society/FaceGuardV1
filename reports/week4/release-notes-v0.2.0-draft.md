# Draft Release Notes - v0.2.0

Status: Draft. This is not a published GitHub Release.

## Planned Version

- Planned version: `v0.2.0`
- Release type: Assignment 4 / Sprint 2 increment
- Release status: Pending documentation PR, deployment access verification,
  possible follow-up UAT confirmation, and publication

## Milestone

- [Sprint 2 - Increment](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/milestone/2)

## Intended Scope

- Access Logs review and filtering.
- Authorized-person edit and safe removal.
- Dashboard manual refresh and last-updated feedback.
- Assignment 4 quality gates: measurable quality requirements, QRTs, tests,
  coverage enforcement, CI jobs, and Compose validation.

## Merged Changes

Only merged work is listed here.

- [#47](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/47)
  via [PR #52](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/52):
  Dashboard manual refresh and last-updated feedback.
- [#48](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/48)
  via [PR #49](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/49):
  quality gates and tests.
- [#22](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/22)
  via [PR #51](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/51):
  authorized-person edit and safe removal.
- [#21](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/21)
  via [PR #50](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/50):
  Access Logs review and filtering.

## Pending Candidates

These items are not released until completed.

- This Week 4 documentation PR.
- Customer Review and UAT evidence.
- Deployment verification and public demo evidence.

## Quality Verification

- PR #49 quality workflow: successful before this documentation commit.
- Final `main` quality workflow: Pending Deployment Verification.
- Latest `main` CI/link-check evidence must be rechecked after this
  documentation PR.
- UAT: Demonstrated during customer review; direct customer self-test was
  blocked by deployment access and may require follow-up.

## Known Limitations

- Recognition agent still requires restart or model rebuild after
  authorized-person changes. Tracked in
  [#35](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/35).
- Deployment verification for the final Assignment 4 increment is Pending
  Deployment Verification.

## Deployment Verification

Pending Deployment Verification.

Do not publish release notes claiming deployment success until the team has
verified the final merged increment.

## Release Checklist

- [x] Merge PR #49.
- [x] Merge PR #50.
- [x] Merge PR #51.
- [ ] Merge this documentation PR.
- [ ] Verify latest `main` quality workflow.
- [ ] Verify latest `main` link check.
- [ ] Run or verify deployment/runnable artifact.
- [ ] Complete customer review and UAT.
- [ ] Update Week 4 report with final evidence.
- [ ] Publish GitHub Release `v0.2.0`.
- [ ] Move relevant changelog items from `Unreleased` into a dated `v0.2.0`
  section.

## Rollback Note

If the release introduces a blocking regression, revert the specific merged PR
or publish a patch release after fixing the regression. Do not rewrite public
release history without team agreement.
