# User Acceptance Tests - Assignment 4

This document prepares customer-facing User Acceptance Test scenarios for the
Assignment 4 / Week 4 Sprint Review. Execution is not recorded yet.

- Execution status: Pending Customer Session
- Customer feedback: Pending Customer Session
- Recording consent: Pending Customer Session
- UAT evidence location: Not Yet Available

Do not treat any scenario below as passed or failed until the customer session
has been completed and evidence has been recorded.

## UAT-001 - Review and filter access events

- Related issue: [US-09 / issue #21](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/21)
- Related PR: [PR #50](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/50)
- Current implementation status: Delivered to `main`.
- Objective: verify that an administrator can audit access attempts and narrow
  the list using date and status filters.

### Preconditions

- FaceGuard frontend and backend are running in a demonstration environment.
- The environment contains access-attempt events with granted, denied, and
  unknown outcomes.
- No biometric images or customer-private data are shown in the public report.

### Test data required

- At least 26 access-attempt events to verify pagination by 25 items.
- At least one granted event linked to a known person.
- At least one denied or unknown event where the person is shown as `Unknown`.
- Events across at least two dates.
- Events from at least one device or entrance location.

### Customer steps

1. Open the administrator web application.
2. Navigate to Access Logs.
3. Confirm that each visible event shows a timestamp.
4. Confirm that access result is visible as granted, denied, or unknown.
5. Confirm that a known person name or `Unknown` is visible.
6. Confirm that device or location is visible.
7. Apply a date filter.
8. Apply a status filter.
9. Confirm that the list is sorted newest first.
10. Navigate through pagination and confirm that the page size is 25 items.

### Expected result

The customer can inspect access-attempt history, filter by date and status, see
person/device context, and navigate paginated newest-first results.

### Execution record

| Field | Value |
| --- | --- |
| Actual result | [TBD after customer session] |
| Pass/fail | Pending Customer Session |
| Recording timecode | [TBD after customer session] |
| Customer comments | [TBD after customer session] |
| Follow-up issue | [TBD after customer session] |

## UAT-002 - Edit an authorized person

- Related issue: [US-10 / issue #22](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/22)
- Related PR: [PR #51](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/51)
- Current implementation status: Delivered to `main`.
- Objective: verify that an administrator can update an authorized person's
  details and see immediate feedback.

### Preconditions

- FaceGuard frontend and backend are running in a demonstration environment.
- At least one authorized person exists.
- A suitable non-sensitive test photo is available if the environment supports
  photo replacement.

### Test data required

- Existing authorized person record.
- New test name.
- New test note.
- Optional sanitized test photo if photo update is demonstrated.

### Customer steps

1. Open the People page.
2. Open an existing authorized person.
3. Change the person's name.
4. Change the person's note.
5. If the environment supports it, update the photo using a sanitized test
   image.
6. Save changes.
7. Confirm that success feedback is shown.
8. Return to the people list.
9. Confirm that the updated person data appears without a full browser reload.

### Expected result

The updated person details are saved, success feedback is visible, and the list
reflects the change immediately.

### Execution record

| Field | Value |
| --- | --- |
| Actual result | [TBD after customer session] |
| Pass/fail | Pending Customer Session |
| Recording timecode | [TBD after customer session] |
| Customer comments | [TBD after customer session] |
| Follow-up issue | [TBD after customer session] |

## UAT-003 - Safely remove an authorized person

- Related issue: [US-10 / issue #22](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/22)
- Related PR: [PR #51](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/51)
- Current implementation status: Delivered to `main`.
- Objective: verify that destructive removal is protected by an explicit
  confirmation step and gives immediate feedback.

### Preconditions

- FaceGuard frontend and backend are running in a demonstration environment.
- At least one disposable test person exists and can be removed safely.
- The test person does not contain customer data or biometric evidence that
  should be preserved.

### Test data required

- Disposable authorized person record.
- Confirmation value: `DELETE`.

### Customer steps

1. Open the People page.
2. Open a disposable authorized person.
3. Open the delete dialog.
4. Confirm that deletion is impossible before typing `DELETE`.
5. Type an incorrect value.
6. Confirm that the destructive action remains disabled.
7. Type the exact value `DELETE`.
8. Confirm deletion.
9. Confirm that success feedback is shown.
10. Confirm that the person disappears from the list immediately.

### Expected result

The person cannot be removed without exact typed confirmation. After confirmed
removal, the UI shows success feedback and the list updates immediately.

### Execution record

| Field | Value |
| --- | --- |
| Actual result | [TBD after customer session] |
| Pass/fail | Pending Customer Session |
| Recording timecode | [TBD after customer session] |
| Customer comments | [TBD after customer session] |
| Follow-up issue | [TBD after customer session] |

## UAT-004 - Dashboard manual refresh

- Related issue: [PBI-A4-16 / issue #47](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/47)
- Related PR: [PR #52](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/52)
- Current implementation status: Delivered to `main`.
- Objective: verify that an administrator can manually refresh Dashboard data
  and see when the data was last updated.

### Preconditions

- FaceGuard frontend and backend are running in a demonstration environment.
- Dashboard data is available.

### Test data required

- People, event, statistics, and health data visible on the Dashboard.

### Customer steps

1. Open the Dashboard.
2. Locate the compact refresh button.
3. Confirm that a last-updated value is visible.
4. Click refresh.
5. Confirm that the button shows a loading or disabled state while refresh is
   in progress.
6. Confirm that the browser page does not fully reload.
7. Confirm that the last-updated value changes after a successful refresh.

### Expected result

The Dashboard refreshes current data on demand and gives clear last-updated
feedback without a full page reload.

### Execution record

| Field | Value |
| --- | --- |
| Actual result | [TBD after customer session] |
| Pass/fail | Pending Customer Session |
| Recording timecode | [TBD after customer session] |
| Customer comments | [TBD after customer session] |
| Follow-up issue | [TBD after customer session] |
