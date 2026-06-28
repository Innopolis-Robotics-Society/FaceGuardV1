# Public Demo Script - Week 4

Maximum duration: 2 minutes.

Status: Public demo video added.

Video: [Week 4 two-minute demo](https://drive.google.com/file/d/1ThiNXKLDx1JNQqwcmLJ8YAM-QAZy9Xqc/view?usp=sharing)

## Privacy and Sanitization Rules

- Do not show credentials, `.env` values, API keys, private IP access, or
  deployment secrets.
- Do not show real customer data.
- Do not show biometric face images unless explicit permission exists.
- Use sanitized test people and test events.
- Hide browser autocomplete, notification popups, and private tabs.

## Script

| Time | Segment | What to show | Notes |
| --- | --- | --- | --- |
| 0:00-0:15 | FaceGuard purpose | Project name and short statement: FaceGuard helps administrators manage room access and review access events. | Keep this brief. |
| 0:15-0:35 | Dashboard | Dashboard cards, health/status area, refresh button, last-updated feedback. | Show PR #52 delivered behavior. |
| 0:35-0:55 | Access Logs | Access Logs page with timestamp, result, person/Unknown, device/location, filters, and pagination. | Use the merged PR #50 flow. |
| 0:55-1:15 | Edit person | Open a test person and update safe test fields. | Use the merged PR #51 flow with sanitized data. |
| 1:15-1:30 | Safe removal | Show typed `DELETE` confirmation disabled/enabled behavior if merged. | Use disposable test data only. |
| 1:30-1:45 | Automated quality gates | Show PR or Actions page with quality workflow, QRTs, coverage, and Compose validation. | Do not claim protected-main CI until it exists. |
| 1:45-2:00 | Closing result | Summarize delivered work and pending customer/UAT evidence. | Keep pending items honest. |

## Recording Checklist

- [ ] Final increment is merged or pending items are clearly labeled.
- [ ] Demo environment uses test data only.
- [ ] No credentials or private network details are visible.
- [ ] No biometric images are visible without permission.
- [ ] Browser zoom is readable.
- [x] Public video link is added to the Week 4 report after upload.
