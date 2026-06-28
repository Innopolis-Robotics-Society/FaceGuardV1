# Sprint Retrospective - Week 4

## What went well

- The selected Sprint work was split into small issue-linked PBIs.
- Multiple team members implemented work in parallel through pull requests.
- PRs were linked to issues, and several PRs have independent review records.
- The QA PR introduced automated quality gates, QRTs, and per-critical-module
  coverage enforcement.
- Public and private evidence separation is now explicit in the Week 4 report
  structure.

## What did not go well

- Important PRs remained open close to submission and were merged while report
  preparation was still in progress.
- Review and merge dependencies delayed closure of selected Sprint issues.
- Link-check failures appeared on product PRs and on the latest `main` run.
- Report preparation started late compared with the amount of evidence required.
- Customer scenario confirmation was collected after the review.

## Improvement Actions

| Action | Owner | Deadline | Evidence |
| --- | --- | --- | --- |
| Merge the QA workflow before relying on it as project-wide evidence. | [Sparta2016840](https://github.com/Sparta2016840) | Before final Assignment 4 merge | PR #49 merged and quality workflow runs on `main`. |
| Require successful checks before merging remaining product PRs. | Whole team | Before final release | PR #50 and PR #51 have green checks. |
| Prepare UAT before the customer meeting. | Whole team | Before Week 4 customer session | [UAT scenarios](../../docs/user-acceptance-tests.md) are reviewed by the team. |
| Update the Week 4 report continuously instead of at the end. | Whole team | Through final submission | This report and evidence index are updated after each merge. |
| Preserve screenshots as work is completed. | Whole team | Before Moodle submission | Required screenshots are added under `reports/week4/images/`. |
| Preserve customer confirmation evidence. | Whole team | Before Moodle submission | Customer approval screenshot is added under `reports/week4/images/`. |
