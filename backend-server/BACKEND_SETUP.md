# FaceGuard Backend Setup Guide

**Version:** 1.0.0  
**Last Updated:** June 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Environment Variables](#environment-variables)
5. [Docker Services](#docker-services)
6. [First Startup](#first-startup)
7. [Database Migrations](#database-migrations)
8. [Initial Administrator Creation](#initial-administrator-creation)
9. [Windows PowerShell Setup](#windows-powershell-setup)
10. [Docker Desktop Instructions](#docker-desktop-instructions)
11. [Mock Raspberry Pi Agent Testing](#mock-raspberry-pi-agent-testing)
12. [Command Testing](#command-testing)
13. [Recognition Event Testing](#recognition-event-testing)
14. [Raspberry Pi OS 64-bit Installation](#raspberry-pi-os-64-bit-installation)
15. [Device Token Setup](#device-token-setup)
16. [REST and WebSocket Connection Details](#rest-and-websocket-connection-details)
17. [Offline Docker Image Export/Import](#offline-docker-image-exportimport)
18. [Backup Instructions](#backup-instructions)
19. [API Endpoint Summary](#api-endpoint-summary)
20. [Swagger Documentation](#swagger-documentation)
21. [Security Notes](#security-notes)
22. [Troubleshooting](#troubleshooting)
23. [Known Limitations](#known-limitations)
24. [Production Checklist](#production-checklist)

---

## Overview

FaceGuard Backend is a centralized FastAPI server that manages:

- **User authentication** (JWT + role-based access control)
- **Device management** (multiple Raspberry Pi devices)
- **Person and photo management** (UUID-based storage)
- **Recognition events** (access logs and unknown persons)
- **Device commands** (reboot, capture, train model)
- **Telemetry** (CPU, RAM, disk, camera status)
- **Audit logging** (administrator actions)
- **Backups** (database + files)
- **WebSocket connections** (real-time device and admin updates)

The backend runs **fully offline** in a local network. No internet access is required after installation.

---

## Architecture

```text
React Admin Panel (Frontend)
        ↓
FastAPI Backend (backend-server)
        ↓
PostgreSQL Database
        ↓
File Storage (/data)
        ↓
Raspberry Pi Agent (backend/)
        ↓
Camera + OpenCV + Servo
```

### Key Components

- **backend-server/**: Centralized FastAPI backend (this guide)
- **backend/**: Raspberry Pi agent (existing, not modified)
- **PostgreSQL**: Metadata storage
- **File system**: Photos, videos, models, logs, backups

---

## Directory Structure

```text
FaceGuardV1/
├── backend-server/              # NEW centralized backend
│   ├── app/
│   │   ├── api/v1/             # REST endpoints
│   │   ├── core/               # config, security, permissions
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # business logic
│   │   ├── websockets/         # WebSocket handlers
│   │   └── main.py             # FastAPI app
│   ├── alembic/                # Database migrations
│   ├── tests/                  # Automated tests
│   ├── mock_agent/             # Mock Raspberry Pi for testing
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── backend/                     # Existing Raspberry Pi agent
├── docker-compose.yml           # Main orchestration
└── data/                        # Persistent storage
    ├── faces/
    ├── events/
    ├── videos/
    ├── logs/
    └── backups/
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Application
ENVIRONMENT=development
APP_NAME=FaceGuard Backend
APP_VERSION=1.0.0

# Server
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql://faceguard:faceguard@postgres:5432/faceguard

# Security
SECRET_KEY=<generate-with-openssl-rand-hex-32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (frontend URLs)
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# File Storage
DATA_DIR=/data
MAX_UPLOAD_SIZE_MB=10

# Logging
LOG_LEVEL=INFO
```

**Generate secure SECRET_KEY:**

```bash
openssl rand -hex 32
```

---

## Docker Services

### docker-compose.yml

```yaml
services:
  postgres:       # PostgreSQL database
  backend:        # FastAPI backend server
  mock-agent:     # Mock Raspberry Pi (testing profile)
```

### Volumes

- **postgres_data**: PostgreSQL database
- **faceguard_data**: Photos, videos, models, logs, backups

---

## First Startup

### On Windows 11 with Docker Desktop

1. **Install Docker Desktop:**
   - Download from https://www.docker.com/products/docker-desktop
   - Enable WSL 2 backend
   - Start Docker Desktop

2. **Open PowerShell in project root:**

```powershell
cd D:\CODE\IU\Software-summer\FaceGuardV1
```

3. **Create `.env` file:**

```powershell
Copy-Item backend-server\.env.example backend-server\.env
```

4. **Edit `backend-server\.env`** and set `SECRET_KEY`

5. **Start services:**

```powershell
docker compose up --build
```

6. **Wait for services to be healthy:**
   - PostgreSQL: ~10 seconds
   - Backend: ~30 seconds (runs migrations automatically)

7. **Verify:**
   - Backend: http://localhost:8000
   - Swagger: http://localhost:8000/docs
   - Health: http://localhost:8000/api/v1/system/health

---

## Database Migrations

Migrations run **automatically** on backend container startup.

### Manual Migration Commands

```bash
# Inside backend container
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Downgrade
docker compose exec backend alembic downgrade -1
```

---

## Initial Administrator Creation

**First user registration is open.** After the first user is created, registration is disabled.

### Using cURL (PowerShell)

```powershell
$body = @{
    username = "admin"
    password = "your-secure-password"
    role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Using Swagger UI

1. Go to http://localhost:8000/docs
2. Expand `POST /api/v1/auth/register`
3. Click "Try it out"
4. Enter:
   ```json
   {
     "username": "admin",
     "password": "your-secure-password",
     "role": "admin"
   }
   ```
5. Click "Execute"

### Login and Get Token

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login?username=admin&password=your-secure-password" -Method POST
$token = $response.access_token
echo $token
```

Use this token in `Authorization: Bearer <token>` header for subsequent requests.

---

## Windows PowerShell Setup

### Prerequisites

- Windows 11 Pro
- Docker Desktop 4.x+
- PowerShell 7+

### Quick Start Script

```powershell
# Navigate to project
cd D:\CODE\IU\Software-summer\FaceGuardV1

# Copy environment file
Copy-Item backend-server\.env.example backend-server\.env

# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

### Check Service Status

```powershell
docker compose ps
```

Expected output:
```
NAME                    STATUS    PORTS
faceguard-backend       healthy   0.0.0.0:8000->8000/tcp
faceguard-postgres      healthy   0.0.0.0:5432->5432/tcp
```

---

## Docker Desktop Instructions

### Windows 11

1. **Install Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - Run installer
   - Restart computer

2. **Enable WSL 2**
   - Settings → General → "Use the WSL 2 based engine"

3. **Allocate Resources**
   - Settings → Resources
   - Memory: 4 GB minimum
   - CPU: 2 cores minimum

4. **Start Services**
   - Open PowerShell as Administrator
   - Navigate to project directory
   - Run: `docker compose up --build`

---

## Mock Raspberry Pi Agent Testing

The mock agent simulates a Raspberry Pi device for testing without real hardware.

### Step 1: Create Device

```powershell
$token = "<your-admin-jwt-token>"
$body = @{
    name = "Mock Device"
    device_code = "mock-device-001"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/devices" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $body

# Save device token
$deviceToken = $response.token
echo $deviceToken
```

### Step 2: Set Environment Variable

```powershell
# Add to docker-compose.yml or .env
MOCK_DEVICE_TOKEN=mock-device-001:<token-value>
```

### Step 3: Start Mock Agent

```powershell
docker compose --profile testing up mock-agent
```

### Step 4: Verify

```powershell
# Check device is online
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/devices" `
    -Headers @{ Authorization = "Bearer $token" }
```

Device status should be `online`.

---

## Command Testing

### Send Reboot Command

```powershell
$deviceId = "<device-uuid>"
$body = @{
    command_type = "reboot_device"
    parameters = @{}
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/devices/$deviceId/commands" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $body
```

### Send Train Model Command

```powershell
$body = @{
    command_type = "train_model"
    parameters = @{ person_id = "<person-uuid>" }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/devices/$deviceId/commands" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $body
```

### Check Command Status

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/events" `
    -Headers @{ Authorization = "Bearer $token" }
```

---

## Recognition Event Testing

Mock agent automatically sends simulated recognition events every 30-120 seconds.

### View Events

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/events?limit=10" `
    -Headers @{ Authorization = "Bearer $token" }
```

### Filter by Event Type

```powershell
# Recognized persons
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/events?event_type=recognized" `
    -Headers @{ Authorization = "Bearer $token" }

# Unknown persons
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/events?event_type=unknown" `
    -Headers @{ Authorization = "Bearer $token" }
```

---

## Raspberry Pi OS 64-bit Installation

### Prerequisites

- Raspberry Pi 4 or 5
- Raspberry Pi OS 64-bit (Debian Bookworm)
- 8 GB+ SD card
- Network connection

### Installation Steps

1. **Flash OS:**
   - Use Raspberry Pi Imager
   - Select "Raspberry Pi OS (64-bit)"
   - Enable SSH
   - Set username/password

2. **Update System:**

```bash
sudo apt update && sudo apt upgrade -y
```

3. **Install Docker:**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

4. **Install Docker Compose:**

```bash
sudo apt install docker-compose-plugin -y
```

5. **Copy Project:**

```bash
# From your development machine
scp -r FaceGuardV1 pi@raspberrypi.local:/home/pi/
```

6. **Start Backend:**

```bash
cd /home/pi/FaceGuardV1
cp backend-server/.env.example backend-server/.env
nano backend-server/.env  # Edit configuration

docker compose up -d
```

7. **Configure Raspberry Pi Agent:**

```bash
cd backend
cp .env.example .env
nano .env  # Set CENTRAL_SERVER_URL and device token
```

8. **Start Agent:**

```bash
# Using Docker
docker compose up -d

# OR using systemd (for GPIO access)
sudo cp infrastructure/faceguard-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable faceguard-agent
sudo systemctl start faceguard-agent
```

### ARM64 Notes

- Docker images are multi-architecture
- PostgreSQL runs natively on ARM64
- Python packages install from wheels
- OpenCV may take longer to install (use pre-built wheel)

---

## Device Token Setup

Each Raspberry Pi needs a unique device token.

### Create Device

```bash
curl -X POST http://localhost:8000/api/v1/devices \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Front Door Pi",
    "device_code": "pi-front-door-001"
  }'
```

Response:
```json
{
  "device_id": "uuid",
  "device_code": "pi-front-door-001",
  "token": "pi-front-door-001:longtoken..."
}
```

### Configure Agent

Add to agent `.env`:
```
CENTRAL_SERVER_URL=http://backend:8000
CENTRAL_DEVICE_TOKEN=pi-front-door-001:longtoken...
```

### Token Format

```
<device_code>:<random_token>
```

- Device code: identifies the device
- Random token: cryptographically secure secret
- Token is hashed in database (bcrypt)

---

## REST and WebSocket Connection Details

### REST API

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:**
- Admin/User: `Authorization: Bearer <jwt-token>`
- Device: `X-Device-Token: <device-code>:<token>`

**Endpoints:** See [API Endpoint Summary](#api-endpoint-summary)

### WebSocket - Device Connection

**URL:** `ws://localhost:8000/ws/devices/{device_id}?token=<device-token>`

**Authentication:** Query parameter `token`

**Message Format:**
```json
{
  "type": "command",
  "command": {
    "id": "uuid",
    "command_type": "reboot_device",
    "parameters": {}
  }
}
```

### WebSocket - Admin Connection

**URL:** `ws://localhost:8000/ws/admin?token=<jwt-token>`

**Authentication:** Query parameter `token`

**Message Format:**
```json
{
  "type": "event",
  "payload": {
    "event_type": "recognized",
    "person_id": "uuid",
    "device_id": "uuid",
    "timestamp": "2026-06-12T13:00:00Z"
  }
}
```

---

## Offline Docker Image Export/Import

### Export Images (on internet-connected machine)

```powershell
# Build images
docker compose build

# Export
docker save faceguardv1-backend:latest | gzip > backend.tar.gz
docker save postgres:16-alpine | gzip > postgres.tar.gz
docker save faceguardv1-mock-agent:latest | gzip > mock-agent.tar.gz
```

### Import Images (on offline machine)

```bash
# Load images
docker load < backend.tar.gz
docker load < postgres.tar.gz
docker load < mock-agent.tar.gz

# Verify
docker images
```

### Start Services Offline

```bash
docker compose up -d
```

---

## Backup Instructions

### Manual Backup

```powershell
# Stop services
docker compose down

# Backup database
docker compose up -d postgres
docker compose exec postgres pg_dump -U faceguard faceguard > backup_$(date +%Y%m%d).sql

# Backup files
tar -czf data_backup_$(date +%Y%m%d).tar.gz data/

# Restart all
docker compose up -d
```

### Restore from Backup

```bash
# Restore database
docker compose exec -T postgres psql -U faceguard faceguard < backup_20260612.sql

# Restore files
tar -xzf data_backup_20260612.tar.gz
```

### Automated Backups (Future Enhancement)

API endpoint `/api/v1/backups` will support:
- Scheduled backups
- Backup metadata storage
- Download via API
- Retention policies

---

## API Endpoint Summary

### Authentication
- `POST /api/v1/auth/register` - Register first admin
- `POST /api/v1/auth/login` - Login and get JWT

### Users
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Create user
- `GET /api/v1/users/{id}` - Get user
- `PATCH /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### People
- `GET /api/v1/people` - List people
- `POST /api/v1/people` - Create person
- `GET /api/v1/people/{id}` - Get person
- `PATCH /api/v1/people/{id}` - Update person
- `DELETE /api/v1/people/{id}` - Soft delete
- `GET /api/v1/people/{id}/photos` - List photos
- `POST /api/v1/people/{id}/photos` - Upload photo
- `DELETE /api/v1/people/{id}/photos/{photo_id}` - Delete photo

### Devices
- `GET /api/v1/devices` - List devices
- `POST /api/v1/devices` - Create device (returns token)
- `POST /api/v1/devices/{id}/heartbeat` - Device heartbeat
- `POST /api/v1/devices/{id}/commands` - Send command
- `POST /api/v1/devices/{id}/commands/{cmd_id}/result` - Update command result
- `GET /api/v1/devices/{id}/telemetry` - Get telemetry

### Events
- `GET /api/v1/events` - List access events
- `POST /api/v1/events` - Create event (from device)
- `GET /api/v1/events/audit` - List audit logs

### System
- `GET /api/v1/system/health` - Health check
- `GET /api/v1/system/ready` - Readiness check
- `GET /api/v1/system/info` - System information

### WebSocket
- `WS /ws/devices/{id}` - Device connection
- `WS /ws/admin` - Admin real-time updates

---

## Swagger Documentation

**URL:** http://localhost:8000/docs

**Features:**
- Interactive API testing
- Request/response schemas
- Authentication (click "Authorize" button)
- Try out endpoints directly

**ReDoc:** http://localhost:8000/redoc

---

## Security Notes

### Production Security Checklist

- [ ] Change `SECRET_KEY` to random 64-character hex
- [ ] Use strong database passwords
- [ ] Enable HTTPS (reverse proxy with nginx)
- [ ] Restrict CORS origins to frontend domain
- [ ] Use Tailscale/WireGuard for remote access
- [ ] Never expose PostgreSQL port (5432) externally
- [ ] Regularly update Docker images
- [ ] Enable firewall on Raspberry Pi
- [ ] Use fail2ban for SSH protection
- [ ] Back up device tokens securely
- [ ] Rotate JWT tokens periodically
- [ ] Implement rate limiting (future)

### Path Traversal Protection

All file paths are validated:
- Relative paths only
- No `..` sequences allowed
- Sandboxed to `/data` directory
- UUID-based person directories

### Authentication

- **JWT**: HS256 algorithm, 30-minute expiry
- **Device tokens**: bcrypt hashed, 256-bit random
- **Passwords**: bcrypt hashed, 12 rounds

---

## Troubleshooting

### Backend Won't Start

**Problem:** Container exits immediately

**Solution:**
```powershell
docker compose logs backend
```

Common issues:
- Database connection failed → Check PostgreSQL is healthy
- Migration failed → Check database schema
- Port already in use → Stop other services on port 8000

### PostgreSQL Connection Error

**Problem:** `could not connect to server`

**Solution:**
```powershell
docker compose ps postgres  # Check status
docker compose logs postgres
docker compose restart postgres
```

### Mock Agent Can't Connect

**Problem:** Device token invalid

**Solution:**
```powershell
# Verify device exists
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/devices" `
    -Headers @{ Authorization = "Bearer $token" }

# Recreate device if needed
# Update MOCK_DEVICE_TOKEN in docker-compose.yml
```

### Migrations Not Running

**Problem:** Tables don't exist

**Solution:**
```bash
# Run migrations manually
docker compose exec backend alembic upgrade head

# Check current version
docker compose exec backend alembic current
```

### Permission Denied Errors

**Problem:** User doesn't have permission

**Solution:**
- Check user role (admin, operator, viewer)
- Verify JWT token is valid
- Check permission requirements in API docs

### Docker Desktop on Windows

**Problem:** Containers won't start

**Solution:**
- Restart Docker Desktop
- Enable WSL 2 backend
- Check Windows Defender isn't blocking
- Allocate more memory (Settings → Resources)

---

## Known Limitations

1. **Single PostgreSQL Instance**
   - No replication or clustering
   - Suitable for local network deployment

2. **File Storage**
   - No distributed filesystem
   - Backup required for data safety

3. **WebSocket Scalability**
   - Single backend instance handles all connections
   - Use load balancer + Redis for multi-instance (future)

4. **Video Storage**
   - Event videos not yet implemented
   - Planned for future release

5. **Backup Automation**
   - Manual backup required currently
   - Scheduled backups in development

6. **Telemetry Aggregation**
   - Raw telemetry stored for 7 days
   - Aggregated metrics planned

7. **No Built-in HTTPS**
   - Use nginx reverse proxy for SSL
   - Let's Encrypt integration planned

---

## Production Checklist

### Before Deployment

- [ ] Generate strong `SECRET_KEY`
- [ ] Change default database password
- [ ] Configure proper `CORS_ORIGINS`
- [ ] Set `ENVIRONMENT=production`
- [ ] Disable debug mode (`DEBUG=false`)
- [ ] Set up SSL/TLS with nginx
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Document device tokens securely
- [ ] Test restore from backup
- [ ] Set up monitoring/alerting
- [ ] Review audit log retention
- [ ] Configure log rotation
- [ ] Test offline operation
- [ ] Verify all health checks pass

### After Deployment

- [ ] Monitor logs for errors
- [ ] Verify device heartbeats
- [ ] Test recognition events
- [ ] Check disk space usage
- [ ] Validate backup integrity
- [ ] Test WebSocket connections
- [ ] Review security logs
- [ ] Update documentation

---

## Support

For issues or questions:
- Check this documentation first
- Review Docker logs: `docker compose logs -f`
- Check API documentation: http://localhost:8000/docs
- Review error messages in browser console
- Verify environment variables are correct

---

**End of Backend Setup Guide**
