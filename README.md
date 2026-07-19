# FaceGuard

FaceGuard is a maintained course MVP for face-recognition access monitoring.
It combines an administrator web application, a FastAPI backend, PostgreSQL
storage, a device-side recognition agent, local camera hardware, and a
customer-facing LED access indicator.

## Current Status

- Current public trial release: [v2.1.0](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v2.1.0)
- Final Assignment 6 / MVP v3 work and customer acceptance: documented in [reports/week7/README.md](reports/week7/README.md)
- Week 6 trial evidence: [reports/week6/README.md](reports/week6/README.md)
- Hosted documentation: [FaceGuard documentation](https://innopolis-robotics-society.github.io/FaceGuardV1/)
- Customer handover guide: [docs/customer-handover.md](docs/customer-handover.md)
- Public sanitized MVP v2 demo: [two-minute demo video](https://drive.google.com/file/d/1SLaFwTe7_OE0T8-UPiGuFQQmNtrOl65F/view?usp=sharing)

The product is usable as a local/private-network deployment. Full real-time
recognition still depends on a configured camera, Raspberry Pi-compatible
environment, local model data, and non-public credentials. Final customer
acceptance for independent use was recorded in the Week 7 handover review; this
does not by itself evidence a customer-side production deployment.

## Product Components

| Component | Location | Purpose |
| --- | --- | --- |
| Administrator frontend | [frontend/faceguard-web](frontend/faceguard-web/README.md) | People management, dashboard, access logs, camera status, and operator controls |
| Central backend | [backend-service](backend-service/README.md) | FastAPI API for auth, people, photos, devices, events, telemetry, commands, and audit data |
| Database | [backend-service/docker-compose.yml](backend-service/docker-compose.yml) | PostgreSQL persistence for backend data |
| Recognition agent | [agent](agent/README.md) | Camera capture, recognition, anti-spoofing/liveness checks, offline buffering, and backend sync |
| Access indicator | [agent/door/door_controller.py](agent/door/door_controller.py) | Blue/yellow/red LED feedback for granted/calibrating/denied states |
| Maintained docs | [docs](docs/index.md) | Architecture, testing, quality, roadmap, user stories, UAT, handover, and code reference |

Runtime flow:

```text
Admin browser -> React frontend -> FastAPI backend -> PostgreSQL
                                           ^
                                           |
Camera -> recognition agent -> event/sync/command API
                    |
                    v
            LED access indicator
```

## Documentation Entry Points

- [Customer handover](docs/customer-handover.md)
- [Contributing guide](CONTRIBUTING.md)
- [Agent/operator guidance](AGENTS.md)
- [Roadmap](docs/roadmap.md)
- [Architecture overview](docs/architecture/README.md)
- [Deployment diagram](docs/architecture/deployment-view/deployment-diagram.svg)
- [Testing guide](docs/testing.md)
- [Quality requirements](docs/quality-requirements.md)
- [User acceptance tests](docs/user-acceptance-tests.md)
- [Code reference](docs/code-reference.md)
- [Changelog](CHANGELOG.md)

## Run Locally

Prerequisites:

- Docker and Docker Compose
- Node.js and npm
- Python 3.11-compatible environment for direct agent runs
- A webcam or Raspberry Pi camera for real recognition checks
- Git

Do not commit real credentials, API keys, customer data, biometric images,
trained model files, generated datasets, private `.env` files, or private
submission evidence.

### Backend

```bash
cd backend-service
docker compose up --build
```

The backend should become available on `http://localhost:8000`.

Useful references:

- [Backend setup](backend-service/SETUP.md)
- [Backend API documentation](backend-service/API_DOCUMENTATION.md)
- [Database migrations](backend-service/MIGRATIONS.md)

### Frontend

```bash
cd frontend/faceguard-web
npm install
npm run dev
```

Open the Vite URL, usually `http://localhost:5173`.

### Recognition Agent

```bash
cd agent
cp .env.example .env
```

PowerShell:

```powershell
cd agent
Copy-Item .env.example .env
```

For a laptop-camera development run, keep:

```env
HARDWARE_MODE=development
CAMERA_INDEX=0
BACKEND_URL=http://localhost:8000
```

For Raspberry Pi hardware, set `HARDWARE_MODE=raspberry_pi`, configure the
camera, and wire the LED indicator using BCM GPIO numbers:

```env
LED_GRANTED_GPIO_PIN=17
LED_CALIBRATING_GPIO_PIN=27
LED_DENIED_GPIO_PIN=22
```

Then start the agent:

```bash
cd agent
docker compose up --build
```

If Docker camera passthrough is not suitable, use the direct Python option in
[agent/SETUP.md](agent/SETUP.md).

## Smoke Check

1. Start backend and database.
2. Start the frontend.
3. Start the recognition agent with a development camera or simulated camera.
4. Register or log in as an administrator.
5. Add a disposable test person with reference photos.
6. Rebuild or reload the recognition model from the UI/API.
7. Trigger a recognition attempt or inspect simulated/offline behavior.
8. Verify access events appear in Dashboard/Access Logs.
9. Verify System shows backend/device/camera/recognition status.
10. On Raspberry Pi hardware, verify LED states:
    - blue: access granted / manual open signal;
    - yellow: calibration or operator-attention signal;
    - red: unknown or denied access signal.

## Verification Commands

Backend tests:

```bash
cd backend-service
pytest tests/unit -v
pytest tests/integration -v
pytest tests/qrt -m qrt -v
```

Frontend build and helper tests:

```bash
cd frontend/faceguard-web
npm ci
npm run build
npm test -- --run
```

Documentation:

```bash
mkdocs build --strict
```

Deployment configuration:

```bash
docker compose -f backend-service/docker-compose.yml config --quiet
```

## Reports and Releases

- [Week 2 report](reports/week2/README.md)
- [Week 3 / MVP v1 report](reports/week3/README.md)
- [Week 4 / v1.1.0 report](reports/week4/README.md)
- [Week 5 / MVP v2 report](reports/week5/README.md)
- [Week 6 / trial release report](reports/week6/README.md)
- [Week 7 / finalization report](reports/week7/README.md)
- [v1.0.0 release](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v1.0.0)
- [v1.1.0 release](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v1.1.0)
- [v2.0.0 release](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v2.0.0)
- [v2.1.0 trial release](https://github.com/Innopolis-Robotics-Society/FaceGuardV1/releases/tag/v2.1.0)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
