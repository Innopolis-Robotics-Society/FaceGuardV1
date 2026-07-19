# FaceGuard Agent

Autonomous face recognition and access control agent for Raspberry Pi.

## What is FaceGuard Agent?

FaceGuard Agent is a Python application that runs on Raspberry Pi and provides:

- **Face Recognition** using OpenCV LBPH (< 200ms per frame)
- **Anti-Spoofing Protection** with lightweight texture-based liveness detection
- **Door Control** via GPIO servo motor and LED indicators
- **Offline Operation** - works without internet connection
- **Backend Sync** - automatic event synchronization when online
- **System Telemetry** - CPU, RAM, temperature monitoring

The agent operates autonomously - even when backend is unavailable, recognition and door control continue working.

## Quick Start

### Prerequisites

- Raspberry Pi 4/5 with Raspberry Pi OS
- Docker and Docker Compose installed
- Camera (Pi Camera Module or USB webcam)
- Backend server running

### Installation

1. **Clone the repository**
```bash
cd ~
git clone <your-repository-url>
cd FaceGuardV1/agent
```

2. **Configure environment**
```bash
cp .env.example .env
nano .env
```

Set required variables:
```env
BACKEND_URL=http://192.168.1.100:8000
DEVICE_CODE=rpi-main-001
HARDWARE_MODE=raspberry_pi
```

3. **Setup and start**
```bash
# First-time setup (builds image and downloads models)
./scripts/setup.sh

# Start agent
./scripts/run.sh
```

That's it! The agent is now running.

## Management Scripts

All management scripts are located in `scripts/` directory:

```bash
./scripts/setup.sh      # Initial setup
./scripts/run.sh        # Start agent
./scripts/stop.sh       # Stop agent
./scripts/logs.sh       # View logs
./scripts/rebuild.sh    # Rebuild Docker image
./scripts/test.sh leds  # Test LED indicators
```

See [scripts/README.md](scripts/README.md) for detailed documentation.

## Configuration

### Basic Configuration

Key environment variables in `.env`:

```env
# Backend connection
BACKEND_URL=http://your-backend:8000
DEVICE_CODE=rpi-main-001

# Hardware
HARDWARE_MODE=raspberry_pi
DOOR_CONTROL_MODE=both  # servo, led, or both

# Recognition
RECOGNITION_MODEL=lbph
RECOGNITION_THRESHOLD=70

# Anti-spoofing
ANTISPOOFING_ENABLED=false
ANTISPOOFING_THRESHOLD=0.5

# GPIO Pins
LED_RED_PIN=17
LED_GREEN_PIN=27
LED_BLUE_PIN=22
SERVO_GPIO_PIN=17
```

For detailed setup and configuration, see [SETUP.md](SETUP.md).

## How It Works

```
┌─────────────────────────────────────┐
│         Camera Service              │
│   (Continuous frame capture)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Recognition Loop               │
│   • Face detection (Haar Cascade)   │
│   • Anti-spoofing check (optional)  │
│   • Face recognition (LBPH)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Event Handler                 │
│   • Calculate confidence            │
│   • Open door (if ≥60% confidence)  │
│   • LED indicator                   │
│   • Save event                      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Sync Manager                  │
│   • Offline buffer (SQLite)         │
│   • Backend sync when online        │
└─────────────────────────────────────┘
```

For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Features

### Face Recognition

- **LBPH Model** (default): Fast, works on low-end hardware
- **DeepFace Models** (optional): Higher accuracy, requires more resources
- Configurable recognition threshold
- Automatic model training from photos

### Anti-Spoofing

- **Liveness Detection** (enabled by default):
  - Texture analysis - detects printed photos and screen replays
  - Fast and lightweight - optimized for Raspberry Pi
  - Protects against basic photo/video attacks
  
- **MiniFASNet CNN** (optional - requires PyTorch):
  - Advanced deep learning detection
  - Higher accuracy but requires more resources
  - Disabled by default on Raspberry Pi
  - To enable: install PyTorch manually and set `ANTISPOOFING_ENABLED=true`

### Hardware Control

- **LED Indicators**:
  - 🔴 Red: Access denied
  - 🟢 Green: Access granted
  - 🔵 Blue: Low confidence
  
- **Door Control**: Servo motor via GPIO
- **Cooldown**: Prevents repeated triggering

### Offline Mode

- Works without internet connection
- Events buffered in local SQLite database
- Automatic sync when backend becomes available
- Recognition model stored locally

### Backend Integration

- Device registration and heartbeat
- Event synchronization
- Remote command execution
- System telemetry reporting

## Troubleshooting

### Agent not starting

```bash
# Check Docker status
docker compose ps

# View logs
./scripts/logs.sh

# Rebuild if needed
./scripts/rebuild.sh
```

### Common Connection Errors

**❌ `[Errno 11001] getaddrinfo failed`**

Problem: `BACKEND_URL` contains hostname that cannot be resolved  
Solution: Use IP address instead of hostname: `http://192.168.1.100:8000`

```bash
# Check backend accessibility
curl http://YOUR_BACKEND_IP:8000/api/v1/system/health
# Should return: {"status": "healthy"}
```

**❌ `Connection refused` / `ConnectError`**

Problem: Backend is not running or not accessible  
Solution:
- Verify backend is running: `curl http://YOUR_IP:8000/api/v1/system/health`
- Check firewall: `sudo ufw allow 8000` (on backend server)
- Verify `BACKEND_URL` in `.env` is correct

### Camera not working

```bash
# Check camera device
ls -l /dev/video*

# Test camera on host
libcamera-hello --list-cameras

# Test in Docker
docker compose run --rm agent python -c "import cv2; print(cv2.VideoCapture(0).isOpened())"

# Enable camera in Raspberry Pi config
sudo raspi-config
# Interface Options → Camera → Enable
```

**Camera not detected in Docker:**
- Ensure `privileged: true` in docker-compose.yml
- Or add specific devices:
  ```yaml
  devices:
    - /dev/video0:/dev/video0
    - /dev/vchiq:/dev/vchiq
  ```

### Recognition not working

**❌ `Model not trained, cannot recognize`**

This is normal for first launch. You need to:
1. Create a person in backend
2. Capture photos via `capture_photos` command
3. Train model via `rebuild_model` command

```bash
# Check if model exists
ls -la data/models/face_model.yml
```

**Poor recognition accuracy:**
- Add more training photos (minimum 8-15 per person)
- Ensure photos have good lighting and different angles
- Adjust `RECOGNITION_THRESHOLD` in `.env` (lower = stricter)
- Rebuild model after adding photos

### GPIO/LED not working

```bash
# Test LED indicators
./scripts/test.sh leds

# Check GPIO access
ls -l /dev/gpiomem

# Add user to gpio group
sudo usermod -aG gpio $USER

# Check privileged mode in docker-compose.yml
privileged: true
```

### Raspberry Pi Specific Issues

**CUDA/PyTorch errors on ARM64:**

This is fixed in current version. The project uses CPU-only PyTorch:
- `requirements.txt` specifies `torch==2.5.1+cpu` for ARM64
- `Dockerfile` sets `TORCH_CUDA_ARCH_LIST=""`
- Anti-spoofing runs on CPU: `ANTISPOOFING_DEVICE=cpu`

**Package installation errors:**

If you see "Unable to locate package libcamera-apps", this is normal - the package has been removed from dependencies. Only `libcamera-dev` and `picamera2` (via pip) are needed.

### Running Python Scripts

If you get `ModuleNotFoundError` when running scripts, use one of these methods:

**Method 1: Python module (recommended)**
```bash
cd agent
python3 -m scripts.test_leds
python3 -m scripts.download_models
```

**Method 2: Inside Docker container**
```bash
docker exec -it faceguard_agent bash
python -m scripts.test_leds
```

**Method 3: Set PYTHONPATH**
```bash
cd agent
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python3 scripts/test_leds.py
```

## Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup and configuration guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design
- **[scripts/README.md](scripts/README.md)** - Management scripts documentation

## Data Storage

```
data/
├── faces/{person_uuid}/          # Training photos
│   ├── original/                 # Original captures
│   └── processed/                # Processed faces (200x200 grayscale)
├── events/                       # Event snapshots
├── models/                       # Recognition models
│   ├── face_model.yml           # LBPH model
│   ├── labels.json              # Person ID mapping
│   └── antispoofing/            # Anti-spoofing models
├── logs/                         # Application logs
└── agent.db                      # SQLite database (events, telemetry)
```

## System Requirements

- Raspberry Pi 4/5 (2GB+ RAM recommended)
- Raspberry Pi OS (Debian Bookworm or later)
- Docker and Docker Compose
- Camera (Pi Camera Module or USB webcam)
- Optional: RGB LED, servo motor for door control

## Performance

- Face detection: 80-150ms
- LBPH recognition: 20-50ms
- Total recognition time: ~100-200ms per frame
- Camera FPS: 15-30 (configurable)
- CPU usage: 30-50% on Raspberry Pi 5

## License

See main repository LICENSE file.

## Version

**Version:** 1.0.0  
**Last Updated:** 2026-07-16
