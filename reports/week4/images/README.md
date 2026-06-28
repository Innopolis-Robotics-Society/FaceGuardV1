# Week 4 Evidence Images

Do not add fake screenshots. Add only screenshots captured from real GitHub,
CI, release, deployment, or product states. Sanitize credentials, private
network details, customer data, and biometric images before committing.

| File | What is visible | Source | Public/private | Current status | Sanitization requirements |
| --- | --- | --- | --- | --- | --- |
| `01_sprint_milestone.png` | Sprint 2 milestone dates and completed progress | GitHub milestone | Public | Available | No private notes. |
| `02_sprint_backlog.png` | Sprint Project view with selected issues and linked PR rows | GitHub Project | Public | Available | Do not count PR rows as extra PBIs. |
| `03_reviewed_pr.png` | PR #49 merged with independent approval | GitHub PR page | Public | Available | No private comments. |
| `04_quality_gates_pr.png` | Successful PR quality-gates workflow summary | GitHub Actions | Public | Available | No tokens or private browser data. |
| `05_critical_coverage.png` | Per-critical-module coverage values | GitHub Actions logs | Public | Available | No secrets. |
| `06_additional_qa.png` | Docker Compose configuration validation job | GitHub Actions | Public | Available | Treat the Compose `version` warning as non-failing. |
| `07_branch_rules.png` | Active ruleset applied to `main` with visible PR, approval, conversation, and deletion rules | GitHub repository settings/rules | Public or private depending permissions | Available | Claims stay limited to visible branch-protection settings. |
| `08_protected_main_ci.png` | Successful quality-gates run triggered by push to `main` | GitHub Actions | Public | Available | Use as protected-main CI evidence. |
| `09_release.png` | Published Assignment 4 release `v1.1.0` | GitHub Releases | Public | Available | Must not expose draft-only release material. |
| `10_deployed_increment.png` | Running private-network deployment, System page | Product UI | Public if sanitized | Available | Hide credentials and customer data. |
| `11_access_logs.png` | Access Logs page with search, filters, statuses, and CSV export | Product UI | Public if sanitized | Available | Use test data only. |
| `12_people_management.png` | People management UI with authorized users and edit actions | Product UI | Public if sanitized | Available | Not evidence of delete confirmation. |
| `13_dashboard_refresh.png` | Dashboard refresh button and last-updated value | Product UI | Public if sanitized | Available | Use test data only. |
| `14_reference_photo_capture.png` | Controlled capture options: 5, 10, or 15 photos | Product UI | Public if sanitized | Available | Use test data only. |
| `15_access_event_details.png` | Access event details modal | Product UI | Public if sanitized | Available | Use test data only. |
| `16_customer_confirmation.png` | Customer message approving all user stories | Customer follow-up message | Public if sanitized | Available | Keep private chat metadata out of additional docs. |
