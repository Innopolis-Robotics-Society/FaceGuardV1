# Contributing

This repository is maintained as a course product, so every change should leave
the product, evidence, and handover state easier to inspect.

## Workflow

1. Start from an up-to-date `main`.
2. Create a focused branch for the issue or report change.
3. Link the branch, pull request, and commit message to the relevant issue when
   possible.
4. Keep public evidence in the repository and private evidence in Moodle or the
   approved private channel.
5. Request review from a different teammate before merging.
6. Update documentation when setup, access, deployment, handover, or product
   limitations change.

## Definition of Done

A change is Done when:

- the acceptance criteria are checked;
- the implementation is merged through a reviewed pull request;
- relevant tests or manual checks are recorded;
- no secrets, biometric samples, private recordings, or credentials are added;
- `README.md`, `docs/customer-handover.md`, reports, and release notes are
  updated when affected;
- the GitHub issue or Sprint status reflects the real state.

## Local Checks

Backend:

```bash
cd backend-service
pytest tests/unit -v
pytest tests/integration -v
pytest tests/qrt -m qrt -v
```

Frontend:

```bash
cd frontend/faceguard-web
npm ci
npm run build
npm test -- --run
```

Docs and deployment config:

```bash
mkdocs build --strict
docker compose -f backend-service/docker-compose.yml config --quiet
```

## Public and Private Evidence

Commit only sanitized public artifacts. Keep these out of the repository:

- private customer recordings and exact private timecodes;
- customer-identifying screenshots unless explicitly sanitized;
- credentials, tokens, `.env` files, API keys, database dumps, and secrets;
- biometric images, trained models built from private photos, and generated
  recognition datasets;
- Moodle-only PDFs, slide decks, and rehearsal videos.

## Documentation Expectations

When changing behavior, update the nearest maintained document:

- `README.md` for public entry point and run guidance;
- `docs/customer-handover.md` for transition/access/support state;
- `docs/testing.md` and `docs/quality-requirements.md` for checks and quality
  gates;
- `docs/roadmap.md` and reports for Sprint status;
- `CHANGELOG.md` for user-visible changes.
