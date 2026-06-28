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
- Docker Compose configuration validation in GitHub Actions.

## Customer Feedback

- The customer asked the team to send a clear message with exactly what should
  be tested and where feedback or approval is needed.
- Customer-executed UAT evidence was recorded and is provided in the private
  Moodle evidence package.
- The customer later replied that everything seems fine, all user stories are
  approved, and the team has the right vision.
- The customer asked whether anti-spoofing had been implemented.
- The customer confirmed that hardware work and anti-spoofing are important
  priorities.

## Accepted Items

- The team requested approval for the second Sprint increment and reports that
  approval was obtained.
- The customer approved the follow-up scenario checklist by message.
- The customer confirmed the next-Sprint priority direction: Raspberry Pi
  integration and recognition-model improvement, including anti-spoofing.

## Backlog Changes

- Add or prioritize Raspberry Pi integration.
- Add or prioritize recognition-model improvement.
- Add or prioritize anti-spoofing.

## Release and Deployment Evidence

- Published Assignment 4 release:
  https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v1.1.0
- Project presentation:
  https://drive.google.com/file/d/1sdwue996O--n4EDrhZsA01T88WiFIMfv/view?usp=sharing
- Deployment URL: `http://10.93.26.183:5173/`, available on the Innopolis
  University private network.

## Recording Location

Private Moodle evidence package. Do not commit recording links or restricted
session evidence to this repository.

## Public/Private Evidence Decision

Public GitHub evidence includes this sanitized summary and the sanitized
transcript. Private Moodle evidence may include the original recording,
customer-executed UAT recording, recording consent, deployment access details,
and instructor-only notes.
