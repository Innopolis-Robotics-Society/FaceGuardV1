# Week 6 Reflection

## What We Learned From the Trial Release

Bundling the trial-release deployment (#69) and the anti-spoofing work (#72) into a single PR (#73) meant both landed and were verified together as part of the same upstream-sync merge, rather than as two separate, harder-to-test increments. In practice, PR #73 turned out to be mostly an upstream MVP v2.0.0 sync (docs, CI, testing framework) with fork-specific antispoofing and Raspberry Pi support preserved through it, rather than net-new feature work — worth being precise about in our own records so we don't overstate what Sprint 4 built versus what it integrated and verified.

## What We Learned From the Documentation Review

The July 12 customer check-in didn't include a documentation walkthrough — it turned out to be a narrower technical check-in on antispoofing and hardware rather than the full Sprint Review we'd planned. That's a process gap worth noting for ourselves: we hadn't confirmed in advance exactly what the meeting would cover, so the documentation review, UAT, and transition-readiness conversation never happened. [TODO: still need to schedule that conversation before the Sprint 4 deadline.]

## What We Learned From the Customer Meeting

The meeting surfaced a mismatch we hadn't caught ourselves: the customer expected an LED-based access indicator (blue/yellow/red for granted/calibrating/denied), but Oleg had built and tested a motor-based indicator instead, on the assumption that was the agreed design. Neither side had explicitly re-confirmed this before the meeting. The customer also gave concrete, useful feedback on antispoofing performance expectations (FPS on local vs. Raspberry Pi) and flagged repository hygiene (unused/inefficient code, missing docs, missing repo description/tags) as a general expectation across teams that applies to us too.

## Transition Blockers Discovered

- The LED-vs-motor mismatch is a small but real transition risk: if we hadn't caught it now, it would have shown up at final handover. Oleg is switching to LEDs and testing with the customer on Monday.
- Anti-spoofing / liveness detection (#72) is functionally working — an open-source model is integrated and Oleg demonstrated it live — but the license and formal live-vs-spoof test evidence from the original PBI acceptance criteria are still undocumented. This is a real gap, not just a formality, since it affects whether #72 can honestly be called fully Done.
- Documentation review, UAT, and transition-readiness sign-off are still outstanding with the customer — this is the main blocker to closing out Sprint 4 honestly.

## What We'd Do Differently

Sprint 5 is a finalization Sprint rather than a place for new process experiments — the team's focus is closing out the open items above (LED swap, repo cleanup, docs, antispoofing license/test evidence) and finally holding the documentation review, UAT, and transition-readiness conversation with the customer that didn't happen this week.
