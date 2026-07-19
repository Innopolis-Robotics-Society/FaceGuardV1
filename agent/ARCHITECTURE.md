# FaceGuard Agent - Architecture

System architecture and technical design documentation.

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Recognition Pipeline](#recognition-pipeline)
5. [Synchronization](#synchronization)
6. [Storage](#storage)
7. [Performance](#performance)

---

## System Overview

FaceGuard Agent is an autonomous face recognition system designed for Raspberry Pi that operates independently with optional backend synchronization.

### Key Principles

- **Autonomous Operation** - Works without backend connectivity
- **Offline-First** - All critical functions work offline
- **Event Buffering** - Local SQLite buffer for events and telemetry
- **Asynchronous Sync** - Background synchronization when online
- **Hardware Abstraction** - Mock implementations for development

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FaceGuardAgent (main.py)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Core      │  │  Hardware    │  │ Recognition  │     │
│  │  Services   │  │    Layer     │  │    Layer     │     │
│  ├─────────────┤  ├──────────────┤  ├──────────────┤     │
│  │ • Config    │  │ • Camera     │  │ • Service    │     │
│  │ • Database  │  │ • Door       │  │ • Loop       │     │
│  │ • Logger    │  │ • LED        │  │ • Capture    │     │
│  └─────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Communication│  │   Command    │  │    Event     │     │
│  │    Layer    │  │    Layer     │  │    Layer     │     │
│  ├─────────────┤  ├──────────────┤  ├──────────────┤     │
│  │ • Backend   │  │ • Executor   │  │ • Handler    │     │
│  │   Client    │  │ • Poller     │  │ • Telemetry  │     │
│  │ • Sync Mgr  │  │              │  │              │     │
│  └─────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Core Layer

#### Config (core/config.py)
- Environment variable management
- Default values and validation
- Path configuration
- Hardware mode detection

#### Database (core/database.py)
- SQLite connection management
- Schema initialization
- CRUD operations for events, telemetry, commands
- Sync state tracking

#### Logger (core/logging.py)
- Structured logging
- File and console output
- Log rotation
- Debug utilities

### Hardware Layer

#### CameraService (camera/camera_service.py)

**Purpose:** Continuous frame capture from camera

**Implementation:**
```python
class CameraService:
    def start(self):
        # Spawns background thread
        self._thread = Thread(target=self._capture_loop)
        
    def _capture_loop(self):
        while self.is_running:
            frame = self._grab_frame()
            with self.lock:
                self.current_frame = frame
            sleep(1 / FPS)
    
    def get_frame(self):
        # Non-blocking, returns latest frame
        with self.lock:
            return self.current_frame.copy()
```

**Camera Types:**
- `picamera2` - Raspberry Pi Camera Module
- `opencv` - USB webcam
- `simulated` - Mock for development

#### DoorController (door/door_controller.py)

**Purpose:** GPIO servo motor control

**Implementation:**
```python
class DoorController:
    def __init__(self):
        if Config.is_raspberry_pi():
            from gpiozero import Servo
            self.servo = Servo(Config.SERVO_GPIO_PIN)
        else:
            self.servo = None  # Mock
    
    def open_door(self, duration=5):
        if self.servo:
            self.servo.max()  # Open
            time.sleep(duration)
            self.servo.min()  # Close
```

#### LEDIndicator (door/led_indicator.py)

**Purpose:** RGB LED status indicator

**Status Colors:**
- Red: Access denied
- Green: Access granted
- Blue: Low confidence

**Implementation:**
```python
class LEDIndicator:
    def __init__(self):
        if Config.is_raspberry_pi():
            from gpiozero import LED
            self.red = LED(Config.LED_RED_PIN)
            self.green = LED(Config.LED_GREEN_PIN)
            self.blue = LED(Config.LED_BLUE_PIN)
    
    def show_access_granted(self, duration=2.0):
        self.green.on()
        time.sleep(duration)
        self.green.off()
```

### Recognition Layer

#### RecognitionService (recognition/recognizer.py)

**Purpose:** Unified face recognition interface

**Supports:**
- LBPH (default) - Fast, local
- DeepFace (optional) - High accuracy

**Model Selection:**
```python
class RecognitionService:
    def __init__(self):
        model_type = Config.RECOGNITION_MODEL
        if model_type == "lbph":
            self._recognizer = LBPHRecognizer()
        elif model_type == "deepface":
            self._recognizer = DeepFaceRecognizer()
```

#### RecognitionLoop (recognition/recognition_loop.py)

**Purpose:** Continuous face recognition thread

**Pipeline:**
```
1. Get frame from camera (non-blocking)
2. Recognize face (LBPH/DeepFace)
3. Check anti-spoofing (if enabled)
4. Handle result:
   - Recognized → trigger door + event
   - Unknown → trigger event only
5. Sleep 100ms
6. Repeat
```

**Implementation:**
```python
class RecognitionLoop:
    def start(self):
        self._thread = Thread(target=self._loop)
        self._thread.start()
    
    def _loop(self):
        while self._is_running:
            frame = self.camera.get_frame()
            result = self.recognition.recognize_face(frame)
            
            if result and result["recognized"]:
                self._handle_recognized(result)
            elif result:
                self._handle_unknown(result)
            
            time.sleep(0.1)
```

**Cooldown Mechanism:**
- Prevents repeated door opening
- Default: 5 seconds between actions
- Per-person tracking

#### MiniFASNet Anti-Spoofing (recognition/minifasnet_detector.py)

**Purpose:** CNN-based presentation attack detection

**Architecture:**
```
Input: 80x80x3 RGB face crop
↓
Conv1 (3→64) + BN + ReLU + MaxPool
Conv2 (64→128) + BN + ReLU + MaxPool
Conv3 (128→196) + BN + ReLU + MaxPool
Conv4 (196→128) + BN + ReLU
Conv5 (128→128) + BN + ReLU
Conv6 (128→128) + BN + ReLU
FC (128→3)
↓
Output: [real, fake_print, fake_replay]
```

**Inference:**
- Preprocessing: resize to 80x80, normalize
- Model forward pass: ~15-30ms on CPU
- Softmax: real vs fake score
- Threshold: configurable (0-1)

### Communication Layer

#### BackendClient (sync/backend_client.py)

**Purpose:** HTTP client for backend API

**Endpoints:**
```python
# Device management
POST /api/v1/devices/register
POST /api/v1/devices/{id}/heartbeat

# Events
POST /api/v1/events/
POST /api/v1/events/batch

# Commands
GET /api/v1/commands/pending?device_id={id}
PATCH /api/v1/commands/{id}

# Telemetry
POST /api/v1/telemetry/
POST /api/v1/telemetry/batch
```

**Connection Handling:**
- Timeout: 10 seconds
- Retry: Exponential backoff
- Error handling: Logs and continues

#### SyncManager (sync/sync_manager.py)

**Purpose:** Manages online/offline state and synchronization

**State Machine:**
```
┌─────────┐
│ Offline │◄─────┐
└────┬────┘      │
     │ heartbeat │
     │ success   │ heartbeat
     ▼           │ fail
┌─────────┐      │
│ Online  │──────┘
└────┬────┘
     │
     │ sync_loop (every 60s)
     ├─> sync events
     ├─> sync telemetry
     └─> check connection
```

**Buffering:**
- All events saved to SQLite first
- Background sync when online
- Batch sync (100 records at a time)
- Marks records as synced

### Command Layer

#### CommandExecutor (commands/command_executor.py)

**Purpose:** Execute remote commands from backend

**Command Types:**
- `capture_photos` - Capture training photos
- `rebuild_model` - Retrain recognition model
- `reload_model` - Reload model from disk
- `open_door` - Manual door control
- `restart_recognition` - Restart recognition loop
- `restart_camera` - Restart camera service
- `reboot_device` - Reboot Raspberry Pi

**Execution Flow:**
```
1. Receive command from backend
2. Update status → "running"
3. Execute handler
4. Update status → "completed"/"failed"
5. Send result to backend
```

#### CommandPoller (commands/command_poller.py)

**Purpose:** Poll backend for pending commands

**Polling:**
- Interval: 5 seconds (configurable)
- Fetches pending commands for this device
- Passes to CommandExecutor
- Background asyncio task

### Event Layer

#### EventHandler (events/event_handler.py)

**Purpose:** Handle recognition events

**Event Types:**
- `recognized` - Known person detected
- `unknown` - Unknown person detected
- `access_denied` - Recognition failed

**Workflow:**
```
RecognitionLoop callback
↓
EventHandler.on_person_recognized()
↓
├─> Open door (if confidence ≥ 60%)
├─> Show LED indicator
├─> Save snapshot
├─> Create event record
└─> Add to sync queue
```

#### TelemetryService (telemetry/telemetry_service.py)

**Purpose:** System monitoring

**Metrics:**
- CPU usage (%)
- CPU temperature (°C)
- RAM usage (%)
- Disk usage (%)
- Uptime (seconds)
- Camera FPS
- Network status
- Recognition status

**Collection:**
- Interval: 30 seconds
- Uses `psutil` library
- Raspberry Pi thermal zone for temperature

---

## Data Flow

### Recognition Flow

```
┌─────────────────┐
│  CameraService  │ (Background thread)
│  Continuous     │
│  capture loop   │
└────────┬────────┘
         │ Non-blocking
         ▼
┌─────────────────┐
│ RecognitionLoop │ (Background thread)
│  • Get frame    │
│  • Detect face  │
│  • Anti-spoof   │
│  • Recognize    │
└────────┬────────┘
         │
         ├─ Recognized → EventHandler
         │               ├─> Door control
         │               ├─> LED indicator
         │               ├─> Save snapshot
         │               └─> Create event
         │
         └─ Unknown ───→ EventHandler
                         ├─> LED red
                         ├─> Save snapshot
                         └─> Create event
```

### Synchronization Flow

```
┌──────────────────┐
│   EventHandler   │
│   Creates event  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Database      │
│  • Save event    │
│  • synced=0      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   SyncManager    │ (Background task, every 60s)
│  1. Check online │
│  2. Get unsynced │
│  3. Batch send   │
│  4. Mark synced  │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│  BackendClient   │
│  POST /events/   │
│  batch           │
└──────────────────┘
```

### Command Flow

```
┌──────────────────┐
│   Backend API    │
│  Admin creates   │
│  command         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  CommandPoller   │ (Every 5 seconds)
│  GET /commands/  │
│  pending         │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ CommandExecutor  │
│  1. Status→run   │
│  2. Execute      │
│  3. Status→done  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  BackendClient   │
│  PATCH /commands │
│  {result}        │
└──────────────────┘
```

---

## Recognition Pipeline

### Face Detection (Haar Cascade)

```python
# 1. Convert to grayscale
gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

# 2. Detect faces
faces = face_cascade.detectMultiScale(
    gray,
    scaleFactor=1.2,
    minNeighbors=5,
    minSize=(80, 80)
)

# Time: ~80-150ms
```

### Anti-Spoofing (MiniFASNet)

```python
# 1. Extract face region with padding
face_region = frame[y1:y2, x1:x2]

# 2. Preprocess
face_tensor = preprocess(face_region)  # 80x80

# 3. Inference
with torch.no_grad():
    logits = model(face_tensor)
    probs = F.softmax(logits, dim=1)

# 4. Check threshold
real_score = probs[0]
is_real = real_score > threshold

# Time: ~15-30ms
```

### Face Recognition (LBPH)

```python
# 1. Extract face ROI
face_roi = gray[y:y+h, x:x+w]

# 2. Resize to standard size
face_resized = cv2.resize(face_roi, (200, 200))

# 3. Predict
label, distance = recognizer.predict(face_resized)

# 4. Check threshold
recognized = distance < THRESHOLD
person_id = label_map[label] if recognized else None

# Time: ~20-50ms
```

### Total Pipeline Time

```
Face Detection:     80-150ms
Anti-Spoofing:      15-30ms  (if enabled)
Face Recognition:   20-50ms
────────────────────────────
Total:             115-230ms
```

At 30 FPS camera: ~33ms per frame available  
Recognition runs every ~100ms (10 FPS)

---

## Synchronization

### Offline Buffer (SQLite)

**Schema:**
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    device_id TEXT,
    person_id TEXT,
    event_type TEXT,
    confidence REAL,
    door_opened INTEGER,
    photo_path TEXT,
    created_at TEXT,
    synced INTEGER DEFAULT 0,
    synced_at TEXT
);

CREATE TABLE telemetry (
    id INTEGER PRIMARY KEY,
    device_id TEXT,
    cpu_usage REAL,
    cpu_temperature REAL,
    ram_usage REAL,
    disk_usage REAL,
    uptime INTEGER,
    camera_fps REAL,
    created_at TEXT,
    synced INTEGER DEFAULT 0,
    synced_at TEXT
);
```

### Sync Strategy

**Add Event:**
```python
async def add_event(event_data):
    # 1. Always save to SQLite
    event_id = db.add_event(event_data)
    
    # 2. Try immediate sync if online
    if is_online:
        success = await backend.send_event(event_data)
        if success:
            db.mark_events_synced([event_id])
    
    # 3. Otherwise wait for sync loop
```

**Batch Sync:**
```python
async def _sync_unsynced_events():
    # 1. Get unsynced (limit 100)
    unsynced = db.get_unsynced_events(limit=100)
    
    # 2. Send batch
    success = await backend.sync_events_batch(unsynced)
    
    # 3. Mark synced
    if success:
        event_ids = [e["id"] for e in unsynced]
        db.mark_events_synced(event_ids)
```

### Online Detection

**Heartbeat:**
```python
async def _heartbeat_loop():
    while True:
        try:
            await backend.send_heartbeat(telemetry)
            # Heartbeat success = online
        except:
            # Heartbeat failed = offline
        
        await asyncio.sleep(10)
```

---

## Storage

### Directory Structure

```
data/
├── faces/{person_uuid}/
│   ├── original/           # Raw captures
│   │   └── photo_*.jpg     # 640x480 or higher
│   └── processed/          # Processed faces
│       └── face_*.jpg      # 200x200 grayscale
│
├── events/{YYYY}/{MM}/{DD}/
│   └── {type}_{id}_{timestamp}_{random}.jpg
│
├── models/
│   ├── face_model.yml      # LBPH trained model
│   ├── labels.json         # Label → Person ID mapping
│   └── antispoofing/
│       └── minifasnet_v2.pth
│
├── logs/
│   └── agent.log
│
└── agent.db                # SQLite database
```

### Database Size Management

**Growth:**
- Events: ~200 bytes per event
- Telemetry: ~150 bytes per telemetry
- Expected: ~100 events/day = 20KB/day
- Monthly: ~600KB

**Cleanup:**
- Synced records deleted after 7 days
- Automatic cleanup in sync loop
- Manual cleanup via SQL if needed

---

## Performance

### Timing Breakdown

**Recognition Loop (per iteration):**
```
Get frame:           <1ms   (non-blocking)
Face detection:      80-150ms
Anti-spoofing:       15-30ms (optional)
Face recognition:    20-50ms
Event handling:      5-10ms
Sleep:              100ms
────────────────────────────
Total per loop:     ~220-340ms
```

**FPS:**
- Recognition: ~3-5 FPS effective
- Camera: 15-30 FPS continuous

### Resource Usage (Raspberry Pi 5)

**CPU:**
- Idle: 5-10%
- Recognition active: 30-50%
- Peak (with anti-spoofing): 60-70%

**RAM:**
- Base: ~100MB
- With DeepFace: ~300MB
- With camera buffers: +50MB

**Disk:**
- Code: ~50MB
- Models: ~10MB
- Data (per month): ~1GB (events + snapshots)

### Optimization Techniques

1. **Non-blocking frame access** - Camera runs in separate thread
2. **Sleep between recognition** - 100ms reduces CPU load
3. **Cooldown mechanism** - Prevents repeated processing
4. **Batch sync** - Reduces network overhead
5. **Local models** - No network latency
6. **CPU-only PyTorch** - No CUDA overhead

---

## Threading Model

```
Main Thread (asyncio event loop)
├─> heartbeat_loop (async task)
├─> telemetry_loop (async task)
├─> command_poller (async task)
└─> sync_manager (async task)

Background Thread 1: Camera capture
└─> _capture_loop() continuously

Background Thread 2: Recognition
└─> _recognition_loop() continuously
```

**Thread Safety:**
- Camera frame: protected by `threading.Lock`
- Database: SQLite serialized mode
- Events: asyncio-safe queue
- No shared mutable state between threads

---

## Error Handling

### Resilience Strategies

1. **Camera failure** → Log error, retry initialization
2. **Recognition error** → Skip frame, continue loop
3. **Backend unavailable** → Buffer locally, auto-sync later
4. **GPIO error** → Log, continue (graceful degradation)
5. **Model not trained** → Disable recognition, wait for training

### Recovery Mechanisms

- Automatic reconnection on network restore
- Graceful degradation (disable features if hardware unavailable)
- Event buffering prevents data loss
- Watchdog restart via systemd (optional)

---

## Version

**Version:** 1.0.0  
**Last Updated:** 2026-07-16
