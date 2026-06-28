# Project Presentation Script - Week 4

Target duration: 5 minutes.

Status: Project presentation video added.

Video: [Five-minute project presentation](https://drive.google.com/file/d/1sdwue996O--n4EDrhZsA01T88WiFIMfv/view?usp=sharing)

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
| 1:30-1:45 | Automated quality gates | Show PR and protected-main Actions pages with quality workflow, QRTs, coverage, and Compose validation. | Use PR run 28290665283 and protected-main run 28328689056. |
| 1:45-2:00 | Closing result | Summarize delivered work, published v1.1.0 release, private-network deployment, and customer approval. | Keep evidence concise. |

## Recording Checklist

- [x] Final increment is merged and released as `v1.1.0`.
- [x] Demo environment uses test data only.
- [x] No credentials or private network details are visible.
- [x] No biometric images are visible without permission.
- [x] Browser zoom is readable.
- [x] Project presentation video link is added to the Week 4 report after upload.
