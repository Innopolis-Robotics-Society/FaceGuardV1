# Quality Requirements

This document defines maintained quality requirements for FaceGuard. Each requirement uses a stable ID, an ISO/IEC 25010 sub-characteristic, a measurable scenario, rationale, and traceability to product work.

## Quality Requirement Index

| ID | ISO/IEC 25010 sub-characteristic | Requirement summary | Related PBIs / risks | QRT links | Status |
|---|---|---|---|---|---|
| QR-01 | Reliability - availability | TBD | TBD | [QRT-01](./quality-requirement-tests.md#qrt-01) | Draft |
| QR-02 | Performance efficiency - time behaviour | TBD | TBD | [QRT-02](./quality-requirement-tests.md#qrt-02) | Draft |
| QR-03 | Security - confidentiality | TBD | TBD | [QRT-03](./quality-requirement-tests.md#qrt-03) | Draft |

## QR-01: Availability of Core Admin and Backend Paths

- **ISO/IEC 25010 sub-characteristic:** Reliability - availability.
- **Scenario:** Given the backend service and database are started with documented configuration, when an administrator opens the health endpoint and core admin pages, then the service returns a successful health response and the UI can load without blocking errors within the documented environment.
- **Measure:** TBD target response/status thresholds.
- **Rationale:** The customer must be able to inspect system state and manage authorized people before hardware deployment.
- **Traceability:** TBD issue, PR, CI run, and UAT links.
- **Automated QRT:** [QRT-01](./quality-requirement-tests.md#qrt-01).

## QR-02: Time Behaviour for Access-Control Feedback

- **ISO/IEC 25010 sub-characteristic:** Performance efficiency - time behaviour.
- **Scenario:** Given representative sanitized test data and the documented development environment, when access events or people data are requested through the supported product path, then the product returns or renders the result within the agreed threshold.
- **Measure:** TBD threshold and dataset size.
- **Rationale:** Slow access-control feedback makes the dashboard and operator workflow unreliable during customer demonstrations and later real-device use.
- **Traceability:** TBD issue, PR, CI run, and UAT links.
- **Automated QRT:** [QRT-02](./quality-requirement-tests.md#qrt-02).

## QR-03: Confidentiality of Sensitive Access-Control Data

- **ISO/IEC 25010 sub-characteristic:** Security - confidentiality.
- **Scenario:** Given the repository, CI logs, and public report artifacts, when public evidence is published, then secrets, private credentials, biometric samples, private recordings, customer-identifying details, and private access instructions are absent.
- **Measure:** TBD automated scan/check plus review evidence.
- **Rationale:** FaceGuard handles access-control and biometric-adjacent evidence, so public artifacts must stay sanitized.
- **Traceability:** TBD issue, PR, CI run, and review links.
- **Automated QRT:** [QRT-03](./quality-requirement-tests.md#qrt-03).
