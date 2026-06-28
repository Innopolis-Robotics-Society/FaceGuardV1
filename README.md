# FaceGuard

FaceGuard is an MVP access-control system for restricted rooms and protected areas. MVP v1 combines an administrator web application, a central backend with persistent storage, a device-side face-recognition agent, and a locally connected camera.

## MVP v1 Status

MVP v1 was delivered through [PR #37](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/37). The selected Sprint 1 scope covers:

- [US-01: View all people with access](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/13)
- [US-02: Add a person to the access list](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/14)
- [US-03: View system dashboard](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/15)
- [US-11: View connected entrance camera](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/issues/24)

The complete Assignment 3 submission index is available in the [Week 3 report](reports/week3/README.md).

## Assignment 4 / v1.1.0 Status

FaceGuard v1.1.0 was published as the Assignment 4 Sprint increment:

- Release: [FaceGuard v1.1.0](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v1.1.0)
- Protected-main CI: [Quality gates run](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/actions/runs/28328689056)
- Week 4 report: [Assignment 4 / Week 4 report](reports/week4/README.md)
- Project presentation: [Five-minute project presentation](https://drive.google.com/file/d/1sdwue996O--n4EDrhZsA01T88WiFIMfv/view?usp=sharing)
- Private-network deployment: http://10.93.26.183:5173/
- Customer confirmation: [Week 4 report evidence](reports/week4/README.md#13-uat)

The deployment is customer-accessible on the Innopolis University private
network.

## MVP v1 Architecture

MVP v1 is hardware-dependent but locally reproducible. It consists of these parts:

| Component | Location | Purpose |
| --- | --- | --- |
| Administrator frontend | [frontend/faceguard-web](frontend/faceguard-web/README.md) | People management, dashboard, recent recognition events, camera status, and camera preview |
| Central backend | [backend-service](backend-service/README.md) | FastAPI service for people, recognition events, camera-facing integration endpoints, and persistent data access |
| Database | Managed by [backend-service](backend-service/README.md) | Stores authorized people, uploaded reference metadata, and recognition/access events |
| Recognition agent | [agent](agent/README.md) | Runs on the machine connected to the camera, performs face-recognition workflow, and sends events to the backend |
| Camera | Local laptop, USB, virtual, or later Raspberry Pi camera | Provides the live image source for MVP v1 testing and recognition |

High-level runtime flow:

```text
Admin browser -> frontend -> central backend -> database
                                      ^
                                      |
Laptop/USB camera -> recognition agent -> recognition/access events
```

The frontend and backend can be started from this repository. The recognition agent runs locally on a team laptop in development mode and uses the laptop's built-in webcam, a USB webcam, or a virtual camera.

## Deployment and Access Model

FaceGuard MVP v1 is not deployed as a permanent public camera stream because the recognition workflow depends on local hardware and may process biometric data.

The reproducible MVP v1 access point is:

- the source code in this repository;
- the published `v1.0.0` GitHub Release and generated source archive;
- the published Assignment 4 `v1.1.0` GitHub Release for the Sprint 2
  increment;
- the local run instructions in this README;
- the public sanitized [MVP v1 demo video](https://drive.google.com/file/d/1ROzA_gZtCb6iZ-BpT2tHCJFFDoohaqqQ/view?usp=sharing);
- the public [Week 4 project presentation](https://drive.google.com/file/d/1sdwue996O--n4EDrhZsA01T88WiFIMfv/view?usp=sharing);
- the reviewed MVP v1 integration PR: [PR #37](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/pull/37).

The Week 4 deployment is available at `http://10.93.26.183:5173/` for users on
the Innopolis University private network.

## Project Backlog and Reports

- [Product Backlog project view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/1)
- [Sprint Backlog project view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/2)
- [MVP v1 scope project view](https://github.com/orgs/Innopolis-Robotics-Society/projects/7/views/3)
- [User-story index](docs/user-stories.md)
- [Roadmap](docs/roadmap.md)
- [Definition of Done](docs/definition-of-done.md)
- [Quality requirements](docs/quality-requirements.md)
- [Quality requirement tests](docs/quality-requirement-tests.md)
- [Testing guide](docs/testing.md)
- [User acceptance tests](docs/user-acceptance-tests.md)
- [Changelog](CHANGELOG.md)
- [MVP v1 release notes](reports/week3/release-notes-v1.0.0.md)
- [Assignment 4 release notes](reports/week4/release-notes-v1.1.0.md)
- [Customer review summary](reports/week3/customer-review-summary.md)
- [Customer review transcript](reports/week3/customer-review-transcript.md)
- [Assignment 4 / Week 4 report](reports/week4/README.md)

## Prerequisites

Install these tools before running the full local MVP v1 workflow:

- Docker and Docker Compose
- Node.js and npm
- Python environment compatible with the recognition-agent dependencies
- A laptop webcam, USB webcam, or virtual camera
- Git

The commands below use Docker Compose v2 syntax, `docker compose`. If the local machine uses the legacy Compose CLI, replace it with `docker-compose`.

Do not commit real credentials, API keys, customer data, generated datasets, biometric images, or private `.env` values.

## Run the Central Backend

Start the backend and its database services first:

```bash
cd backend-service
docker compose up --build
```

The backend API should become available on `http://localhost:8000`.

Useful backend references:

- [Backend setup guide](backend-service/SETUP.md)
- [Backend API documentation](backend-service/API_DOCUMENTATION.md)
- [Database migrations](backend-service/MIGRATIONS.md)

## Run the Frontend

Start the administrator web interface in a second terminal:

```bash
cd frontend/faceguard-web
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Run the Recognition Agent with a Laptop Camera

Create a local agent environment file:

```bash
cd agent
cp .env.example .env
```

PowerShell equivalent:

```powershell
cd agent
Copy-Item .env.example .env
```

For laptop-camera testing, set these values in `agent/.env`:

```env
HARDWARE_MODE=development
CAMERA_INDEX=0
```

Use `CAMERA_INDEX=0` for the default built-in webcam. If an external or virtual camera is used, change the index according to the local machine.

The backend URL must point to the running central backend. For local development, use the value documented in [agent/QUICKSTART.md](agent/QUICKSTART.md) for the selected run mode.

Then start the agent using the current agent quickstart:

```bash
cd agent
docker compose up --build
```

If Docker camera passthrough is not suitable on the local operating system, use the Python/direct-run option documented in [agent/QUICKSTART.md](agent/QUICKSTART.md).

## MVP v1 Smoke Test

Use this repeatable check to verify the delivered increment:

1. Start the backend and database.
2. Start the frontend.
3. Start the recognition agent with `HARDWARE_MODE=development` and `CAMERA_INDEX=0`.
4. Open the administrator interface in the browser.
5. Verify that the People page loads authorized people from the backend.
6. Add a person with reference photos.
7. Refresh the browser and verify that the person remains stored.
8. Verify that the camera preview/status is visible in the web interface.
9. Trigger or simulate a recognition attempt.
10. Verify that recognition/access events appear in the dashboard.
11. Verify that dashboard metrics, recent events, and charts use backend data.
12. Remove a test person and verify that the People list updates.

## Manual Link and Command Check

Before submitting a PR that changes this README:

```bash
git status --short
```

Manually check that:

- the backend command matches [backend-service](backend-service/README.md);
- the frontend command matches [frontend/faceguard-web](frontend/faceguard-web/README.md);
- the agent camera configuration matches [agent/QUICKSTART.md](agent/QUICKSTART.md);
- repository links render correctly in GitHub;
- no secret, private `.env`, biometric image, or generated dataset is included.

## Repository Layout

- [frontend/faceguard-web](frontend/faceguard-web/README.md) - active administrator web application for MVP v1
- [backend-service](backend-service/README.md) - central FastAPI backend and persistent data layer
- [agent](agent/README.md) - local recognition and camera agent
- [docs](docs/user-stories.md) - current user stories, roadmap, and Definition of Done
- [reports/week2](reports/week2/README.md) - Assignment 2 / MVP v0 report
- [reports/week3](reports/week3/README.md) - Assignment 3 / MVP v1 report
- [reports/week4](reports/week4/README.md) - Assignment 4 / Week 4 report, quality gates, embedded evidence, UAT, and release documentation

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
