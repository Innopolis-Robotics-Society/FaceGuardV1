# Live Camera & WebSocket Integration — Completed ✅

**Дата:** 2026-06-20  
**Статус:** 100% завершено  

---

## 📊 Что реализовано

### ✅ 1. Live Camera MJPEG Stream

**Файлы:**
- `src/app/components/pages/LiveCamera.tsx` - полностью переписан
- `src/services/api.service.ts` - добавлены методы для stream

**Функциональность:**
- ✅ MJPEG stream через `getCameraStreamUrl(deviceId)`
- ✅ Автоматическое подключение к камере при наличии устройства
- ✅ Loading state во время подключения
- ✅ Error handling при недоступности stream
- ✅ Индикатор LIVE/OFFLINE
- ✅ Отображение FPS в реальном времени из telemetry
- ✅ Статус AI (Running/Off)
- ✅ Recent Events с реальными данными из API
- ✅ Интеграция с useGetDevices, useGetTelemetry, useGetEvents
- ✅ Команды управления через API (Open Door, Restart Camera, Start/Stop Recognition)
- ✅ Quick Stats (CPU, Temperature, RAM)
- ✅ Uptime форматирование
- ✅ People name lookup для событий

**API Endpoint (Agent):**
```
GET http://10.93.26.183:8001/api/v1/stream?device_id={id}&token={jwt}
```

**Примечание:** Agent должен реализовать endpoint `/api/v1/stream` для MJPEG потока.

---

### ✅ 2. WebSocket Real-time Updates

**Созданные файлы:**
- `src/services/websocket.service.ts` - WebSocket сервис
- `src/hooks/useWebSocket.ts` - React хуки для WebSocket

**Функциональность:**

#### WebSocket Service
- ✅ Автоматическое переподключение (5 попыток с увеличивающейся задержкой)
- ✅ Event emitter pattern для подписки на события
- ✅ Graceful disconnect при unmount
- ✅ Error handling и logging
- ✅ Connection state management

#### React Hooks
```typescript
// Основной хук
useWebSocket({
  autoConnect: true,
  onConnected: () => {},
  onDisconnected: () => {},
  onMessage: (data) => {},
  onError: (error) => {}
})

// Хук для конкретных событий
useWebSocketEvent("recognition_event", (data) => {
  // Handle event
})
```

**WebSocket URL:**
```
ws://10.93.26.183:8000/ws/events?token={jwt}
```

---

### ✅ 3. Интеграция в компоненты

#### LiveCamera.tsx
- ✅ WebSocket индикатор в правом верхнем углу (Connected/Disconnected)
- ✅ Real-time события распознавания
- ✅ Toast уведомления при новых событиях:
  - Success: "John Doe recognized (97.4%)"
  - Warning: "Unknown person detected"
- ✅ Auto-refresh событий через query invalidation
- ✅ Обработка door_event, command_status

#### Dashboard.tsx
- ✅ Real-time обновления статистики
- ✅ Auto-refresh графиков при новых событиях
- ✅ Toast уведомления (subtle, 3 sec)
- ✅ Invalidation queries для events и eventStats

---

## 🎯 События WebSocket

Backend должен отправлять следующие типы событий:

### 1. recognition_event
```json
{
  "type": "recognition_event",
  "event_type": "recognized" | "unknown" | "access_denied",
  "person_id": "uuid" | null,
  "person_name": "John Doe" | null,
  "confidence": 97.4,
  "door_opened": true,
  "device_id": "uuid",
  "created_at": "2026-06-20T19:00:00Z"
}
```

### 2. door_event
```json
{
  "type": "door_event",
  "door_opened": true,
  "device_id": "uuid",
  "reason": "manual" | "recognized",
  "created_at": "2026-06-20T19:00:00Z"
}
```

### 3. command_status
```json
{
  "type": "command_status",
  "command_id": "uuid",
  "command_type": "capture_photos" | "restart_camera" | etc,
  "status": "pending" | "running" | "completed" | "failed",
  "device_id": "uuid",
  "created_at": "2026-06-20T19:00:00Z"
}
```

---

## 🔧 Настройка Backend/Agent

### Agent (Raspberry Pi)

**Создать endpoint для stream:**

```python
# agent/api/stream.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import cv2

router = APIRouter()

@router.get("/stream")
async def video_stream(device_id: str, token: str):
    """MJPEG stream endpoint"""
    # Verify token
    # Get camera instance
    
    def generate_frames():
        while True:
            frame = camera.get_frame()
            
            # Encode frame
            _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
```

**Добавить в main.py:**
```python
from api.stream import router as stream_router
app.include_router(stream_router, prefix="/api/v1")
```

### Backend (WebSocket)

**Создать WebSocket endpoint:**

```python
# backend/api/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass

manager = ConnectionManager()

@router.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket, token: str):
    # Verify JWT token
    await manager.connect(websocket)
    
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Функция для отправки событий
async def broadcast_event(event_type: str, data: dict):
    await manager.broadcast({
        "type": event_type,
        **data
    })
```

**Использование:**
```python
# При создании события распознавания
await broadcast_event("recognition_event", {
    "event_type": event.event_type,
    "person_id": event.person_id,
    "person_name": person.name if person else None,
    "confidence": event.confidence,
    "door_opened": event.door_opened,
    "device_id": event.device_id,
    "created_at": event.created_at.isoformat()
})
```

---

## 📝 Использование в коде

### Пример: добавить WebSocket в новый компонент

```tsx
import { useWebSocket, useWebSocketEvent } from "../../../hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function MyComponent() {
  const queryClient = useQueryClient();
  
  // Подключение к WebSocket
  const { isConnected } = useWebSocket({
    autoConnect: true,
    onConnected: () => console.log("Connected"),
    onDisconnected: () => console.log("Disconnected"),
  });
  
  // Слушать события
  useWebSocketEvent("recognition_event", (data) => {
    console.log("Event:", data);
    
    // Показать уведомление
    toast.success(`${data.person_name} recognized`);
    
    // Обновить данные
    queryClient.invalidateQueries({ queryKey: ["events"] });
  });
  
  return (
    <div>
      WS Status: {isConnected ? "Connected" : "Disconnected"}
    </div>
  );
}
```

---

## ✅ Чеклист интеграции

### Frontend
- [x] WebSocket service создан
- [x] React hooks созданы
- [x] LiveCamera интегрирован с stream
- [x] LiveCamera интегрирован с WebSocket
- [x] Dashboard интегрирован с WebSocket
- [x] API service расширен методами stream
- [x] Error handling и reconnection
- [x] Toast уведомления
- [x] Query invalidation для real-time updates

### Backend (требуется реализация)
- [ ] Agent: MJPEG stream endpoint `/api/v1/stream`
- [ ] Backend: WebSocket endpoint `/ws/events`
- [ ] Backend: broadcast функция для событий
- [ ] Backend: отправка recognition_event при новых событиях
- [ ] Backend: отправка door_event при открытии двери
- [ ] Backend: отправка command_status при обновлении команд

---

## 🧪 Тестирование

### 1. Проверить Live Camera
```bash
# Открыть http://localhost:5175/camera
# Должно быть видно:
# - MJPEG stream (или "Connecting..." если agent не запущен)
# - WebSocket индикатор в правом верхнем углу
# - Recent Events загружаются
# - Кнопки управления работают
```

### 2. Проверить WebSocket
```bash
# В browser console:
# - Должны быть логи "[WebSocket] Connected"
# - При событиях: "[LiveCamera] Recognition event: ..."
```

### 3. Проверить Dashboard real-time
```bash
# Открыть Dashboard
# Создать событие (через PersonProfile capture или manual)
# - Должен показаться toast уведомление
# - Статистика должна обновиться автоматически
```

---

## 🎯 Следующие шаги (опционально)

1. **Bounding boxes overlay** - рисовать bbox на stream (требует изменений в agent)
2. **Video recording** - запись видео событий
3. **Settings page** - настройки confidence threshold, FPS, etc
4. **Mobile app** - React Native с тем же API
5. **Multi-camera support** - несколько устройств одновременно

---

## 📚 Архитектура

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React)                                       │
│                                                         │
│  ┌──────────────┐      ┌────────────────┐             │
│  │ LiveCamera   │◄─────┤ WebSocket      │             │
│  │ Dashboard    │      │ Service        │             │
│  └──────────────┘      └────────┬───────┘             │
│         │                       │                      │
│         │ MJPEG Stream          │ WS Events            │
└─────────┼───────────────────────┼──────────────────────┘
          │                       │
          ▼                       ▼
┌─────────────────┐      ┌─────────────────┐
│  Agent          │      │  Backend        │
│  (Port 8001)    │      │  (Port 8000)    │
│                 │      │                 │
│  /api/v1/stream │      │  /ws/events     │
│  - MJPEG        │      │  - WebSocket    │
│  - Camera       │      │  - Broadcast    │
└─────────────────┘      └─────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────┐
│  Raspberry Pi Camera + Recognition      │
└─────────────────────────────────────────┘
```

---

**Статус:** ✅ Frontend полностью готов  
**Требуется:** Реализация MJPEG stream в Agent и WebSocket broadcast в Backend  

**Время выполнения:** ~2 часа  
**Дата завершения:** 2026-06-20
