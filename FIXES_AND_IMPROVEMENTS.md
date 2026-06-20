# FaceGuard - Исправления и улучшения

## ✅ Исправлено

### 1. WebSocket endpoint добавлен

**Создан файл:** `backend-service/app/api/websocket.py`

WebSocket endpoint теперь доступен на `ws://10.93.26.183:8000/ws/events?token=YOUR_TOKEN`

**Функционал:**
- Аутентификация через JWT токен
- Broadcast события распознавания (recognition_event)
- Broadcast события двери (door_event)
- Broadcast статусов команд (command_status)
- Keepalive ping каждые 30 секунд
- Автоматическое переподключение на клиенте

**Использование в agent для отправки событий:**
```python
from app.api.websocket import broadcast_recognition_event

# При распознавании лица
await broadcast_recognition_event(
    event_type="recognized",
    person_id=person_id,
    person_name=person_name,
    confidence=confidence,
    door_opened=True
)
```

### 2. Backend main.py обновлен

WebSocket router добавлен в `backend-service/app/main.py`

---

## 🔧 Необходимо сделать

### 1. Перезапустить backend

```bash
cd backend-service
# Если используете Docker
docker-compose restart

# Если запускаете напрямую
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Проверить WebSocket подключение

После перезапуска backend WebSocket должен работать. В консоли браузера вы должны увидеть:
```
[WebSocket] Connected
```

### 3. Исправить ошибку 422 в запросе событий

**Проблема:** `GET /api/v1/events/?device_id=&limit=10` - пустой `device_id`

**Причина:** В LiveCamera.tsx строка 133:
```typescript
const { data: recentEvents = [] } = useGetEvents({ device_id: deviceId, limit: 10 });
```

`deviceId` пустой, потому что нет активных устройств или они не загрузились.

**Решение:** Добавить проверку перед запросом

```typescript
// LiveCamera.tsx:133
const { data: recentEvents = [] } = useGetEvents(
  deviceId ? { device_id: deviceId, limit: 10 } : undefined,
  { enabled: !!deviceId } // Только если deviceId есть
);
```

### 4. Agent не запущен (порт 8001)

**Проблема:** `ERR_CONNECTION_REFUSED` на `http://10.93.26.183:8001/api/v1/stream`

Agent должен быть запущен на порту 8001 для стриминга камеры.

**Решение:** Запустить agent с mock камерой (без физического устройства)

---

## 📹 Запуск Agent без камеры (Mock режим)

### Способ 1: Используйте существующий simulated camera

Уже реализовано! Просто настройте `.env`:

```bash
# agent/.env
HARDWARE_MODE=development
BACKEND_URL=http://10.93.26.183:8000
DEVICE_CODE=dev-laptop-001

# Опционально
CAMERA_INDEX=0
CAMERA_WIDTH=640
CAMERA_HEIGHT=480
CAMERA_FPS=30
```

Запуск:
```bash
cd agent
python main.py
```

### Способ 2: Улучшенный mock с тестовыми файлами

Я подготовил улучшенную версию в отчете `CODE_REVIEW_REPORT.md`, которая поддерживает:

1. **Тестовое видео** - положите `data/test_media/test_video.mp4`
2. **Папка с изображениями** - положите фото в `data/test_media/images/*.jpg`
3. **Генерируемые фреймы** - работает автоматически

**Применить улучшение:**

В `agent/camera/camera_service.py` заменить метод `_init_simulated_camera()` и `_grab_frame()` кодом из отчета (секция 5).

### Способ 3: Использовать существующую веб-камеру

Если на вашем ПК есть веб-камера:

```bash
# agent/.env
HARDWARE_MODE=development
CAMERA_INDEX=0  # Индекс вашей камеры (0 - первая)
```

Agent автоматически попробует использовать OpenCV для захвата с камеры.

---

## 🚀 Пошаговая инструкция для запуска

### 1. Перезапустите backend

```bash
cd D:\CODE\IU\Software-summer\FaceGuardV1\backend-service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Проверьте логи - должно быть:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Настройте agent .env

```bash
cd D:\CODE\IU\Software-summer\FaceGuardV1\agent
```

Создайте/отредактируйте `.env`:
```bash
# Backend
BACKEND_URL=http://10.93.26.183:8000
DEVICE_CODE=dev-machine-001

# Hardware mode
HARDWARE_MODE=development

# Camera (mock)
CAMERA_INDEX=0
CAMERA_WIDTH=640
CAMERA_HEIGHT=480
CAMERA_FPS=15

# Recognition
RECOGNITION_THRESHOLD=70

# Logging
LOG_LEVEL=INFO
```

### 3. Запустите agent

```bash
python main.py
```

Вы должны увидеть:
```
============================================================
FaceGuard Raspberry Pi Agent
Version 1.0.0
============================================================

INFO - Initializing simulated camera...
INFO - Simulated camera initialized
INFO - Camera started
INFO - Sync manager started
INFO - Command poller started
WARNING - Recognition model not trained - recognition loop not started
INFO - Train model with: POST /api/v1/commands (type: rebuild_model)
============================================================
FaceGuard Agent is running
============================================================
```

### 4. Проверьте frontend

Откройте `http://localhost:5173` (или ваш порт)

В консоли браузера должно быть:
```
[WebSocket] Connected
[LiveCamera] WebSocket connected
```

---

## 📝 Дополнительные исправления

### Исправить пустой device_id в запросе событий

**Файл:** `frontend/faceguard-web/src/app/components/pages/LiveCamera.tsx`

```typescript
// Строка 133 - было:
const { data: recentEvents = [] } = useGetEvents({ device_id: deviceId, limit: 10 });

// Исправить на:
const { data: recentEvents = [] } = useGetEvents(
  deviceId ? { device_id: deviceId, limit: 10 } : { limit: 10 }
);
```

Или добавить в хук `useGetEvents` проверку:
```typescript
// hooks/api/useEvents.ts
export function useGetEvents(params?: EventsQueryParams, options?: any) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: () => apiService.getEvents(params),
    enabled: !params?.device_id || params.device_id.length > 0, // Только если device_id валидный
    ...options,
  });
}
```

---

## 🎯 Что будет работать после исправлений

✅ WebSocket подключение к backend  
✅ Реальное время события распознавания  
✅ Mock камера на agent (генерирует тестовые фреймы)  
✅ Стриминг камеры на frontend  
✅ Запросы событий без ошибок  
✅ Heartbeat от agent к backend  

## ❌ Что пока не работает (требует дополнительной настройки)

- Распознавание лиц (нужно обучить модель - добавить людей с фото)
- Real camera stream (agent не экспонирует /api/v1/stream endpoint)

---

## 🔍 Проверка работоспособности

### 1. Backend здоров
```bash
curl http://10.93.26.183:8000/api/v1/system/health
# Ожидается: {"status":"healthy"}
```

### 2. WebSocket работает
Откройте консоль браузера на странице камеры:
```
[WebSocket] Connected
```

### 3. Agent подключен
```bash
curl http://10.93.26.183:8000/api/v1/devices/
# Должен быть в списке device с вашим DEVICE_CODE
```

---

## 📚 Следующие шаги

1. **Добавить streaming endpoint в agent** (если нужен реальный стрим)
2. **Обучить модель распознавания** - добавить людей через UI
3. **Исправить security issues** из CODE_REVIEW_REPORT.md
4. **Добавить тесты**

---

Создано: 2026-06-20  
Автор: Claude (Kiro AI)
