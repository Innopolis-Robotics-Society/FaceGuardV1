# Week 3 Reflection

## Learning points

This week we moved from a prototype-style product view to a real issue-based Sprint scope. The biggest lesson was that the Product Backlog needs to be concrete enough for implementation: user stories alone were not enough, so we decomposed the selected MVP v1 scope into supporting PBIs for backend persistence, frontend integration, camera access, recognition events, dashboard data, and end-to-end verification.

We also learned that report artifacts must stay synchronized with GitHub Issues, milestones, PRs, and review evidence. When the implementation moved quickly, documentation links and story status could become stale very easily. Keeping stable user-story IDs, issue links, PR evidence, and known limitations together made the final scope much easier to explain.

## Validated assumptions

The customer validated that the selected MVP v1 direction was useful: viewing authorized people, adding people with photos, seeing dashboard data, and showing the connected camera/status were enough for this increment. The review also confirmed that the known recognition-model refresh limitation is acceptable as a tracked follow-up bug rather than a blocker for MVP v1.

The implementation confirmed that the product needs a real backend/database path. Mock frontend data was useful for MVP v0, but it was not enough for MVP v1 because dashboard data, people, camera status, and recognition events need one shared source of truth.

## Friction and gaps

The main friction was integration across different environments. Windows was useful for fast development, but the customer correctly pointed out that Ubuntu and Raspberry Pi behavior can differ. Recognition refresh after person changes also remained incomplete: adding or removing a person currently requires a model rebuild or restart workaround before recognition uses the new data.

On the process side, some report links, GitHub Project evidence, release evidence, screenshots, and customer-review artifacts were still easy to miss. This showed that the submission checklist needs to be maintained continuously rather than filled in only at the end.

## Planned response

Next Sprint we should stabilize the system on Ubuntu first, then continue toward Raspberry Pi deployment. We should keep BUG-01 for recognition refresh visible in the backlog, add a follow-up item for limiting captured user photos, and continue moving future work through issue-linked PRs with clear verification evidence.

For reporting, we should finish the remaining public evidence: GitHub Project views, screenshots, SemVer release, deployment/access link, demo video, and the final customer-review transcript or private-sharing note depending on publication permission.
