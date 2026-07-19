# FaceGuard Agent - Setup and Configuration Guide

Complete guide for setting up and configuring FaceGuard Agent on Raspberry Pi.

## Table of Contents

1. [Hardware Setup](#hardware-setup)
2. [GPIO Configuration](#gpio-configuration)
3. [Recognition Models](#recognition-models)
4. [Anti-Spoofing Setup](#anti-spoofing-setup)
5. [Camera Configuration](#camera-configuration)
6. [Performance Optimization](#performance-optimization)
7. [Advanced Configuration](#advanced-configuration)

---

## Hardware Setup

### Required Components

**Essential:**
- Raspberry Pi 4/5 (2GB+ RAM)
- Camera (Pi Camera Module V2/V3 or USB webcam)
- Power supply (official recommended)
- MicroSD card (16GB+ Class 10)

**Optional:**
- RGB LED (common cathode) or 3 separate LEDs
- Servo motor (SG90 or similar)
- 3x 220Ω resistors (for LEDs)
- Breadboard and jumper wires

### Raspberry Pi Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Reboot
sudo reboot
```

---

## GPIO Configuration

### LED Indicator Setup

**Wiring Diagram:**

```
Raspberry Pi GPIO Pins:
GPIO 17 (Pin 11) ──[220Ω]──►├ RED LED    ├─┐
GPIO 27 (Pin 13) ──[220Ω]──►├ GREEN LED  ├─┤ Common Cathode
GPIO 22 (Pin 15) ──[220Ω]──►├ BLUE LED   ├─┘
GND (Pin 9)      ───────────────────────────┘
```

**Configuration:**

```env
# LED Pins (agent/.env)
LED_RED_PIN=17
LED_GREEN_PIN=27
LED_BLUE_PIN=22
LED_DURATION=2.0

# Control mode
DOOR_CONTROL_MODE=led  # or 'both' for LED + servo
```

**LED Status Indicators:**
- 🔴 **Red**: Access denied (unknown person)
- 🟢 **Green**: Access granted (confidence ≥ 60%)
- 🔵 **Blue**: Recognized but low confidence (< 60%)

**Testing:**

```bash
./scripts/test.sh leds
```

### Servo Motor Setup

**Wiring:**

```
Servo Motor (SG90):
Orange (Signal) ─── GPIO 17 (Pin 11)
Red (VCC)       ─── 5V (Pin 2)
Brown (GND)     ─── GND (Pin 6)
```

**Configuration:**

```env
# Servo control
SERVO_GPIO_PIN=17
DOOR_OPEN_DURATION=5
ACTION_COOLDOWN_SECONDS=5

DOOR_CONTROL_MODE=servo  # or 'both'
```

**Notes:**
- Use external 5V power supply for heavy servos
- Don't exceed 16mA per GPIO pin
- Servo operates: min (-1.0) = closed, max (1.0) = open

---

## Recognition Models

### LBPH Model (Default)

**Characteristics:**
- ✅ Fast (20-50ms per frame)
- ✅ Works on low-end hardware
- ✅ No internet required
- ❌ Moderate accuracy
- ❌ Sensitive to lighting

**Configuration:**

```env
RECOGNITION_MODEL=lbph
RECOGNITION_THRESHOLD=70
```

**Threshold Guide:**

| Value | Strictness | Use Case |
|-------|------------|----------|
| 30-50 | Very strict | High security, few people |
| 50-70 | Strict | Production recommended |
| 70-90 | Balanced | Default, good for families |
| 90-100 | Lenient | Testing, many people |

### DeepFace Models (Advanced)

**Characteristics:**
- ✅ High accuracy
- ✅ Lighting invariant
- ✅ Multiple model options
- ❌ Slower (200-500ms)
- ❌ More resources required
- ❌ Downloads models on first run (~100-500MB)

**Configuration:**

```env
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=Facenet
DEEPFACE_DISTANCE_METRIC=cosine
```

**Available Models:**

| Model | Accuracy | Speed | Recommendation |
|-------|----------|-------|----------------|
| **Facenet** | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | **Best balance** |
| Facenet512 | ⭐⭐⭐⭐⭐ | ⚡⚡ | Maximum accuracy |
| ArcFace | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | Production ready |
| VGG-Face | ⭐⭐⭐⭐ | ⚡⚡ | Classic choice |
| OpenFace | ⭐⭐⭐ | ⚡⚡⚡⚡ | Fastest deep model |
| Dlib | ⭐⭐⭐⭐ | ⚡⚡⚡ | Good speed |

**Distance Metrics:**
- `cosine` - Cosine similarity (recommended)
- `euclidean` - Euclidean distance
- `euclidean_l2` - Normalized euclidean

**Recommendations:**

For Raspberry Pi 3/4:
```env
RECOGNITION_MODEL=lbph
```

For Raspberry Pi 5:
```env
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=Facenet
```

For powerful PC/server:
```env
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=Facenet512
DEEPFACE_DISTANCE_METRIC=cosine
```

---

## Anti-Spoofing Setup

FaceGuard provides two layers of anti-spoofing protection:

### 1. LivenessDetector (Default - Recommended for Raspberry Pi)

**Fast, lightweight protection using OpenCV only:**
- 🎯 Texture analysis - detects printed photos and screen replays
- 👁️ Eye blink detection (optional)
- 🏃 Motion detection (optional)
- ⚡ Speed: ~1-2ms per frame
- 💾 RAM: Minimal overhead

**Configuration:**

```env
# Enabled by default on Raspberry Pi
LIVENESS_ENABLED=true
LIVENESS_BLINK_REQUIRED=false  # Fast texture-only mode
LIVENESS_MOTION_REQUIRED=false
LIVENESS_TIMEOUT_SECONDS=3
```

**Detection modes:**

Fast mode (texture only - recommended):
```env
LIVENESS_ENABLED=true
LIVENESS_BLINK_REQUIRED=false
LIVENESS_MOTION_REQUIRED=false
```

Strict mode (requires blink - adds 1-3s delay):
```env
LIVENESS_ENABLED=true
LIVENESS_BLINK_REQUIRED=true
LIVENESS_MOTION_REQUIRED=false
```

**What it protects against:**
- ✅ Glossy printed photos
- ✅ Photos on phone/tablet screens
- ✅ Basic video replay attacks
- ⚠️ High-quality matte prints (may pass)

### 2. MiniFASNet Anti-Spoofing (Optional - Requires PyTorch)

**Advanced CNN-based detection:**
- 📄 Printed photos (all types)
- 📱 Photos on phone screens
- 🎥 Video replay attacks
- 🎭 Basic 3D masks
- 🔬 Higher accuracy than LivenessDetector

**⚠️ Requirements:**
- PyTorch installation (~500MB+ download)
- ~50-100ms inference time per frame
- ~300-500MB additional RAM usage
- **Not recommended for Raspberry Pi** (use LivenessDetector instead)

**Installation (x86_64 systems only):**

1. Install PyTorch:
```bash
pip install torch==2.5.1 torchvision==0.20.1 --extra-index-url https://download.pytorch.org/whl/cpu
```

2. Download model:
```bash
./scripts/docker-run.sh scripts/download_models.py
```

3. Enable in `.env`:
```env
ANTISPOOFING_ENABLED=true
ANTISPOOFING_THRESHOLD=0.5
ANTISPOOFING_MODEL_PATH=data/models/antispoofing/minifasnet_v2.pth
ANTISPOOFING_DEVICE=cpu
```

**Threshold Guide:**

| Value | Security | False Rejects | Use Case |
|-------|----------|---------------|----------|
| 0.3 | Low | Few | Convenience priority |
| 0.5 | Medium | Moderate | **Recommended** |
| 0.7 | High | More | Security priority |

**Raspberry Pi Note:**

MiniFASNet is **disabled by default** on Raspberry Pi in `.env.raspberry`. PyTorch is heavy and slow on ARM. Use `LivenessDetector` instead for optimal performance.

If you still want to try MiniFASNet on Raspberry Pi:
```bash
# Install PyTorch for ARM (may be unstable)
pip install torch==2.2.0 torchvision==0.17.0

# Enable in .env
ANTISPOOFING_ENABLED=true
```

### Comparison

| Feature | LivenessDetector | MiniFASNet |
|---------|------------------|------------|
| Speed | ~1-2ms | ~50-100ms |
| Dependencies | OpenCV only | PyTorch + model |
| RAM usage | Minimal | ~300-500MB |
| Photo protection | ✅ Good | ✅ Excellent |
| Video replay | ✅ Good | ✅ Excellent |
| 3D mask | ❌ Limited | ✅ Basic |
| Raspberry Pi | ✅ Perfect | ⚠️ Not recommended |

### Recommended Configuration

**For Raspberry Pi:**
```env
LIVENESS_ENABLED=true
LIVENESS_BLINK_REQUIRED=false
ANTISPOOFING_ENABLED=false
```

**For x86_64 Server:**
```env
# Both layers for maximum security
LIVENESS_ENABLED=true
LIVENESS_BLINK_REQUIRED=false
ANTISPOOFING_ENABLED=true
ANTISPOOFING_THRESHOLD=0.5
```

**Detection Pipeline:**
1. Face Detection (Haar Cascade)
2. Liveness Detection (texture, optional blink/motion)
3. MiniFASNet (if enabled and PyTorch installed)
4. Face Recognition (LBPH/DeepFace)

Any check fails → access denied.

---

## Camera Configuration

### Camera Selection

**Pi Camera Module:**
```env
CAMERA_INDEX=0
HARDWARE_MODE=raspberry_pi
```

**USB Webcam:**
```env
CAMERA_INDEX=0  # or 1, 2 for multiple cameras
HARDWARE_MODE=raspberry_pi
```

### Resolution and FPS

```env
CAMERA_WIDTH=640
CAMERA_HEIGHT=480
CAMERA_FPS=30
```

**Recommendations:**

For Raspberry Pi 3:
```env
CAMERA_WIDTH=640
CAMERA_HEIGHT=480
CAMERA_FPS=15
```

For Raspberry Pi 4/5:
```env
CAMERA_WIDTH=1280
CAMERA_HEIGHT=720
CAMERA_FPS=30
```

**Notes:**
- Higher resolution = better accuracy but slower
- 720p (1280x720) is sufficient for recognition
- FPS above 30 rarely needed

### Face Detection Parameters

```env
# Minimum face size in pixels
MIN_FACE_SIZE=80

# Detection scale factor (lower = more accurate, slower)
FACE_SCALE_FACTOR=1.2

# Minimum neighboring detections (higher = fewer false positives)
FACE_MIN_NEIGHBORS=5
```

**Tuning Guide:**

For close-range (< 1 meter):
```env
MIN_FACE_SIZE=100
FACE_SCALE_FACTOR=1.1
FACE_MIN_NEIGHBORS=6
```

For long-range (2-3 meters):
```env
MIN_FACE_SIZE=60
FACE_SCALE_FACTOR=1.3
FACE_MIN_NEIGHBORS=4
```

---

## Performance Optimization

### For Raspberry Pi 3

```env
# Use fast model
RECOGNITION_MODEL=lbph
RECOGNITION_THRESHOLD=70

# Lower camera settings
CAMERA_WIDTH=640
CAMERA_HEIGHT=480
CAMERA_FPS=15

# Faster detection
MIN_FACE_SIZE=100
FACE_SCALE_FACTOR=1.3

# Disable anti-spoofing if too slow
ANTISPOOFING_ENABLED=false
```

### For Raspberry Pi 4

```env
# Use LBPH or lightweight DeepFace
RECOGNITION_MODEL=lbph

# Standard camera settings
CAMERA_WIDTH=1280
CAMERA_HEIGHT=720
CAMERA_FPS=30

# Enable anti-spoofing
ANTISPOOFING_ENABLED=true
ANTISPOOFING_THRESHOLD=0.5
```

### For Raspberry Pi 5

```env
# Can use DeepFace
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=Facenet

# Full HD if needed
CAMERA_WIDTH=1280
CAMERA_HEIGHT=720
CAMERA_FPS=30

# Enable all features
ANTISPOOFING_ENABLED=true
LIVENESS_ENABLED=true
```

### Training Data Optimization

**Photo Requirements:**
- ✅ Minimum 8-15 photos per person
- ✅ Different angles: front, left, right, 3/4 profiles
- ✅ Different lighting: bright, dim, side-lit
- ✅ With/without glasses (if applicable)
- ✅ Different expressions
- ✅ Face occupies ≥30% of frame
- ❌ Avoid: blurry, too dark, face covered

**Best Practices:**
1. Capture in actual usage conditions
2. Use good lighting (not too bright/dark)
3. Keep face 30-100cm from camera
4. Retrain model after adding photos
5. Test in different conditions

---

## Advanced Configuration

### Backend Connection

```env
BACKEND_URL=http://192.168.1.100:8000
DEVICE_CODE=rpi-main-001
DEVICE_ID=550e8400-e29b-41d4-a716-446655440000
```

### Sync Settings

```env
HEARTBEAT_INTERVAL=10        # Heartbeat every 10 seconds
TELEMETRY_INTERVAL=30        # Telemetry every 30 seconds
SYNC_INTERVAL=60             # Sync events every 60 seconds
COMMAND_POLL_INTERVAL=5      # Poll commands every 5 seconds
```

### Logging

```env
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

Log levels:
- `DEBUG` - Verbose, for troubleshooting
- `INFO` - Standard, recommended for production
- `WARNING` - Only warnings and errors
- `ERROR` - Only errors

### Data Storage

```env
DATA_DIR=/data  # In Docker
```

Local paths (on host):
- `data/faces/` - Training photos
- `data/events/` - Event snapshots
- `data/models/` - Recognition models
- `data/logs/` - Application logs
- `data/agent.db` - SQLite database

### Docker Configuration

**docker-compose.yml adjustments:**

For better camera access:
```yaml
privileged: true
```

For specific devices:
```yaml
devices:
  - /dev/video0:/dev/video0
  - /dev/vchiq:/dev/vchiq
  - /dev/gpiomem:/dev/gpiomem
```

---

## Environment Variables Reference

### Required

```env
BACKEND_URL=http://your-backend:8000
DEVICE_CODE=rpi-main-001
HARDWARE_MODE=raspberry_pi
```

### Recognition

```env
RECOGNITION_MODEL=lbph
RECOGNITION_THRESHOLD=70
MIN_FACE_SIZE=80
FACE_SCALE_FACTOR=1.2
FACE_MIN_NEIGHBORS=5
```

### Anti-Spoofing

```env
ANTISPOOFING_ENABLED=false
ANTISPOOFING_THRESHOLD=0.5
ANTISPOOFING_DEVICE=cpu
```

### Camera

```env
CAMERA_INDEX=0
CAMERA_WIDTH=640
CAMERA_HEIGHT=480
CAMERA_FPS=30
```

### Hardware Control

```env
DOOR_CONTROL_MODE=both
SERVO_GPIO_PIN=17
DOOR_OPEN_DURATION=5
ACTION_COOLDOWN_SECONDS=5

LED_RED_PIN=17
LED_GREEN_PIN=27
LED_BLUE_PIN=22
LED_DURATION=2.0
```

### Sync

```env
HEARTBEAT_INTERVAL=10
TELEMETRY_INTERVAL=30
SYNC_INTERVAL=60
COMMAND_POLL_INTERVAL=5
```

---

## Recognition Optimization Guide

### Best Practices for Training Photos

**Photo Requirements:**
- ✅ Minimum **8-15 photos** per person (more is better)
- ✅ Different angles: front, left profile, right profile, 3/4 views
- ✅ Different lighting: bright, dim, side-lit, natural light
- ✅ With/without glasses (if applicable)
- ✅ Different facial expressions
- ✅ Face occupies ≥30% of frame
- ✅ Good quality (sharp, not blurry)
- ❌ Avoid: blurry photos, too dark/bright, face covered, extreme angles

**Best Capture Practices:**
1. Capture in actual usage conditions (same lighting, distance)
2. Keep face 30-100cm from camera
3. Ensure good lighting (not too bright/dark)
4. Have person slowly rotate head during capture
5. Retrain model after adding photos
6. Test in different conditions after training

### Choosing the Right Model

**LBPH (Default) - Fast and Local:**
- ✅ Very fast (20-50ms per frame)
- ✅ Works on low-end hardware (Raspberry Pi 3/4)
- ✅ No internet required
- ✅ Small model size (~10MB)
- ❌ Moderate accuracy
- ❌ Sensitive to lighting changes

**When to use:** Raspberry Pi 3/4, speed priority, offline operation

**DeepFace - High Accuracy:**
- ✅ Much higher accuracy
- ✅ Lighting invariant
- ✅ Multiple model options
- ❌ Slower (200-500ms per frame)
- ❌ Requires more CPU/RAM
- ❌ Downloads models on first run (~100-500MB)

**When to use:** Raspberry Pi 5, powerful PC/server, accuracy priority

**DeepFace Model Comparison:**

| Model | Accuracy | Speed | Best For |
|-------|----------|-------|----------|
| **Facenet512** | ⭐⭐⭐⭐⭐ | ⚡⚡ | **Recommended - best balance** |
| ArcFace | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | Production, high security |
| Facenet | ⭐⭐⭐⭐ | ⚡⚡⚡ | Faster than Facenet512 |
| VGG-Face | ⭐⭐⭐⭐ | ⚡⚡ | Classic choice |
| Dlib | ⭐⭐⭐⭐ | ⚡⚡⚡ | Good speed/accuracy |
| OpenFace | ⭐⭐⭐ | ⚡⚡⚡⚡ | Fastest deep model |

**Configuration:**

For LBPH:
```env
RECOGNITION_MODEL=lbph
RECOGNITION_THRESHOLD=70
```

For DeepFace:
```env
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=Facenet512
DEEPFACE_DISTANCE_METRIC=cosine
```

### Threshold Tuning Guide

| Threshold | Security Level | False Accepts | False Rejects | Use Case |
|-----------|----------------|---------------|---------------|----------|
| 30-40 | Very High | Very Few | Many | Maximum security, few users |
| 40-60 | High | Few | Some | **Production recommended** |
| 60-80 | Medium | Some | Few | Default, family/small group |
| 80-100 | Low | Many | Very Few | Testing, development |

**Symptoms and Solutions:**

- **Too many false accepts** (door opens for strangers) → Lower threshold (e.g., 50-60)
- **Too many false rejects** (doesn't recognize known people) → Raise threshold (e.g., 80)
- **Works well in day, fails at night** → Add training photos in night conditions
- **Works with glasses but fails without** → Add training photos both ways

## Troubleshooting

### Recognition Issues

**Problem: Not recognizing known people**

Solutions:
1. Add more training photos (8-15 minimum)
2. Increase `RECOGNITION_THRESHOLD` (e.g., 80)
3. Switch to DeepFace model
4. Improve lighting conditions
5. Retrain model

**Problem: False positives (recognizes unknown as known)**

Solutions:
1. Decrease `RECOGNITION_THRESHOLD` (e.g., 50-60)
2. Increase `FACE_MIN_NEIGHBORS` to 7
3. Increase `MIN_FACE_SIZE` to 120
4. Enable anti-spoofing

**Problem: Works well sometimes, fails other times**

Solutions:
1. Add training photos in various lighting conditions
2. Check camera position hasn't changed
3. Ensure consistent distance from camera
4. Consider switching to DeepFace (more lighting-invariant)

### Performance Issues

**Problem: Too slow**

Solutions:
1. Use LBPH instead of DeepFace
2. Increase `FACE_SCALE_FACTOR` to 1.3
3. Reduce camera resolution to 640x480
4. Disable anti-spoofing
5. Reduce `CAMERA_FPS` to 15

**Problem: High CPU usage**

Solutions:
1. Lower `CAMERA_FPS`
2. Use LBPH model
3. Increase `MIN_FACE_SIZE`
4. Disable anti-spoofing

### Hardware Issues

**Problem: GPIO not working**

Solutions:
```bash
# Check GPIO access
ls -l /dev/gpiomem

# Add user to gpio group
sudo usermod -aG gpio $USER

# Set privileged mode in docker-compose.yml
privileged: true
```

**Problem: Camera not detected**

Solutions:
```bash
# Check camera devices
ls -l /dev/video*

# Test camera
libcamera-hello --list-cameras

# Enable camera in config
sudo raspi-config
# Interface Options → Camera → Enable
```

**Problem: LED shows wrong colors**

Solutions:
1. Check LED type (Common Cathode vs Common Anode)
2. Verify resistors are connected correctly
3. Check LED polarity
4. Test each color individually with test script

### Raspberry Pi Specific Issues

**Problem: PyTorch tries to load CUDA on ARM64**

This is fixed in current version. Ensure you're using updated `requirements.txt` with:
```
torch==2.5.1+cpu; platform_machine == 'aarch64'
torchvision==0.16.1+cpu; platform_machine == 'aarch64'
```

And in Dockerfile:
```dockerfile
ENV TORCH_CUDA_ARCH_LIST=""
```

Anti-spoofing must run on CPU:
```env
ANTISPOOFING_DEVICE=cpu
```

**Problem: "Unable to locate package libcamera-apps"**

This package is no longer needed. Current version uses:
- `libcamera-dev` (installed in Dockerfile)
- `picamera2` (installed via pip)

**Problem: Camera works on host but not in Docker**

Solutions:
1. Add privileged mode:
   ```yaml
   privileged: true
   ```

2. Or specify devices explicitly:
   ```yaml
   devices:
     - /dev/video0:/dev/video0
     - /dev/vchiq:/dev/vchiq
     - /dev/gpiomem:/dev/gpiomem
   ```

3. Check user has access to video group:
   ```bash
   sudo usermod -aG video $USER
   ```

## Running Scripts and Utilities

### Method 1: Python Module (Recommended)

```bash
cd agent

# Test LED indicators
python3 -m scripts.test_leds

# Download anti-spoofing models
python3 -m scripts.download_models

# Download with force overwrite
python3 -m scripts.download_models --force

# Skip optional models
python3 -m scripts.download_models --skip-optional
```

### Method 2: Inside Docker Container

```bash
# Enter running container
docker exec -it faceguard_agent bash

# Run script
python -m scripts.test_leds

# Exit
exit
```

### Method 3: Shell Wrappers

```bash
cd agent

# Make executable (one time)
chmod +x scripts/*.sh

# Run via wrapper
./scripts/test_led.sh
```

### Method 4: Manual PYTHONPATH

```bash
cd agent

# Set PYTHONPATH temporarily
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Run script
python3 scripts/test_leds.py
```

### Why This Is Needed

Scripts in `scripts/` import modules from `door/` and `core/`. Python needs to know these modules are in the parent directory. Running via `-m` (module) or setting `PYTHONPATH` solves this.

## Security Best Practices

1. **Use strong device codes** - Random, unique per device
2. **Enable anti-spoofing** - Protection against photo attacks
3. **Set appropriate thresholds** - Balance security and usability
4. **Regular model retraining** - Keep recognition updated with new photos
5. **Monitor logs** - Check for unusual access patterns
6. **Secure backend connection** - Use HTTPS in production
7. **Limit GPIO access** - Only required users in gpio group
8. **Review events regularly** - Check for failed access attempts
9. **Keep system updated** - Regular security updates for Raspberry Pi OS
10. **Backup training data** - Keep copies of `data/faces/` directory

## Quick Reference Commands

### Management Scripts

```bash
# Located in agent/scripts/
./scripts/setup.sh      # Initial setup
./scripts/run.sh        # Start agent
./scripts/stop.sh       # Stop agent
./scripts/logs.sh       # View logs
./scripts/rebuild.sh    # Rebuild Docker image
./scripts/test.sh leds  # Test LED indicators
```

### Docker Commands

```bash
# Start agent
docker compose up -d

# Stop agent
docker compose down

# Restart agent
docker compose restart

# View logs
docker compose logs -f agent

# View last 50 lines
docker compose logs --tail=50 agent

# Enter container
docker exec -it faceguard_agent bash

# Check SQLite database
docker exec -it faceguard_agent sqlite3 /app/data/agent.db "SELECT * FROM events LIMIT 5;"
```

### Diagnostic Commands

```bash
# Check camera
ls -l /dev/video*
libcamera-hello --list-cameras

# Check GPIO
ls -l /dev/gpiomem

# Check model files
ls -la data/models/

# Check training photos
ls -la data/faces/*/original/
ls -la data/faces/*/processed/

# Check recent events in database
sqlite3 data/agent.db "SELECT * FROM events ORDER BY created_at DESC LIMIT 10;"

# Check disk usage
du -sh data/
```

---

## Version

**Version:** 1.0.0  
**Last Updated:** 2026-07-17
