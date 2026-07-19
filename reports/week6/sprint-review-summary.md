# Sprint 4 Review Summary (Week 6)

**Date:** July 12, 2026
**Attendees evidenced publicly:** Customer, Oleg Korchagin (@privel)

## Scope Note

This was a short technical check-in rather than a complete Sprint Review. It did
not publicly evidence a full documentation walkthrough, UAT walkthrough, or
transition-readiness sign-off. Those items were carried into Week 7.

## Agenda Covered

1. Sprint 4 goal and trial-release direction.
2. Anti-spoofing status and performance.
3. Hardware/access-indicator design mismatch.
4. Repository cleanup and documentation expectations.
5. Follow-up work for Sprint 5.

## Key Outcomes

- Anti-spoofing was reported as functionally integrated and running.
- Reported performance was around 58 FPS locally and around 24 FPS on Raspberry
  Pi.
- The customer expected LED-based feedback, not a motor-based indicator:
  blue/granted, yellow/calibrating, red/denied.
- Repository cleanup, README/setup docs, GitHub repo metadata, and optional code
  reference documentation became Sprint 5 follow-up work.

## Follow-Up Actions for Sprint 5

| Action | Linked issue |
| --- | --- |
| Replace motor-based indicator with LED-based indicator and test on hardware | [#75](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/75) |
| Repository cleanup and memory-efficiency review | [#76](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/76) |
| Update README and setup/run documentation | [#77](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/77) |
| Add repository description and tags | [#78](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/78) |
| Publish function-level documentation on GitHub Pages | [#79](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/79) |
| Document anti-spoofing source/license and formal live-vs-spoof test evidence | [#72](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/72) |
