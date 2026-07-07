# Customer Handover — FaceGuard

**Status as of:** Week 7 / Assignment 6 final submission
**Handover level reached:** `[Ready for independent use | Independently used by customer | Deployed or operated on customer side]` — [TODO: pick the one actually reached]
**Customer-confirmation status:** `[Accepted | Accepted with follow-up items | Not yet accepted]` — [TODO: pick the one actually reached]

> This document describes the **actual current** handover state of FaceGuard, not an aspirational future state. It is updated whenever access details, deployment steps, limitations, or transition status change.

## 1. What Was Transferred / Delegated / Retained

| Item | Status | Notes |
|---|---|---|
| Repository ownership / access | [Transferred / Shared / Retained by team] | [TODO] |
| Hosting / deployment account | [Transferred / Shared / Retained by team] | [TODO] |
| Domain / hosted docs site | [Transferred / Shared / Retained by team] | [TODO] |
| CI/CD (GitHub Actions) | [Transferred / Shared / Retained by team] | [TODO] |
| Admin / enrollment credentials | [Transferred / Shared / Retained by team] | [TODO — do not put actual secrets here] |

## 2. Configuration & Environment

The product is configured via a `.env` file (see `backend/.env.example` for the full list of keys). The customer should know, at minimum:

- `[ENV_VAR_1]` — [what it controls, without exposing the actual secret value]
- `[ENV_VAR_2]` — [what it controls]
- External services used: `[e.g. face-recognition model weights source, storage backend]`
- Secrets (API keys, DB credentials) are **not** stored in the repository; they are provided to the customer via [TODO: private channel, e.g. the Week 7 Moodle private submission / a shared secrets manager] and must never be committed.

## 3. Setup, Deployment, Recovery & Verification Steps

- **Setup / local run:** see [README.md § Access & Running the Product](../README.md#access--running-the-product)
- **Deployment:** [TODO: how MVP v3 is currently deployed — Docker Compose on customer server / cloud host / etc.]
- **Recovery (if the service goes down):** [TODO: restart steps, where logs live, who to contact]
- **Verification that the deployed instance is healthy:** [TODO: e.g. `GET /health` endpoint, or a specific dashboard check]

## 4. Main Documentation Entry Points for Normal Use

| Need | Document |
|---|---|
| First-time overview | [README.md](../README.md) |
| Day-to-day operation (enrollment, monitoring, alerts) | [Hosted docs](https://innopolis-robotics-society.github.io/FaceGuardV1/) |
| Troubleshooting / support | [§5 below](#5-troubleshooting--support) |
| Known limitations | [§6 below](#6-known-limitations) |

## 5. Troubleshooting & Support

| Symptom | Likely cause | What to do |
|---|---|---|
| [TODO: e.g. recognition accuracy drops in low light] | [TODO] | [TODO] |
| [TODO: e.g. dashboard shows no live feed] | [TODO] | [TODO] |

**Support going forward:** [TODO: e.g. "no ongoing support contract; customer's technical contact is X" or "team available for Y weeks post-course for critical fixes only"]

## 6. Known Limitations

- [TODO — list current, real limitations of MVP v3, e.g. accuracy under poor lighting, scale limits, unsupported camera models, etc.]

## 7. Is the Current Documentation Sufficient for the Reached Handover Level?

[TODO: explicit statement — e.g. "Yes, for Ready for independent use: setup, run, and troubleshooting steps have been followed successfully by the customer without team assistance during the Week 6 trial." Or explain what support still remains necessary.]

## 8. Follow-Up Items (if customer-confirmation status is not "Accepted")

- [TODO: list outstanding items, whether the blocker is team-side, customer-side, or external, and what remains to be done.]

## 9. Confirmation Evidence

- Confirmation was requested from the customer on [TODO date] via [TODO channel].
- Private evidence of the request/response is included in the Week 7 Moodle submission (not committed here).
- Public sanitized summary: see [reports/week7/README.md](../reports/week7/README.md).
