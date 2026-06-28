# Customer Review Summary - Week 4

Status: Customer Review Completed

This summary is based on the team-provided Week 4 transcript, meeting protocol,
and recap for the customer session held on June 28, 2026. Restricted recording
links are not committed to the public repository.

## Date

June 28, 2026.

## Participants

- Artyom Tuzov - customer representative
- Danila Naboishchikov - presenter / developer
- Emil Vagizov - team participant
- Oleg Korchagin - developer / deployment access support

## Recording Consent

The team reports that recording and implementation approval were obtained for
the Week 4 customer session. The public repository stores only this sanitized
summary and transcript. Recording links and any restricted access details belong
in the private Moodle evidence package.

## Demonstrated Increment

- Dashboard refresh button that updates data without a full page reload.
- Updated user management flow, including reduced photo upload options during
  person creation.
- Improved person editing.
- Delete confirmation for authorized people.
- Access Logs with more detailed event information, filters, event deletion,
  confirmation against accidental clearing, and CSV export.
- Quality requirements and automated tests for health endpoint response,
  invalid-token rejection, validation, unit tests, integration tests, and
  critical-module coverage.
- Ongoing Docker Compose work for centralized system deployment.

## Customer Feedback

- The customer could not connect to the current deployment during the meeting.
  The team suspected network or local-access constraints and demonstrated the
  interface instead.
- The customer asked the team to send a clear message with exactly what should
  be tested and where feedback or approval is needed.
- The customer asked whether anti-spoofing had been implemented.
- The customer confirmed that hardware work and anti-spoofing are important
  priorities.

## Accepted Items

- The team requested approval for the second Sprint increment and reports that
  approval was obtained.
- The customer accepted receiving the follow-up list of scenarios and approval
  requests by message.
- The customer confirmed the next-Sprint priority direction: Raspberry Pi
  integration and recognition-model improvement, including anti-spoofing.

## Requested Changes

- Provide the customer with a clear follow-up checklist of what to test and what
  feedback or approval is needed.
- Resolve or document deployment access constraints so the customer can test the
  system directly.
- Prioritize hardware integration and anti-spoofing in the next Sprint.

## Rejected or Deferred Suggestions

- Anti-spoofing was not implemented in this Sprint. It is deferred to a future
  Sprint and should be treated as a priority follow-up.

## Backlog Changes

- Add or prioritize Raspberry Pi integration.
- Add or prioritize recognition-model improvement.
- Add or prioritize anti-spoofing.
- Keep deployment/customer-access verification visible before final release.

## Next Actions

- Send the customer the testing and approval checklist.
- Verify customer access to the deployment.
- Preserve private recording and approval evidence in the Moodle package.
- Update Week 4 UAT evidence after any follow-up customer self-test.
- Plan next-Sprint work around Raspberry Pi integration, recognition quality,
  and anti-spoofing.

## Recording Location

Private Moodle evidence package. Do not commit recording links or restricted
session evidence to this repository.

## Public/Private Evidence Decision

Public GitHub evidence includes this sanitized summary and the sanitized
transcript. Private Moodle evidence may include the original recording,
recording consent, deployment access details, and instructor-only notes.
