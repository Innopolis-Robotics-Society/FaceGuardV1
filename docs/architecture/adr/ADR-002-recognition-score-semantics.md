# ADR-002 - Recognition Score Semantics

- Status: Accepted for MVP v2 documentation
- Date: 2026-07-02
- Related quality requirements: [QR-REL-001](../../quality-requirements.md#qr-rel-001-recognition-score-semantics-are-consistent)
- Related modules: `agent/recognition`, `frontend/faceguard-web/src/utils/recognitionScore.js`, `backend-service/app/schemas/schemas.py`
- Related issues: [#59](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/59), [#61](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/61)

## Context

The agent uses OpenCV LBPH face recognition. `predict()` returns a label and a
distance-like score where lower values are better matches. Historical repository
fields name this value `confidence`, which can be confused with a higher-is-
better probability.

## Decision

FaceGuard keeps the existing `confidence` field for compatibility, but treats
it as raw LBPH match distance in code, tests, documentation, and UI labels.
The accepted boundary is `distance < threshold`; equality is rejected.

## Alternatives Considered

- Rename the database column immediately. This would require migration and
  compatibility work beyond the small Sprint 3 / Assignment 5 QA scope.
- Continue displaying `100 - confidence` as a percentage. This reverses or
  distorts the real semantics and can produce misleading values.
- Add a calibrated probability. This requires empirical calibration data that
  the repository does not currently contain.

## Consequences

The UI can display stronger and weaker matches consistently without pretending
the score is a probability. Future work can add an explicit
`recognition_distance` alias and a calibrated display score.
