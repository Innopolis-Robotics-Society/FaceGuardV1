# Customer Review Notes - Week 4

Status: Customer Review Completed

These notes summarize the Week 4 customer session held on June 28, 2026. They
do not include restricted recording links, credentials, or private deployment
access.

## Agenda

| Timebox | Topic | Owner | Status |
| --- | --- | --- | --- |
| 1 min | Confirm recording and evidence permissions | Danila Naboishchikov | Completed; team reports approval was obtained. |
| 2 min | Explain Sprint Goal and selected scope | Danila Naboishchikov | Completed. |
| 5 min | Demonstrate delivered and merged increment | Danila Naboishchikov / Oleg Korchagin | Completed by team demonstration because customer access failed. |
| 8 min | Execute prepared UAT scenarios | Danila Naboishchikov / customer | Partially completed; customer self-test was blocked by deployment access. |
| 3 min | Collect feedback and requested changes | Danila Naboishchikov / Artyom Tuzov | Completed. |
| 1 min | Confirm next actions | Danila Naboishchikov / Artyom Tuzov | Completed. |

## Demonstration Checklist

| Item | Evidence expected | Status |
| --- | --- | --- |
| Dashboard manual refresh | Visible refresh action and last-updated feedback | Demonstrated. |
| Access Logs | Visible logs, filters, event deletion, confirmation, CSV export | Demonstrated; customer self-test blocked by access issue. |
| Edit person | Updated user management and photo-count selection | Demonstrated. |
| Safe removal | Delete confirmation for people and logs | Demonstrated. |
| Quality gates | Health, security, validation, unit, integration, and coverage tests | Presented. |

## UAT Execution Table

| UAT ID | Scenario | Result | Timecode | Notes |
| --- | --- | --- | --- | --- |
| UAT-001 | Review and filter access events | Demonstrated; customer self-test pending access fix | 00:03:13-00:05:28 | Customer could not access deployment directly; team showed Access Logs, filters, clearing confirmation, and CSV export. |
| UAT-002 | Edit an authorized person | Demonstrated | 00:05:28-00:05:40 | Team described improved user creation/editing and photo-count choices. |
| UAT-003 | Safely remove an authorized person | Demonstrated | 00:05:28-00:07:34 | Team described deletion confirmation for people and logs to reduce data-loss risk. |
| UAT-004 | Dashboard manual refresh | Demonstrated | 00:00:02-00:00:56; 00:07:04-00:07:34 | Dashboard refresh button was presented as a completed Sprint improvement. |

## Timestamp Table

| Timecode | Event | Public/private | Notes |
| --- | --- | --- | --- |
| 00:00:02 | Sprint result presentation starts | Public sanitized transcript | Danila presents Dashboard refresh and user-management changes. |
| 00:02:55 | UAT request starts | Public sanitized transcript | Team asks customer to test scenarios and provide feedback. |
| 00:03:40 | Deployment access issue appears | Public sanitized transcript | Customer cannot connect to the website. |
| 00:04:32 | Team demonstration starts | Public sanitized transcript | Team demonstrates Access Logs instead of customer self-test. |
| 00:05:28 | People deletion/photo upload changes | Public sanitized transcript | Team presents deletion confirmation and photo-count choices. |
| 00:08:26 | Next-Sprint priority discussion | Public sanitized transcript | Customer asks about anti-spoofing and confirms hardware/anti-spoofing priority. |

## Decisions

- The second Sprint increment was presented to the customer.
- The team reports that approval for the Sprint implementation and recording
  evidence was obtained.
- Direct customer self-testing could not be completed during the call because
  the customer could not access the deployment.
- The team must send a follow-up checklist with exact testing and approval
  requests.
- Raspberry Pi integration, recognition-model improvement, and anti-spoofing
  should be prioritized next.

## Action Items

| Action | Owner | Deadline | Evidence |
| --- | --- | --- | --- |
| Send testing and approval checklist to the customer. | Danila Naboishchikov | After customer session | Private/customer communication evidence. |
| Verify deployment access for the customer. | Team | Before final UAT closure | Deployment access check or customer confirmation. |
| Add Raspberry Pi and anti-spoofing priorities to future planning. | Team | Next Sprint planning | Updated roadmap/backlog evidence. |
| Preserve recording/approval evidence privately. | Team | Moodle submission | Private Moodle evidence package. |

## Recording Permission

The team reports that recording permission was obtained. Recording links are
kept out of the public repository and belong in private Moodle evidence.

## Access Notes

The customer could not access the deployment during the meeting even though a
team member could connect from another location. The access problem should be
verified before final UAT closure.

Do not add credentials, private network details, or customer-private links to
this public repository.
