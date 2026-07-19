# Sprint 4 Retrospective (Week 6)

**Date:** July 12, 2026
**Participants:** Emil Vagizov, Danila Naboishchikov (@Sparta2016840), Oleg Korchagin (@privel), rmxqwo, etherealboop

## What Went Well

- #69 (trial release) and #72 (anti-spoofing) both closed by Sprint 4 end, delivered together through a single reviewed PR (#73).
- Antispoofing is functionally working — an open-source model is integrated and demonstrated live to the customer, with acceptable performance (~58 FPS locally, stable ~24 FPS on Raspberry Pi).
- Docs polish (#70) reviewed by @etherealboop and closed via this PR — customer-handover.md kept current for the trial release.

## What Didn't Go Well

- The LED-vs-motor mismatch: Oleg built and tested a motor-based access indicator on the assumption it was the agreed design, but the customer expected LEDs. This wasn't caught until the July 12 check-in — a sign we should confirm hardware/UI decisions explicitly rather than assuming.
- We hadn't confirmed in advance what the July 12 meeting would actually cover, so it ended up being a narrow technical check-in rather than the full documentation review / UAT / transition-readiness Sprint Review the assignment calls for. That conversation was carried into the Week 7 final handover review.
- #72's original acceptance criteria (documented license, live-vs-spoof test pass/fail numbers) still aren't formally recorded, even though the feature works — this is a gap between "closed" on GitHub and "fully Done" against the PBI's own criteria.

## What We'll Change for Sprint 5

Sprint 5 is a finalization Sprint: the team is not introducing new process changes, but focusing on closing the open items below (LED swap, repo cleanup, docs, antispoofing license/test evidence, and the still-outstanding customer documentation review, UAT, and transition-readiness conversation) so the product can be transitioned cleanly.

## Action Items Carried Into Sprint 5

- Swap the motor-based access indicator for the LED-based design and capture customer-side hardware confirmation after the Week 7 technical update.
- Clean up the repository: remove unused/inefficient code, review memory efficiency.
- Update README and setup/run documentation; add/complete the GitHub repo description and tags.
- Stretch goal: publish function-level documentation on GitHub Pages, parsed from existing code comments.
- Document the antispoofing model's source and license, and record live-vs-spoof test evidence (carried over from #72's original acceptance criteria).
- Schedule a proper documentation review, UAT walkthrough, and transition-readiness discussion with the customer after the technical finalization pass.
