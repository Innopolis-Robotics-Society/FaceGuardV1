# Week 4 Evidence Images

Do not add fake screenshots. Add only screenshots captured from real GitHub,
CI, release, deployment, or product states. Sanitize credentials, private
network details, customer data, and biometric images before committing.

| File | What must be visible | Source | Public/private | Current status | Owner | Sanitization requirements |
| --- | --- | --- | --- | --- | --- | --- |
| `01_sprint_milestone.png` | Sprint 2 milestone, selected issues, open/closed status | GitHub milestone | Public | Not Yet Available | Team | No private notes. |
| `02_sprint_backlog.png` | Sprint Backlog / Project view with selected PBIs | GitHub Project | Public | Not Yet Available | Team | Hide unrelated private fields if any. |
| `03_reviewed_pr.png` | Reviewed PR with approval and checks | GitHub PR page | Public | Not Yet Available | Team | No private comments. |
| `04_quality_gates_pr.png` | PR #49 with quality gates and review/CI status | GitHub PR #49 | Public | Not Yet Available | Team | No tokens or private browser data. |
| `05_critical_coverage.png` | Per-critical-module coverage values | GitHub Actions logs or local terminal | Public | Not Yet Available | Team | No local paths with private data if avoidable. |
| `06_additional_qa.png` | Docker Compose validation job | GitHub Actions | Public | Not Yet Available | Team | No secrets. |
| `07_branch_rules.png` | Branch rules or ruleset protecting `main` | GitHub repository settings/rules | Public or private depending permissions | Not Yet Available | Repository owner | Hide private settings not required for evidence. |
| `08_protected_main_ci.png` | Successful latest `main` CI after final merge | GitHub Actions | Public | Not Yet Available | Team | Use final run only. |
| `09_release.png` | Published Assignment 4 release | GitHub Releases | Public | Not Yet Available | Team | Must not show draft-only release as published. |
| `10_deployed_increment.png` | Running final increment or deployment evidence | Product UI or deployment page | Public if sanitized | Not Yet Available | Team | Hide credentials, private URL tokens, and customer data. |
| `11_access_logs.png` | Access Logs page with filters and pagination | Product UI | Public if sanitized | Not Yet Available | Team | Use test data only. |
| `12_safe_person_removal.png` | Delete confirmation requiring exact `DELETE` | Product UI | Public if sanitized | Not Yet Available | Team | Use disposable test person only. |
| `13_dashboard_refresh.png` | Dashboard refresh button and last-updated value | Product UI | Public if sanitized | Not Yet Available | Team | Use test data only. |
