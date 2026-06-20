# Face Guard

Face Guard is an access-control system for restricted rooms and protected areas. It combines an administrator web interface, backend services, and a Raspberry Pi device agent.

## Project structure

- `frontend/prototype` - interactive MVP v0 administrator interface
- `backend` - Raspberry Pi/local access-control backend
- `backend-service` - central backend service and database API
- `raspberry-agent` - Raspberry Pi agent experiments
- `reports/week2` - Assignment 2 documentation
- `reports/week3` - Assignment 3 documentation and reporting index

## Local MVP v0 setup

Prerequisites: Node.js 20.19 or later and npm.

```bash
cd frontend/prototype
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Production-style frontend container

```bash
cd frontend/prototype
docker build -t faceguard-prototype .
docker run --rm -p 3000:80 faceguard-prototype
```

Open <http://localhost:3000>.

## Deployed MVP v0

- University VM: <http://10.90.138.70:3000> (university network or VPN)
- Public frontend demonstration: <https://innopolis-robotics-society.github.io/FaceGuardV1/>
- [MVP v0 report and smoke check](reports/week2/mvp-v0-report.md)

The public GitHub Pages site contains the static frontend demonstration. Real recognition, production authentication, camera input, and persistent backend integration remain outside MVP v0.

## MVP v1 architecture

The intended MVP v1 vertical slice is:

```text
React website -> central FastAPI backend/PostgreSQL -> device agent -> real camera
```

The browser must use the central backend as its product API. It must not receive the device-agent API key or call privileged device-agent endpoints directly.

Current implementation and verification status:

- `frontend/prototype` contains the MVP v0 administrator web client.
- `backend-service` contains the central FastAPI backend and PostgreSQL Docker Compose setup.
- `backend` contains the current Raspberry Pi/local device-agent service documentation and run scripts.
- `raspberry-agent` contains earlier Raspberry Pi agent experiments.
- [TODO: confirm which frontend directory is the active MVP v1 frontend after integration]
- [TODO: confirm the deployed MVP v1 architecture with smoke-test evidence]

## MVP v1 prerequisites

- Node.js 20.19 or later and npm for the frontend prototype.
- Docker and Docker Compose for PostgreSQL and the central backend.
- Python 3.11 for native device-agent execution.
- A real camera available to the device agent for final MVP v1 verification.
- Network access from the central backend to the device agent when the integrated camera path is tested.

## Environment configuration

Use example environment files as templates, then replace placeholders locally:

- `backend-service/.env.example` documents central backend settings such as `DATABASE_URL`, `SECRET_KEY`, and token lifetime.
- `backend/.env.example` documents device-agent settings such as `API_KEY`, camera settings, hardware mode, and optional `CENTRAL_SERVER_URL`.

Do not commit real secrets, customer data, generated credentials, or device-agent API keys. Production and deployment values must be stored outside the repository.

## Start central backend and PostgreSQL

The central backend Docker Compose file is in `backend-service/docker-compose.yml`.

```bash
cd backend-service
docker compose up --build
```

Health check from the existing backend-service documentation:

```bash
curl http://localhost:8000/api/v1/system/health
```

[TODO: verify the command on the target deployment host and record the result in the Week 3 report]

## Start device agent and real camera

For Windows development with a local webcam:

```powershell
cd backend
PowerShell -ExecutionPolicy Bypass -File .\scripts\run_windows.ps1
```

For Raspberry Pi or Linux:

```bash
cd backend
chmod +x scripts/run_linux.sh
./scripts/run_linux.sh
```

For Linux/Raspberry Pi Docker use:

```bash
cd backend
cp .env.example .env
docker compose up --build
```

Agent endpoints from the existing device-agent documentation:

```text
Swagger: http://127.0.0.1:8081/docs
Health:  http://127.0.0.1:8081/api/v1/health
Camera:  GET /api/v1/camera/snapshot or GET /api/v1/camera/stream
```

[TODO: verify with a real camera and record whether simulation was disabled]

## Start frontend

Current verified frontend command for the MVP v0 prototype:

```bash
cd frontend/prototype
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

[TODO: document the MVP v1 central-backend configuration once the frontend integration is merged]

## MVP v1 smoke check

Before an MVP v1 release, record evidence for each applicable check:

| Check | Expected evidence |
|---|---|
| Central backend health endpoint responds | command output or screenshot |
| PostgreSQL-backed backend paths work | API request log or test output |
| Device agent health endpoint responds | command output or screenshot |
| Real camera snapshot or stream is available | screenshot or sanitized video frame |
| Frontend uses central backend | browser/API evidence |
| Device-agent API key is not exposed to the browser | configuration/code review evidence |
| US-01, US-02, US-03, and US-11 acceptance criteria are verified | PR evidence links |

## Delivered MVP v1 access

- MVP v1 deployment/access point: [TODO]
- MVP v1 SemVer release: [TODO]
- Public demo video under two minutes: [TODO]
- Week 3 report: [reports/week3/README.md](reports/week3/README.md)

## Week 2 report

[Assignment 2 / Week 2 report](reports/week2/README.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
