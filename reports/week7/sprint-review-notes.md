# Sprint 5 Review Notes

These public notes summarize the Week 7 finalization and customer handover
review without exposing private credentials or exact access details.

## Agenda

1. Check Week 6 follow-up items.
2. Review the LED indicator replacement for the motor-based assumption.
3. Review updated public handover documentation.
4. Identify remaining release, customer-confirmation, and evidence blockers.
5. Prepare final Moodle/private evidence checklist.
6. July 19 report-only status pass after final technical updates.
7. Review final customer acceptance from the July 19 recorded handover meeting.

## Notes

- The LED indicator issue was addressed in code by keeping the historical
  `open_door` command name but changing its effect to a blue granted LED
  signal.
- Unknown and denied recognition paths now trigger the red denied LED signal.
- Yellow calibrating/operator-attention state is available through the
  controller and configuration.
- The public README now routes reviewers to handover, contributor guidance,
  agent guidance, testing, quality, roadmap, architecture, code reference, and
  reports.
- The handover document now states the actual status: accepted for independent
  local/private-network use after the July 19 customer review.
- Final release, public sanitized MVP v3 demo publication, physical hardware
  evidence, and repository metadata are still separate non-code tasks.
- July 19 local checks:
  - `python -B -m py_compile agent/core/config.py agent/door/door_controller.py agent/events/event_handler.py` passed.
  - `mkdocs build --strict --site-dir C:\tmp\faceguard-mkdocs-check` passed.
  - `docker compose -f backend-service/docker-compose.yml config --quiet` was not completed because Docker was unavailable in the local PATH.
- The July 19 final handover review was recorded with permission. The customer
  confirmed that the provided handover file and repository were sufficient and
  accepted the project as ready for independent use.

## Decisions

- Claim customer acceptance only for the July 19 final handover scope evidenced
  by the recorded meeting materials.
- Do not claim customer-side deployment without evidence.
- Treat #78 as admin/settings work, not as a code task.
- Treat LED GPIO verification as manual hardware evidence, not CI automation.
