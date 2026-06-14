# Week 2 Report - Face Guard

## Project

Face Guard is an access-control system for restricted rooms and protected areas. It provides an administrator interface for managing authorized people, reviewing access activity, and monitoring the system.

License: [MIT License](../../LICENSE)

## Required artifacts

| Artifact | Link |
|---|---|
| User stories and initial MVP v1 scope | [user-stories.md](./user-stories.md) |
| MVP v0 report and smoke check | [mvp-v0-report.md](./mvp-v0-report.md) |
| Customer meeting summary | [customer-meeting-summary.md](./customer-meeting-summary.md) |
| Sanitized customer meeting transcript | [customer-meeting-transcript.md](./customer-meeting-transcript.md) |
| Supplementary customer meeting notes | [customer-meeting-notes.md](./customer-meeting-notes.md) |
| Week 2 analysis | [analysis.md](./analysis.md) |
| LLM usage report | [llm-report.md](./llm-report.md) |

## Prototype and interface

The primary external interface is a graphical administrator web application.

- Interactive prototype: <https://www.figma.com/make/SRfKSsmTXU7thEWzW2f78g/FaceGuard-Admin-Panel-Design?t=QgeFJjbXiSSuzG8h-1>
- Runnable prototype source: [frontend/prototype](../../frontend/prototype/)
- Public frontend deployment: <https://innopolis-robotics-society.github.io/FaceGuardV1/>

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

- University VM deployment: <http://10.90.138.70:3000>
- Public GitHub Pages deployment: <https://innopolis-robotics-society.github.io/FaceGuardV1/>
- Public video demonstration: <https://disk.yandex.ru/i/cgaJVBhka7gISw>
- Local setup instructions: [root README](../../README.md)
- Detailed report and repeatable smoke check: [mvp-v0-report.md](./mvp-v0-report.md)

The university VM is accessible through the university network or VPN. GitHub Pages provides a public static frontend demonstration. MVP v0 uses mock data and does not yet include production recognition, authentication, camera input, or persistent storage.

## Repository workflow

- Pull request template: [.github/pull_request_template.md](../../.github/pull_request_template.md)
- Example reviewed pull requests: [PR #5](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/5), [PR #6](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/6)
- Lychee configuration: [.lychee.toml](../../.lychee.toml)
- Link-check workflow: [.github/workflows/links.yml](../../.github/workflows/links.yml)
- Link-check runs: <https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/workflows/links.yml>
- GitHub Pages workflow: [.github/workflows/deploy-pages.yml](../../.github/workflows/deploy-pages.yml)
- GitHub Pages runs: <https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/workflows/deploy-pages.yml>

## Excluded Lychee links

| Link type | Reason | Manual verification |
|---|---|---|
| Private IP addresses, including `10.90.138.70` | Automated GitHub-hosted runners cannot access services inside the university network or VPN. `.lychee.toml` uses `exclude_all_private = true`. | Open the VM URL while connected to the university network or VPN and complete the documented smoke check. |
| Figma and Yandex Disk links | These services may block or rate-limit automated link-checking clients. | Open both links in a private browser window and confirm view-only access before submission. |

All other repository Markdown and HTML links are checked automatically by Lychee. The excluded links require the manual checks described above. HTTP 429 is accepted because some public services rate-limit automated checks.

## Coverage

The initial proposed MVP v1 scope is **US-01, US-02, and US-03**.

| Artifact or screen | Covered stories | Purpose |
|---|---|---|
| Dashboard | US-03 | Displays system and access-control summary information. |
| People list | US-01 | Displays authorized people in one interface. |
| Add-person flow | US-02 | Demonstrates entry of a new authorized person. |
| Shared layout and navigation | US-01, US-02, US-03 | Connects the selected administrator workflow. |

The prototype also explores later stories:

- System page: US-05
- Access Logs page: US-09
- People edit/removal flow: US-10
- Responsive administrator interface: US-07 and US-08

The MVP v0 foundation and repeatable validation procedure are documented in [mvp-v0-report.md](./mvp-v0-report.md).

## Customer review

- Meeting summary: [customer-meeting-summary.md](./customer-meeting-summary.md)
- Sanitized English transcript: [customer-meeting-transcript.md](./customer-meeting-transcript.md)
- Detailed supplementary notes: [customer-meeting-notes.md](./customer-meeting-notes.md)

Permission to record was obtained before recording began. Permission for private instructor sharing and publication of the sanitized English transcript was also confirmed.

## Required evidence screenshots

The following screenshots must be added to `reports/week2/images/` before submission and embedded in this report:

| Suggested filename | What to capture |
|---|---|
| `branch_protection_main.png` | GitHub Settings showing the active ruleset or branch protection for `main`. |
| `reviewed_pr.png` | A merged PR page showing changed files and at least one approval from another team member. |
| `lychee_success.png` | Successful **Check links** workflow run on `main`. |
| `mvp_v0_deployment.png` | The deployed MVP v0 dashboard with the browser address bar visible. |
| `github_pages_success.png` | Successful Pages deployment or the GitHub Pages settings showing the public URL. |

## Analysis

[Week 2 analysis](./analysis.md)

## LLM usage

[LLM usage report](./llm-report.md)
