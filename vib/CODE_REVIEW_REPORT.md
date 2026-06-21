# FaceGuard Agent - Код-ревью и рекомендации по улучшению

**Дата:** 2026-06-21  
**Проект:** FaceGuard V1  
**Анализируемые компоненты:** `agent/`, `backend-service/`, `frontend/faceguard-web/`  
**Backend URL:** http://10.93.26.183:8000/

---

## Краткое резюме

**Общая оценка кода:** 7.5/10

Проект имеет хорошую архитектуру с четким разделением ответственности. Код читаемый и структурированный. Обнаружены критичные проблемы безопасности и несколько архитектурных недостатков, требующих исправления.

**Что хорошо:**
- ✅ Чистая модульная архитектура (camera, recognition, sync, commands)
- ✅ Graceful shutdown с корректной обработкой сигналов
- ✅ Offline-first подход с SQLite буферизацией
- ✅ Поддержка mock режима для разработки без железа
- ✅ Логирование с правильными уровнями

**Критичные проблемы:**
- 🔴 **SECURITY**: Hardcoded IP адреса в клиентском коде
- 🔴 **SECURITY**: CORS allow_origins=["*"] в production
- 🔴 **SECURITY**: Токен передается в query string (WebSocket, фото)
- 🟡 Отсутствие типизации (type hints)
- 🟡 Отсутствие unit/integration тестов
- 🟡 SQL injection риск в database.py (хотя минимальный)

---

## 1. Безопасность (Security) - КРИТИЧНО

### 🔴 Проблема 1: Hardcoded IP адреса и учетные данные

**Файл:** `frontend/faceguard-web/src/services/api.service.ts:13`

```typescript
const API_BASE_URL = "http://10.93.26.183:8000/api/v1";
```

**Проблема:**
- IP адрес захардкожен в клиентском коде
- При смене сервера нужно пересобирать frontend
- Невозможно использовать разные окружения (dev/prod)

**Решение:**
```typescript
// api.service.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// .env.development
VITE_API_BASE_URL=http://10.93.26.183:8000/api/v1

// .env.production
VITE_API_BASE_URL=https://api.faceguard.production.com/api/v1
```

---

### 🔴 Проблема 2: CORS allow_origins=["*"]

**Файл:** `backend-service/app/main.py:15`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    ...
)
```

**Проблема:**
- Любой сайт может делать запросы к вашему API с credentials
- Риск CSRF атак
- Комментарий есть, но код не исправлен

**Решение:**
```python
# backend-service/app/core/config.py
class Settings:
    cors_origins: list = os.getenv(
        "CORS_ORIGINS", 
        "http://localhost:3000,http://localhost:5173"
    ).split(",")

# backend-service/app/main.py
from app.core.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)
```

---

### 🔴 Проблема 3: Токены в query string

**Файлы:** 
- `frontend/faceguard-web/src/services/api.service.ts:139`
- `frontend/faceguard-web/src/services/api.service.ts:462`

```typescript
getPhotoContentUrl(...): string {
    const token = tokenUtils.getToken();
    return `${API_BASE_URL}/people/${personId}/photos/${photoId}/content?type=${type}&token=${token}`;
}

getWebSocketUrl(): string {
    const token = tokenUtils.getToken();
    return `ws://10.93.26.183:8000/ws/events?token=${token}`;
}
```

**Проблема:**
- Токены в URL логируются на серверах, прокси, в истории браузера
- Риск утечки токена через Referer header
- Плохая практика безопасности

**Решение:**

Для изображений - использовать временные signed URLs:
```python
# backend-service/app/api/photos.py
from itsdangerous import URLSafeTimedSerializer

def generate_photo_token(photo_id: str, expires_in: int = 3600) -> str:
    serializer = URLSafeTimedSerializer(settings.secret_key)
    return serializer.dumps(photo_id, salt="photo-access")

@router.get("/people/{person_id}/photos/{photo_id}/url")
async def get_photo_url(person_id: str, photo_id: str, user: User = Depends(get_current_user)):
    # Проверка прав доступа
    signed_token = generate_photo_token(photo_id)
    return {"url": f"/api/v1/photos/signed/{signed_token}"}
```

Для WebSocket - использовать cookie или заголовок при upgrade:
```typescript
// Вариант 1: WebSocket с заголовком через Sec-WebSocket-Protocol
const ws = new WebSocket(wsUrl, [`Bearer.${token}`]);

// Вариант 2: Cookie-based auth (лучше)
// Устанавливать httpOnly cookie при логине
```

---

## 2. Архитектура и код-качество

### 🟡 Проблема 4: Отсутствие type hints в Python

**Файлы:** Большинство функций в `agent/`

```python
# Текущий код
def get_cpu_usage(self):
    try:
        return psutil.cpu_percent(interval=1)
    except Exception as e:
        return 0.0
```

**Решение:**
```python
from typing import Optional

def get_cpu_usage(self) -> float:
    """Get CPU usage percentage.
    
    Returns:
        float: CPU usage percentage (0.0-100.0)
    """
    try:
        return psutil.cpu_percent(interval=1)
    except Exception as e:
        logger.error(f"Failed to get CPU usage: {e}")
        return 0.0
```

**Польза:**
- Автодополнение в IDE
- Ловит ошибки на этапе статического анализа (mypy)
- Самодокументирующийся код

---

### 🟡 Проблема 5: Широкие exception handlers

**Файл:** `agent/sync/backend_client.py:64-66`, и другие

```python
except httpx.HTTPError as e:
    logger.error(f"Failed to register device: {e}")
    raise
```

**Проблема:**
- Ловит все HTTP ошибки одинаково
- Не различает 4xx (клиентские) и 5xx (серверные) ошибки
- Не обрабатывает network timeout отдельно

**Решение:**
```python
except httpx.TimeoutException as e:
    logger.error(f"Device registration timeout: {e}")
    raise DeviceRegistrationError("Backend not responding") from e
except httpx.HTTPStatusError as e:
    if e.response.status_code == 409:
        logger.warning(f"Device already registered: {Config.DEVICE_CODE}")
        return e.response.json()
    elif 500 <= e.response.status_code < 600:
        logger.error(f"Backend server error: {e}")
        raise DeviceRegistrationError("Backend service error") from e
    else:
        logger.error(f"Registration failed: {e.response.status_code}")
        raise
except httpx.NetworkError as e:
    logger.error(f"Network error during registration: {e}")
    raise DeviceRegistrationError("Cannot reach backend") from e
```

---

### 🟡 Проблема 6: SQL injection риск (теоретический)

**Файл:** `agent/core/database.py:131-133`

```python
placeholders = ",".join("?" * len(event_ids))
cursor.execute(f"""
    UPDATE events SET synced = 1, synced_at = ? WHERE id IN ({placeholders})
""", [datetime.utcnow().isoformat()] + event_ids)
```

**Проблема:**
- f-string с SQL (хотя placeholders безопасен)
- Если event_ids содержит не int, может быть проблема

**Решение:**
```python
def mark_events_synced(self, event_ids: List[int]) -> None:
    """Mark events as synced.
    
    Args:
        event_ids: List of event IDs to mark as synced
        
    Raises:
        ValueError: If event_ids contains non-integer values
    """
    if not event_ids:
        return
    
    # Валидация типов
    if not all(isinstance(eid, int) for eid in event_ids):
        raise ValueError("All event_ids must be integers")
    
    with self._get_connection() as conn:
        cursor = conn.cursor()
        placeholders = ",".join("?" * len(event_ids))
        query = f"UPDATE events SET synced = 1, synced_at = ? WHERE id IN ({placeholders})"
        cursor.execute(query, [datetime.utcnow().isoformat()] + event_ids)
        conn.commit()
        logger.debug(f"Marked {len(event_ids)} events as synced")
```

---

## 3. Производительность

### 🟡 Проблема 7: CPU usage blocking call

**Файл:** `agent/telemetry/telemetry_service.py:25`

```python
def get_cpu_usage(self) -> float:
    try:
        return psutil.cpu_percent(interval=1)  # Блокирует на 1 секунду!
```

**Проблема:**
- `interval=1` блокирует выполнение на 1 секунду
- Вызывается в heartbeat loop каждые 10 секунд
- Может вызывать задержки

**Решение:**
```python
def __init__(self):
    self.start_time = time.time()
    self.boot_time = psutil.boot_time()
    # Начальный вызов для инициализации
    psutil.cpu_percent(interval=None)

def get_cpu_usage(self) -> float:
    """Get CPU usage percentage (non-blocking).
    
    Returns average CPU usage since last call.
    """
    try:
        # interval=None использует значение с прошлого вызова
        return psutil.cpu_percent(interval=None)
    except Exception as e:
        logger.error(f"Failed to get CPU usage: {e}")
        return 0.0
```

---

### 🟡 Проблема 8: Отсутствие connection pooling

**Файл:** `agent/core/database.py:84-91`

```python
@contextmanager
def _get_connection(self):
    conn = sqlite3.connect(str(self.db_path))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
```

**Проблема:**
- Каждый запрос открывает новое соединение
- Overhead на open/close
- SQLite может быть медленным при частых open/close

**Решение:**
```python
# Для SQLite достаточно использовать thread-local connection
import threading

class Database:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or Config.DATABASE_FILE
        self._local = threading.local()
        self._init_database()
    
    def _get_connection_cached(self) -> sqlite3.Connection:
        """Get thread-local cached connection."""
        if not hasattr(self._local, 'conn') or self._local.conn is None:
            self._local.conn = sqlite3.connect(
                str(self.db_path),
                check_same_thread=False,
                timeout=10.0
            )
            self._local.conn.row_factory = sqlite3.Row
            # Enable WAL mode for better concurrency
            self._local.conn.execute("PRAGMA journal_mode=WAL")
        return self._local.conn
```

---

## 4. Расширяемость и поддержка

### 🟢 Проблема 9: Отсутствие тестов

**Текущее состояние:** Нет unit/integration тестов

**Рекомендация:** Добавить тесты для критичных компонентов

```python
# tests/test_recognition.py
import pytest
from agent.recognition.recognizer import RecognitionService

def test_recognition_service_init():
    service = RecognitionService()
    assert service.is_trained == False
    assert service.face_detector is not None

def test_train_model_no_faces():
    service = RecognitionService()
    with pytest.raises(RuntimeError, match="No faces found"):
        service.train_model()

# tests/test_backend_client.py
import pytest
from unittest.mock import AsyncMock, patch
from agent.sync.backend_client import BackendClient

@pytest.mark.asyncio
async def test_send_heartbeat_success():
    client = BackendClient()
    with patch.object(client, '_get_client') as mock_client:
        mock_response = AsyncMock()
        mock_response.json.return_value = {"status": "ok"}
        mock_client.return_value.post = AsyncMock(return_value=mock_response)
        
        result = await client.send_heartbeat({"cpu": 50})
        assert result == True
```

---

### 🟡 Проблема 10: Отсутствие метрик и мониторинга

**Рекомендация:** Добавить Prometheus metrics

```python
# agent/metrics/prometheus.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# Метрики
recognition_attempts = Counter(
    'faceguard_recognition_attempts_total',
    'Total face recognition attempts',
    ['result']  # recognized, unknown, no_face
)

recognition_duration = Histogram(
    'faceguard_recognition_duration_seconds',
    'Face recognition processing time'
)

camera_fps = Gauge(
    'faceguard_camera_fps',
    'Current camera FPS'
)

door_openings = Counter(
    'faceguard_door_openings_total',
    'Total door openings',
    ['trigger']  # recognized, manual, emergency
)

# Использование
recognition_attempts.labels(result='recognized').inc()
with recognition_duration.time():
    result = recognizer.recognize_face(frame)
```

---

## 5. Решение проблемы с камерой для разработки

### ✅ Mock Camera уже реализован!

**Текущая реализация:** `agent/camera/camera_service.py:84-90`

```python
def _init_simulated_camera(self):
    """Initialize simulated camera for testing"""
    logger.info("Initializing simulated camera...")
    self.camera = None
    self.camera_type = "simulated"
    logger.info("Simulated camera initialized")
```

**Как использовать:**

1. В `.env` файле агента:
```bash
HARDWARE_MODE=development  # Не raspberry_pi
```

2. Симулированная камера генерирует тестовые фреймы с текстом и timestamp

**Улучшение:** Добавить поддержку тестовых видео/изображений

```python
# agent/camera/camera_service.py

def _init_simulated_camera(self):
    """Initialize simulated camera with test media support"""
    logger.info("Initializing simulated camera...")
    
    # Проверяем наличие тестового видео
    test_video_path = Config.DATA_DIR / "test_media" / "test_video.mp4"
    test_images_dir = Config.DATA_DIR / "test_media" / "images"
    
    if test_video_path.exists():
        logger.info(f"Using test video: {test_video_path}")
        self.camera = cv2.VideoCapture(str(test_video_path))
        self.camera_type = "test_video"
        # Зацикливание видео
        self.camera.set(cv2.CAP_PROP_POS_FRAMES, 0)
    elif test_images_dir.exists():
        logger.info(f"Using test images from: {test_images_dir}")
        self.test_images = sorted(test_images_dir.glob("*.jpg"))
        self.current_image_idx = 0
        self.camera = None
        self.camera_type = "test_images"
    else:
        logger.info("Using generated test frames")
        self.camera = None
        self.camera_type = "simulated"

def _grab_frame(self) -> Optional[np.ndarray]:
    if self.camera_type == "test_video":
        ret, frame = self.camera.read()
        if not ret:
            # Зацикливание
            self.camera.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = self.camera.read()
        return frame if ret else None
    
    elif self.camera_type == "test_images":
        if not self.test_images:
            return self._generate_simulated_frame()
        
        img_path = self.test_images[self.current_image_idx]
        frame = cv2.imread(str(img_path))
        
        # Следующее изображение каждую секунду
        self.current_image_idx = (self.current_image_idx + 1) % len(self.test_images)
        return frame
    
    elif self.camera_type == "simulated":
        return self._generate_simulated_frame()
```

**Инструкции:**
```bash
# Создать тестовую директорию
mkdir -p data/test_media/images

# Положить туда изображения с лицами для тестирования
cp /path/to/test/photos/*.jpg data/test_media/images/

# Или использовать видео
cp /path/to/test/video.mp4 data/test_media/test_video.mp4
```

---

## 6. Приоритизированный план действий

### 🔴 Критично (сделать немедленно)

1. **Убрать hardcoded IP из frontend**
   - Переместить в environment variables
   - Добавить `.env` файлы для dev/prod

2. **Исправить CORS настройки**
   - Убрать `allow_origins=["*"]`
   - Использовать whitelist доменов из конфига

3. **Убрать токены из URL**
   - Использовать signed URLs для фото
   - Cookie-based auth для WebSocket

### 🟡 Важно (следующая итерация)

4. **Добавить type hints во все функции**
   - Использовать mypy для проверки
   - Улучшит maintainability

5. **Улучшить error handling**
   - Специфичные exceptions вместо общих
   - Retry logic для network errors

6. **Добавить базовые тесты**
   - Unit тесты для критичной логики
   - Integration тесты для API

### 🟢 Желательно (backlog)

7. **Добавить метрики Prometheus**
8. **Connection pooling для DB**
9. **Оптимизировать CPU telemetry**
10. **Документация API (OpenAPI)**

---

## 7. Дополнительные рекомендации

### Конфигурация для production

**Файл:** `agent/.env.production`
```bash
# Backend
BACKEND_URL=https://api.faceguard.production.com
DEVICE_CODE=rpi-location-001

# Hardware
HARDWARE_MODE=raspberry_pi

# Security
LOG_LEVEL=WARNING

# Performance
HEARTBEAT_INTERVAL=30
TELEMETRY_INTERVAL=60
```

### Dockerfile improvements

```dockerfile
# agent/Dockerfile
FROM python:3.11-slim

# Security: не запускать от root
RUN useradd -m -u 1000 faceguard
USER faceguard

# Копировать только requirements сначала (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app
WORKDIR /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8001/health')"

CMD ["python", "-u", "main.py"]
```

### Logging improvements

```python
# agent/core/logging.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

# Использование для production
if Config.environment == "production":
    handler.setFormatter(JSONFormatter())
```

---

## Заключение

Проект имеет солидный фундамент с хорошей архитектурой. Основные проблемы связаны с безопасностью и отсутствием тестирования. 

**Рекомендуемый порядок действий:**
1. Исправить критичные проблемы безопасности (1-3 дня)
2. Добавить type hints и базовые тесты (3-5 дней)
3. Улучшить error handling и мониторинг (2-3 дня)

После этого проект будет готов к production deployment.

**Вопросы для обсуждения:**
- Нужны ли юнит-тесты с покрытием или достаточно integration тестов?
- Планируется ли мультитенантность (несколько организаций)?
- Какие требования к масштабируемости (количество устройств)?

---

**Автор ревью:** Claude (Kiro AI)  
**Контакт:** Готов обсудить детали и помочь с имплементацией
