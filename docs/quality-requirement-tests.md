# Quality Requirement Tests

This document maps every active quality requirement to automated quality requirement tests. QRTs are maintained product checks and must continue to run or be replaced by documented stronger checks when the product changes.

## QRT Index

| QRT ID | Quality requirement | Automated check | CI location | Evidence link | Status |
|---|---|---|---|---|---|
| QRT-01 | [QR-01](./quality-requirements.md#qr-01-availability-of-core-admin-and-backend-paths) | TBD health/build/integration check | TBD | TBD | Draft |
| QRT-02 | [QR-02](./quality-requirements.md#qr-02-time-behaviour-for-access-control-feedback) | TBD timed API/UI check | TBD | TBD | Draft |
| QRT-03 | [QR-03](./quality-requirements.md#qr-03-confidentiality-of-sensitive-access-control-data) | TBD secret/sensitive-artifact check | TBD | TBD | Draft |

## QRT-01

- **Quality requirement:** [QR-01](./quality-requirements.md#qr-01-availability-of-core-admin-and-backend-paths).
- **Automated evidence type:** TBD.
- **Test location:** TBD.
- **CI job:** TBD.
- **Pass criteria:** Backend health and core frontend build or integration path pass in the documented environment.
- **Failure meaning:** The increment may not be customer-accessible or operator-verifiable.
- **Latest evidence:** TBD protected-default-branch CI run or PR check.

## QRT-02

- **Quality requirement:** [QR-02](./quality-requirements.md#qr-02-time-behaviour-for-access-control-feedback).
- **Automated evidence type:** TBD.
- **Test location:** TBD.
- **CI job:** TBD.
- **Pass criteria:** The measured path completes within the agreed threshold on sanitized representative data.
- **Failure meaning:** The operator workflow may not provide timely access-control feedback.
- **Latest evidence:** TBD protected-default-branch CI run or PR check.

## QRT-03

- **Quality requirement:** [QR-03](./quality-requirements.md#qr-03-confidentiality-of-sensitive-access-control-data).
- **Automated evidence type:** TBD.
- **Test location:** TBD.
- **CI job:** TBD.
- **Pass criteria:** Public repository files and CI/public report artifacts pass the selected sensitive-data guard.
- **Failure meaning:** Public evidence may expose secrets, private credentials, biometric data, or customer-identifying information.
- **Latest evidence:** TBD protected-default-branch CI run or PR check.

## Maintenance Rule

If a QRT becomes obsolete because the product architecture changes, replace it with an equivalent or stronger automated check and update this document, `docs/testing.md`, the Definition of Done, and the Week report evidence.
