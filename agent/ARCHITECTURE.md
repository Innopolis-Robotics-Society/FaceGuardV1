# FaceGuard Agent - Архитектура и принцип работы

> Подробное описание внутреннего устройства агента

## 📐 Архитектура системы

### Общая схема компонентов

```
main.py (FaceGuardAgent)
    │
    ├── Core Services
    │   ├── Database (SQLite)          # Офлайн буфер
    │   ├── Config                     # Конфигурация из .env
    │   └── Logger                     # Логирование
    │
    ├── Hardware Layer
    │   ├── CameraService              # Захват видео
    │   │   ├── picamera2 (Pi Camera)
    │   │   ├── OpenCV (USB Camera)
    │   │   └── Simulated (Mock)
    │   │
    │   └── DoorController             # Управление дверью
    │       ├── GPIO (Raspberry Pi)
    │       └── Mock (Development)
    │
    ├── Recognition Layer
    │   ├── RecognitionService         # LBPH модель
    │   │   ├── train_model()
    │   │   ├── load_model()
    │   │   └── recognize_face()
    │   │
    │   ├── RecognitionLoop            # Фоновый поток
    │   │   └── непрерывное распознавание
    │   │
    │   └── CaptureService             # Захват фото для регистрации
    │
    ├── Communication Layer
    │   ├── BackendClient              # HTTP клиент
    │   │   ├── send_heartbeat()
    │   │   ├── send_event()
    │   │   ├── send_telemetry()
    │   │   └── get_pending_commands()
    │   │
    │   └── SyncManager                # Управление синхронизацией
    │       ├── online/offline detection
    │       ├── event buffering
    │       └── batch sync
    │
    ├── Command Layer
    │   ├── CommandExecutor            # Выполнение команд
    │   │   ├── capture_photos
    │   │   ├── rebuild_model
    │   │   ├── open_door
    │   │   └── restart_*
    │   │
    │   └── CommandPoller              # Опрос команд
    │       └── polling каждые 5 сек
    │
    └── Event Layer
        ├── EventHandler               # Обработка событий
        │   ├── on_person_recognized
        │   ├── on_unknown_person
        │   └── on_access_denied
        │
        └── TelemetryService           # Системная телеметрия
            ├── CPU/RAM/Temp
            └── Camera FPS
```

---

## 🔄 Жизненный цикл агента

### 1. Запуск (main.py → FaceGuardAgent.__init__)

```python
# 1. Инициализация базовых сервисов
Database()          # Создаёт agent.db
BackendClient()     # HTTP клиент

# 2. Инициализация аппаратных сервисов
CameraService()     # Определяет тип камеры и инициализирует
DoorController()    # Определяет режим (GPIO/Mock)

# 3. Инициализация распознавания
RecognitionService()  # Загружает модель если существует
CaptureService()      # Сервис для захвата фото

# 4. Инициализация синхронизации
SyncManager()       # Управление online/offline
CommandExecutor()   # Обработчики команд
CommandPoller()     # Опрос backend

# 5. Инициализация событий
EventHandler()      # Обработка событий распознавания
RecognitionLoop()   # Фоновый цикл распознавания
```

### 2. Старт всех сервисов (FaceGuardAgent.start)

```python
# 1. Валидация конфигурации
Config.validate()

# 2. Запуск камеры
camera.start()
# → Создаёт background thread для захвата кадров

# 3. Запуск sync manager
await sync_manager.start()
# → Создаёт asyncio task для синхронизации

# 4. Запуск command poller
await command_poller.start()
# → Создаёт asyncio task для опроса команд

# 5. Запуск recognition loop (если модель обучена)
if recognition.is_trained:
    recognition_loop.start()
    # → Создаёт thread для непрерывного распознавания

# 6. Запуск background tasks
asyncio.create_task(heartbeat_loop())    # Heartbeat каждые 10 сек
asyncio.create_task(telemetry_loop())    # Telemetry каждые 30 сек
```

---

## 🎥 Как работает камера

### CameraService - Непрерывный захват

```
┌──────────────────────────────────────────┐
│         CameraService.start()            │
└──────────────┬───────────────────────────┘
               │
               v
┌──────────────────────────────────────────┐
│    Background Thread (_capture_loop)     │
│                                          │
│  while is_running:                       │
│    frame = _grab_frame()                 │
│    with frame_lock:                      │
│        current_frame = frame             │
│    sleep(1/FPS)                          │
└──────────────┬───────────────────────────┘
               │
               v
┌──────────────────────────────────────────┐
│   _grab_frame() - платформо-зависимый   │
│                                          │
│   if picamera2:                          │
│     → camera.capture_array()             │
│   elif opencv:                           │
│     → camera.read()                      │
│   elif simulated:                        │
│     → generate_test_frame()              │
└──────────────────────────────────────────┘
```

**Использование:**

```python
# В любом месте можно получить текущий кадр
frame = camera.get_frame()  # Неблокирующий вызов

# Или захватить свежий кадр
frame = camera.capture_frame()  # Блокирующий вызов
```

---

## 🧠 Как работает распознавание

### Процесс обучения модели

```
1. СКАНИРОВАНИЕ ПАПОК
   data/faces/
   ├── person-uuid-1/processed/
   │   ├── face_001.jpg  (200x200 grayscale)
   │   ├── face_002.jpg
   │   └── ...
   └── person-uuid-2/processed/
       └── ...

2. ЗАГРУЗКА ФОТОГРАФИЙ
   for person_dir in faces_dir:
       label = current_label++
       label_map[label] = person_uuid
       
       for photo in processed_dir:
           face_img = cv2.imread(photo, GRAYSCALE)
           faces.append(face_img)
           labels.append(label)

3. ОБУЧЕНИЕ LBPH
   recognizer = cv2.face.LBPHFaceRecognizer_create()
   recognizer.train(faces, labels)
   
4. СОХРАНЕНИЕ
   recognizer.save('data/models/face_model.yml')
   json.dump(label_map, 'data/models/labels.json')
   
   labels.json:
   {
     "0": "person-uuid-1",
     "1": "person-uuid-2"
   }
```

### RecognitionLoop - Непрерывное распознавание

```
┌────────────────────────────────────────────┐
│   RecognitionLoop.start() в отдельном thread│
└────────────┬───────────────────────────────┘
             │
             v
┌────────────────────────────────────────────┐
│    while is_running:                       │
│                                            │
│  1. frame = camera.get_frame()             │
│  2. result = recognition.recognize_face()  │
│     │                                      │
│     ├─> None → no face detected           │
│     │                                      │
│     ├─> recognized=True                   │
│     │   → _handle_recognized()            │
│     │   → check cooldown                  │
│     │   → door.open_door()                │
│     │   → save snapshot                   │
│     │   → on_recognized callback          │
│     │                                      │
│     └─> recognized=False                  │
│         → _handle_unknown()               │
│         → save snapshot                   │
│         → on_unknown callback             │
│                                            │
│  3. sleep(0.1)                             │
└────────────────────────────────────────────┘
```

### RecognitionService.recognize_face()

```python
def recognize_face(frame: np.ndarray) -> Optional[Dict]:
    # 1. Конвертация в grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # 2. Детекция лица (Haar Cascade)
    faces = face_detector.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=5,
        minSize=(80, 80)
    )
    # ~80-150ms
    
    if len(faces) == 0:
        return None  # Лицо не найдено
    
    # 3. Обработка первого лица
    x, y, w, h = faces[0]
    face_roi = gray[y:y+h, x:x+w]
    face_resized = cv2.resize(face_roi, (200, 200))
    
    # 4. Распознавание (LBPH)
    label, confidence = recognizer.predict(face_resized)
    # ~20-50ms
    
    # 5. Проверка порога
    recognized = confidence < RECOGNITION_THRESHOLD
    person_id = label_map.get(label) if recognized else None
    
    return {
        "recognized": recognized,
        "person_id": person_id,
        "confidence": confidence,
        "face_bbox": {"x": x, "y": y, "w": w, "h": h}
    }
```

**Итоговое время:** 80-150ms (детекция) + 20-50ms (распознавание) = **100-200ms**

---

## 🚪 Как работает дверь

### DoorController

```python
class DoorController:
    def __init__(self):
        if Config.is_raspberry_pi():
            # Реальный GPIO
            from gpiozero import Servo
            self.servo = Servo(Config.SERVO_GPIO_PIN)
            self.servo_type = "gpio"
        else:
            # Mock для разработки
            self.servo = None
            self.servo_type = "mock"
    
    def open_door(self, duration=5):
        if self.servo_type == "gpio":
            # Сервопривод на максимум (открыто)
            self.servo.max()
            time.sleep(duration)
            # Сервопривод на минимум (закрыто)
            self.servo.min()
        
        elif self.servo_type == "mock":
            # Просто логируем
            logger.info(f"[MOCK] Door opened for {duration}s")
            time.sleep(duration)
            logger.info("[MOCK] Door closed")
```

**Timing:**
- GPIO команда: ~5ms
- Физическое движение сервопривода: ~1-2 секунды
- Общее время открытия: 5 секунд (настраивается)

---

## 🔄 Синхронизация и офлайн режим

### SyncManager - Управление состоянием

```
┌────────────────────────────────────────────┐
│   SyncManager._sync_loop() каждые 60 сек   │
└────────────┬───────────────────────────────┘
             │
             v
┌────────────────────────────────────────────┐
│  1. is_online = backend.check_connection() │
│                                            │
│  2. if online != previous_state:           │
│       if online:                           │
│         → _on_reconnect()                  │
│           → register device                │
│       else:                                │
│         → logger.warning("offline mode")   │
│                                            │
│  3. if online:                             │
│       → _sync_unsynced_events()            │
│       → _sync_unsynced_telemetry()         │
└────────────────────────────────────────────┘
```

### Добавление события

```python
async def add_event(event_data: dict):
    # 1. ВСЕГДА сохраняем в SQLite
    event_id = db.add_event(event_data)
    
    # 2. Пытаемся отправить сразу если online
    if is_online:
        success = await backend.send_event(event_data)
        if success:
            db.mark_events_synced([event_id])
        else:
            # Не получилось - останется в буфере
            pass
    else:
        # Офлайн - останется в буфере до синхронизации
        pass
```

### Batch синхронизация

```python
async def _sync_unsynced_events():
    # 1. Получить до 100 несинхронизированных событий
    unsynced = db.get_unsynced_events(limit=100)
    
    if not unsynced:
        return
    
    # 2. Конвертировать в формат backend
    events_to_sync = [convert_to_backend_format(e) for e in unsynced]
    
    # 3. Отправить одним запросом
    success = await backend.sync_events_batch(events_to_sync)
    
    # 4. Пометить как синхронизированные
    if success:
        event_ids = [e["id"] for e in unsynced]
        db.mark_events_synced(event_ids)
```

---

## 📡 Command Execution

### Как работают команды

```
┌───────────────────────────────────────────────────┐
│ BACKEND: Админ создаёт команду                    │
│ POST /api/v1/commands/                            │
│ {                                                 │
│   "device_id": "uuid",                            │
│   "command_type": "capture_photos",               │
│   "parameters": "{\"person_id\": \"...\"}"        │
│ }                                                 │
│ → Сохраняется в БД со status="pending"            │
└───────────────┬───────────────────────────────────┘
                │
                v (каждые 5 секунд)
┌───────────────────────────────────────────────────┐
│ AGENT: CommandPoller.poll_loop()                  │
│ GET /api/v1/commands/pending?device_id=uuid       │
│ → Получает список pending команд                  │
└───────────────┬───────────────────────────────────┘
                │
                v
┌───────────────────────────────────────────────────┐
│ AGENT: CommandExecutor.execute_command()          │
│                                                   │
│ 1. Обновить статус → "running"                    │
│    PATCH /api/v1/commands/{id}                    │
│                                                   │
│ 2. Выполнить команду                              │
│    handler = handlers[command_type]               │
│    result = await handler(parameters)             │
│                                                   │
│ 3. Обновить статус → "completed"/"failed"         │
│    PATCH /api/v1/commands/{id}                    │
│    + отправить result или error                   │
└───────────────────────────────────────────────────┘
```

### Пример: capture_photos

```python
async def _handle_capture_photos(params: Dict) -> Dict:
    person_id = params["person_id"]
    count = params.get("count", 15)
    
    # 1. Захват фотографий
    result = capture_service.capture_person_photos(
        person_id=person_id,
        count=count,
        interval=0.5
    )
    
    # result содержит:
    # - captured_count: сколько успешно
    # - skipped_count: сколько пропущено
    # - photos: список путей к файлам
    
    return result
```

---

## 📊 Telemetry

### TelemetryService - Сбор метрик

```python
def collect_telemetry() -> Dict:
    return {
        "device_id": Config.DEVICE_ID,
        "cpu_usage": psutil.cpu_percent(interval=1),
        "cpu_temperature": read_thermal_zone(),  # Raspberry Pi
        "ram_usage": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent,
        "uptime": time.time() - boot_time,
        "camera_fps": camera.get_fps(),
        "network_status": check_network(),
        "recognition_running": recognition_loop.is_active(),
        "created_at": datetime.utcnow().isoformat()
    }
```

### Отправка телеметрии

```
┌────────────────────────────────────────────┐
│   telemetry_loop() каждые 30 секунд       │
└────────────┬───────────────────────────────┘
             │
             v
┌────────────────────────────────────────────┐
│  1. telemetry = collect_telemetry()        │
│  2. await sync_manager.add_telemetry()     │
│     → сохранить в SQLite                   │
│     → если online: отправить в backend     │
└────────────────────────────────────────────┘
```

---

## 🗂️ Data Storage

### Структура файлов

```
data/
├── faces/                      # Фотографии людей
│   └── {person_uuid}/
│       ├── original/           # Оригинальные фото с камеры
│       │   ├── photo_20260615_120530_001.jpg
│       │   └── photo_20260615_120531_002.jpg
│       └── processed/          # Обработанные лица (200x200 grayscale)
│           ├── face_20260615_120530_001.jpg
│           └── face_20260615_120531_002.jpg
│
├── events/                     # Снапшоты событий
│   └── 2026/06/15/
│       ├── recognized_person-uuid_120545_123.jpg
│       └── unknown_unknown_120612_456.jpg
│
├── models/                     # LBPH модель
│   ├── face_model.yml         # Обученная модель OpenCV
│   └── labels.json            # Маппинг: label_id → person_uuid
│
├── logs/
│   └── agent.log              # Текстовые логи
│
└── agent.db                   # SQLite база
    ├── events (id, person_id, event_type, synced)
    ├── telemetry (id, cpu_usage, synced)
    └── commands (id, command_type, status)
```

### SQLite Schema

```sql
-- События распознавания
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    device_id TEXT,
    person_id TEXT,
    event_type TEXT,        -- recognized, unknown, access_denied
    confidence REAL,
    door_opened INTEGER,
    photo_path TEXT,
    created_at TEXT,
    synced INTEGER DEFAULT 0,
    synced_at TEXT
);

-- Телеметрия
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

-- Команды
CREATE TABLE commands (
    id INTEGER PRIMARY KEY,
    command_id TEXT UNIQUE,
    command_type TEXT,
    parameters TEXT,        -- JSON string
    status TEXT,            -- pending, running, completed, failed
    result TEXT,
    error_message TEXT,
    created_at TEXT,
    executed_at TEXT,
    completed_at TEXT
);
```

---

## 🔐 Безопасность

### Аутентификация с backend

Agent использует:
- `DEVICE_CODE` - уникальный код устройства (в .env)
- `DEVICE_ID` - UUID из backend (получается при регистрации)

Backend проверяет device_code при heartbeat и регистрации.

### Локальная безопасность

- SQLite база не содержит чувствительных данных
- Фотографии хранятся по UUID (не по именам)
- Логи не содержат личной информации

---

## ⚙️ Конфигурация и параметры

### Критичные параметры

| Параметр | Влияние | Рекомендация |
|----------|---------|--------------|
| `RECOGNITION_THRESHOLD` | Точность распознавания | 50-70 для баланса |
| `ACTION_COOLDOWN_SECONDS` | Частота срабатываний | 5 сек минимум |
| `CAMERA_FPS` | Нагрузка на CPU | 15-30 в зависимости от Pi |
| `MIN_FACE_SIZE` | Дистанция распознавания | 80 для 1-2 метров |
| `DOOR_OPEN_DURATION` | Время открытия двери | 5-10 секунд |

### Оптимизация производительности

**Для Raspberry Pi 3:**
```env
CAMERA_FPS=15
MIN_FACE_SIZE=100
FACE_SCALE_FACTOR=1.3
```

**Для Raspberry Pi 5:**
```env
CAMERA_FPS=30
MIN_FACE_SIZE=80
FACE_SCALE_FACTOR=1.2
```

---

**Версия:** 1.0.0  
**Обновлено:** 2026-06-15
