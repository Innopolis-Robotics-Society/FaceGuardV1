# FaceGuard Agent - Scripts Documentation

Management scripts for running FaceGuard Agent on Raspberry Pi using Docker.

## Prerequisites

- Docker and Docker Compose installed on Raspberry Pi
- `.env` file configured in `agent/` directory

## Quick Start

```bash
# First time setup
cd agent/
./scripts/setup.sh

# Start agent
./scripts/run.sh

# Stop agent
./scripts/stop.sh
```

---

## Available Scripts

### `setup.sh`
**Purpose:** Initial setup - builds Docker image and downloads models

**Usage:**
```bash
./scripts/setup.sh
```

**What it does:**
- Builds Docker image with correct Python version and dependencies
- Downloads anti-spoofing models (MiniFASNet)
- Checks for `.env` file

**When to use:** First time setup or after major changes

---

### `run.sh`
**Purpose:** Start FaceGuard Agent in Docker container

**Usage:**
```bash
./scripts/run.sh
```

**What it does:**
- Checks for `.env` file
- Starts container with `docker compose up -d`
- Shows logs (Ctrl+C to exit, container keeps running)

**Requirements:** `.env` file must exist

---

### `stop.sh`
**Purpose:** Stop running FaceGuard Agent container

**Usage:**
```bash
./scripts/stop.sh
```

**What it does:**
- Stops and removes container with `docker compose down`
- Keeps data volumes intact

---

### `logs.sh`
**Purpose:** View real-time logs from running container

**Usage:**
```bash
./scripts/logs.sh
```

**What it does:**
- Shows live logs with `docker compose logs -f`
- Press Ctrl+C to exit

---

### `rebuild.sh`
**Purpose:** Rebuild Docker image from scratch

**Usage:**
```bash
./scripts/rebuild.sh
```

**What it does:**
- Rebuilds Docker image without cache
- Reinstalls all dependencies

**When to use:**
- After changes to `Dockerfile`
- After changes to `requirements.txt`
- When dependencies are corrupted

---

### `docker-run.sh`
**Purpose:** Run any Python script/command inside Docker container

**Usage:**
```bash
./scripts/docker-run.sh <python-command> [args...]
```

**Examples:**
```bash
# Run main.py
./scripts/docker-run.sh main.py

# Run test script
./scripts/docker-run.sh scripts/test_leds.py

# Download models with force flag
./scripts/docker-run.sh scripts/download_models.py --force
```

**What it does:**
- Runs command in temporary container with correct Python version
- Uses same environment as production container

---

### `test.sh`
**Purpose:** Run hardware and feature tests

**Usage:**
```bash
./scripts/test.sh <test-name>
```

**Available tests:**

#### LED Test
```bash
./scripts/test.sh leds
```
Tests LED indicators (red, green, blue). Requires GPIO access.

**List all tests:**
```bash
./scripts/test.sh
```

---

## Common Workflows

### First Time Setup on Raspberry Pi

```bash
cd agent/

# 1. Create configuration
cp .env.example .env
nano .env  # Edit configuration

# 2. Run setup
./scripts/setup.sh

# 3. Start agent
./scripts/run.sh
```

### Daily Usage

```bash
# Start agent
./scripts/run.sh

# View logs
./scripts/logs.sh

# Stop agent
./scripts/stop.sh
```

### Development/Testing

```bash
# Test LED indicators
./scripts/test.sh leds

# Run custom Python script
./scripts/docker-run.sh scripts/your_script.py

# Rebuild after code changes
./scripts/rebuild.sh
./scripts/run.sh
```

### Troubleshooting

```bash
# View current logs
./scripts/logs.sh

# Rebuild from scratch
./scripts/stop.sh
./scripts/rebuild.sh

# Re-download models
./scripts/docker-run.sh scripts/download_models.py --force

# Open shell in container for debugging
docker compose run --rm agent /bin/bash
```

---

## Configuration

### Environment Variables (`.env`)

Required variables:
```bash
DEVICE_CODE=rpi-main-001
BACKEND_URL=http://your-backend:8000
HARDWARE_MODE=raspberry_pi
```

Optional variables:
```bash
# Recognition
RECOGNITION_THRESHOLD=70
ANTISPOOFING_ENABLED=true
ANTISPOOFING_THRESHOLD=0.5

# GPIO Pins
LED_RED_PIN=17
LED_GREEN_PIN=27
LED_BLUE_PIN=22
SERVO_GPIO_PIN=17

# Control Mode
DOOR_CONTROL_MODE=both  # servo, led, or both
```

See `.env.example` for full configuration options.

---

## Troubleshooting

### "Error: .env file not found"
Create `.env` file:
```bash
cp .env.example .env
nano .env
```

### GPIO/LED tests fail
Ensure container has privileged access. Check `docker-compose.yml`:
```yaml
privileged: true  # or set to true
devices:
  - /dev/gpiomem:/dev/gpiomem
```

### CUDA/NVIDIA errors on Raspberry Pi
Ensure `requirements.txt` uses CPU-only PyTorch:
```txt
--extra-index-url https://download.pytorch.org/whl/cpu
torch==2.5.1+cpu
torchvision==0.20.1+cpu
```

### Camera not working
Check device mapping in `docker-compose.yml`:
```yaml
devices:
  - /dev/video0:/dev/video0
  - /dev/vchiq:/dev/vchiq
```

### Models not downloading
Run manually:
```bash
./scripts/docker-run.sh scripts/download_models.py --force
```

---

## File Permissions

Make scripts executable on Raspberry Pi:
```bash
chmod +x scripts/*.sh
```

---

## Notes

- All scripts automatically change to `agent/` directory
- Scripts use Docker Compose to ensure consistent Python version
- Data persists in Docker volumes even after container stops
- Logs are stored in `/data/logs/` inside container
