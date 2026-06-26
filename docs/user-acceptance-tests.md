# User Acceptance Tests

User acceptance tests are maintained product assets. Week-specific execution evidence is recorded in the public report and private Moodle submission where required.

## UAT Scenario Index

| ID | Scenario | Primary user | Related PBIs | Current status | Latest execution |
|---|---|---|---|---|---|
| UAT-01 | Administrator reviews authorized people | Administrator/operator | [US-01](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/13) | Active | TBD |
| UAT-02 | Administrator adds a person with reference photographs | Administrator/operator | [US-02](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/14) | Active | TBD |
| UAT-03 | Administrator reviews dashboard and recent recognition events | Administrator/operator | [US-03](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/15) | Active | TBD |
| UAT-04 | Administrator checks connected camera visibility | Administrator/operator | [US-11](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/24) | Active | TBD |

## UAT-01: Administrator Reviews Authorized People

- **Goal:** Confirm that the customer can inspect who currently has access.
- **Preconditions:** Backend, database, and frontend are running with sanitized demo data.
- **Steps:** Open the admin interface, navigate to People, inspect the authorized-person list, and identify at least one person record.
- **Expected result:** The list loads, records are understandable, and no private real-person evidence is exposed in public artifacts.
- **Execution history:** TBD date, customer role, status, and sanitized notes.

## UAT-02: Administrator Adds a Person with Reference Photographs

- **Goal:** Confirm that the customer can follow the add-person flow.
- **Preconditions:** Backend, database, frontend, and supported camera/photo input path are available with sanitized data.
- **Steps:** Open People, start the add-person flow, enter required fields, attach or capture reference photographs, and save.
- **Expected result:** The new person appears in the authorized list and the result is visible without exposing private biometric data publicly.
- **Execution history:** TBD date, customer role, status, and sanitized notes.

## UAT-03: Administrator Reviews Dashboard and Recent Recognition Events

- **Goal:** Confirm that the customer can understand current system state and recent access events.
- **Preconditions:** Backend, database, frontend, and sanitized event data are available.
- **Steps:** Open Dashboard, inspect metrics, inspect recent activity, and describe the current state.
- **Expected result:** Dashboard data is visible, current, and useful for operator decisions.
- **Execution history:** TBD date, customer role, status, and sanitized notes.

## UAT-04: Administrator Checks Connected Camera Visibility

- **Goal:** Confirm that the customer can verify camera connection/status through the product.
- **Preconditions:** Frontend, backend, and a real or simulated camera path are running.
- **Steps:** Open the camera/status page, inspect image/status output, and identify whether the camera path is usable.
- **Expected result:** The product clearly shows camera status and image availability or a meaningful unavailable state.
- **Execution history:** TBD date, customer role, status, and sanitized notes.

## Week 4 Public Summary Placeholder

Week 4 public results belong in [reports/week4/README.md](../reports/week4/README.md). Private recording links, exact recording timecodes, credentials, and customer-identifying evidence must be submitted only through Moodle or another approved private instructor channel.
