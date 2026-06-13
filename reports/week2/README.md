# Week 2 Report — Face Guard

## Project

Face Guard is an access control system for managing entry to restricted rooms and protected areas.

License: [MIT License](../../LICENSE)

## Required artifacts

| Artifact | Link |
|---|---|
| User stories | [user-stories.md](./user-stories.md) |
| MVP v0 report | [mvp-v0-report.md](./mvp-v0-report.md) |
| Customer meeting summary | [customer-meeting-summary.md](./customer-meeting-summary.md) |
| Customer meeting transcript | [customer-meeting-transcript.md](./customer-meeting-transcript.md) |
| Customer meeting notes | [customer-meeting-notes.md](./customer-meeting-notes.md) |
| Week 2 analysis | [analysis.md](./analysis.md) |
| LLM usage report | [llm-report.md](./llm-report.md) |

## Prototype and interface

Main external interface: graphical web interface.

Interactive prototype: https://www.figma.com/make/SRfKSsmTXU7thEWzW2f78g/FaceGuard-Admin-Panel-Design?t=QgeFJjbXiSSuzG8h-1

Interface screenshots:

### Dashboard

![Face Guard dashboard](./images/dashboard_panel.png)

### People

![People management panel](./images/people_mock_panel.png)

### Access logs

![Access logs panel](./images/access_logs_mock_panel.png)

### System

![System monitoring panel](./images/system_mock_panel.png)

### Settings

![Settings panel](./images/settings_mock_panel.png)

## MVP v0

- Deployment URL: <http://10.90.138.70:3000>
- Public video demonstration: <https://disk.yandex.ru/i/cgaJVBhka7gISw>
- Local setup: [Root README](../../README.md)
- MVP v0 report: [mvp-v0-report.md](./mvp-v0-report.md)

MVP v0 is a runnable frontend foundation with mock data. It does not include real face recognition, production authentication, camera input, or database integration yet.

## Repository workflow

- MR template: `../../.gitlab/merge_request_templates/Default.md`
- Reviewed MR: [INSERT REVIEWED MR LINK]
- Lychee config: `../../.lychee.toml`
- Latest successful Lychee run: [INSERT PIPELINE LINK]

Repository workflow evidence screenshots have not been added yet.

## Excluded Lychee links

| Link | Reason | Manual verification |
|---|---|---|
| https://vm.innopolis.university | Requires university access/authentication | Checked manually by team |

## Coverage

The proposed prototype and MVP v0 foundation should cover:

- US-01
- US-03
- US-05
- US-07
- US-08
- US-09
- US-10

The detailed MVP v0 smoke-check scenario is documented in [mvp-v0-report.md](./mvp-v0-report.md).

## Customer review

- Summary: [customer-meeting-summary.md](./customer-meeting-summary.md)
- Transcript: [customer-meeting-transcript.md](./customer-meeting-transcript.md)
- Notes: [customer-meeting-notes.md](./customer-meeting-notes.md)

If transcript publication is not permitted, the public report should use meeting notes instead.

## Analysis

[analysis.md](./analysis.md)

## LLM usage

[llm-report.md](./llm-report.md)
