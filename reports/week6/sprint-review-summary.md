# Sprint 4 Review Summary (Week 6)

**Date:** July 12, 2026
**Attendees:** Customer, Oleg Korchagin (@privel)

> Scope note: this was a short technical check-in rather than a full Sprint Review covering all of the planned agenda below. It did not include a documentation review, a UAT walkthrough, or an explicit transition-readiness sign-off. Those remain open items — see `README.md` and the Follow-Up Actions table below. [TODO: confirm whether a separate, fuller Sprint Review with the customer covering the trial release, docs, and transition-readiness is still planned before the Sprint 4 deadline, or whether this check-in is being treated as the Week 6 review.]

## Agenda Covered

1. Planned Sprint 4 Goal: Deliver a stable, customer-trialable release of FaceGuard with reviewed customer-facing documentation, so the customer can independently try the product and give feedback ahead of final transition in Week 7.
2. Antispoofing status: Oleg reported an open-source antispoofing model integrated and working, discovered during testing (informal — no documented license check or live-vs-spoof pass/fail numbers yet, see #72 open items in `README.md`).
3. Hardware / access-indicator design: the product uses LED indicators (blue = access granted, yellow = calibrating, red = denied) rather than the previously assumed motor-based indicator. Oleg has motor functionality wired on pin 17 and will switch this to LEDs, to be tested with the customer on Monday.
4. Performance: ~58 FPS locally vs. a stable ~24 FPS on the Raspberry Pi, with a brief freeze on detection events.
5. Customer-facing documentation review results: **not covered in this meeting.** [TODO — still pending]
6. Transition-readiness findings: **not covered in this meeting.** [TODO — still pending]
7. Customer trial / UAT results: **not covered in this meeting.** [TODO — still pending]
8. Resulting follow-up work: the customer assigned repository-cleanup and documentation tasks for the coming week (see below), separate from and in addition to any Sprint 5 planning.

## Key Outcomes

- Antispoofing is functionally integrated and running, with acceptable local performance (~58 FPS) and stable-but-lower Pi performance (~24 FPS).
- The LED-based status indicator is the agreed design; the motor-based version needs to be swapped out before the next check-in.
- The customer raised a general observation (not specific to this team) that some teams' code is "written nicely but not memory-efficient," and asked for a review pass on this codebase specifically.

## Follow-Up Actions for Sprint 5

| Action | Owner | Linked Issue |
|---|---|---|
| Swap motor-based indicator for LED-based indicator (pin 17 → LED logic: blue/yellow/red) and test with customer (Monday) | Oleg (@privel) | [TODO — link issue if one is created] |
| Repository cleanup: remove unused/inefficient code, review memory efficiency | Oleg (@privel) | [TODO] |
| Update README and setup/run documentation | Oleg (@privel) | [TODO] |
| Add/complete GitHub repository description and tags | Oleg (@privel) | [TODO] |
| Publish function-level documentation on GitHub Pages, parsed from existing code comments (stretch goal — "if it works out") | Oleg (@privel) | [TODO] |
| Document antispoofing model source/license and live-vs-spoof test evidence (carried over from #72 acceptance criteria) | Oleg (@privel) | [72](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/72) |
