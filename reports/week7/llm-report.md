# LLM / AI Tool Usage Report - Week 7

| Tool | Used for | How it was used | Verified by |
| --- | --- | --- | --- |
| Codex | Repository inspection, issue/status overview, code edits, and documentation drafting | Pulled the latest `main`, inspected Assignment 6 requirements and GitHub issue data, implemented the LED indicator change, drafted/updated public docs and Week 7 reports, and planned verification commands. | July 19 report-only pass rechecked report status against local verification results |
| Codex | July 19 report-only update | Updated Week 6/Week 7 report wording after final technical fixes, removed stale planned-check phrasing, and separated customer acceptance from hardware/deployment evidence. No code or non-report files were edited in this pass. | `python -B -m py_compile ...` passed; `mkdocs build --strict --site-dir C:\tmp\faceguard-mkdocs-check` passed; Docker Compose config check could not run because Docker was unavailable in PATH |
| Codex | July 19 customer-handover evidence update | Read the provided meeting recap, protocol, and transcript for the final recorded handover review, then updated public handover/report status to accepted for independent use without publishing raw private evidence or credentials. | Based on the provided July 19 meeting materials; maintainer should keep the source recording/protocol/transcript in the private Moodle evidence package |

## Notes

- AI-assisted content is limited to repository-visible code, documentation, and
  public status summaries.
- No private customer recordings, credentials, or exact timecodes were invented
  or committed.
- Customer acceptance is marked as completed only for the July 19 final
  handover scope evidenced by the provided meeting materials.
- Hardware validation and production deployment remain explicitly separated
  where evidence was not available.
