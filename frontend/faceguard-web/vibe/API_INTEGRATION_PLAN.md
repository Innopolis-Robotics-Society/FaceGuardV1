# План интеграции API и Live Camera для FaceGuard

## 📋 Общий план

### Цель
Интегрировать все endpoints backend API (`http://10.93.26.183:8000/api/v1`) с существующими страницами React и реализовать вывод live камеры с Raspberry Pi.

---

## 🎯 Этап 1: API Integration Infrastructure (Базовая инфраструктура)

### 1.1 Расширить API Service
**Файл:** `src/services/api.service.ts`

Добавить методы для всех endpoints:
- **People API**: `getPeople()`, `createPerson()`, `updatePerson()`, `deletePerson()`
- **Photos API**: `uploadPhotos()`, `getPersonPhotos()`, `getPhotoContent()`, `deletePhoto()`
- **Events API**: `getEvents()`, `getEventStats()`, `deleteEvent()`
- **Devices API**: `getDevices()`, `createDevice()`, `updateDevice()`, `sendHeartbeat()`
- **Commands API**: `sendCommand()`, `getCommands()`, `updateCommandStatus()`
- **Telemetry API**: `getTelemetry()`, `getLatestTelemetry()`, `getTelemetryStats()`
- **System API**: `getSystemHealth()`, `getSystemReadiness()`

### 1.2 Создать типы для API
**Файл:** `src/types/api.types.ts`

Определить интерфейсы для:
- Person, PersonCreate, PersonUpdate
- Photo, PhotoUpload
- Device, DeviceCreate, DeviceHeartbeat
- Event, EventCreate, EventStats
- Command, CommandCreate, CommandUpdate
- Telemetry, TelemetryStats

### 1.3 Создать React Query / SWR хуки
**Папка:** `src/hooks/api/`

Создать хуки для работы с данными:
- `usePeople.ts` - useGetPeople, useCreatePerson, useUpdatePerson, useDeletePerson
- `useEvents.ts` - useGetEvents, useEventStats
- `useDevices.ts` - useGetDevices, useDeviceHeartbeat
- `useTelemetry.ts` - useGetTelemetry, useLatestTelemetry
- `useCommands.ts` - useSendCommand, useGetCommands

---

## 🎯 Этап 2: Интеграция страницы Dashboard

### 2.1 Подключить реальные данные
**Файл:** `src/app/components/pages/Dashboard.tsx`

**Заменить моковые данные на:**
- Статистика людей → `GET /api/v1/people/`
- События сегодня → `GET /api/v1/events/?days=1`
- Последнее событие → `GET /api/v1/events/?limit=1`
- Unknown attempts → `GET /api/v1/events/?event_type=unknown&days=1`
- Статус системы → `GET /api/v1/system/health`
- Активность за 7 дней → `GET /api/v1/events/stats/summary?days=7`
- Почасовая активность → группировка событий по часам

**Добавить:**
- Автообновление каждые 10 секунд для "Today's Activity"
- Loading states для всех виджетов
- Error handling с toast уведомлениями

---

## 🎯 Этап 3: Интеграция страницы People

### 3.1 CRUD операции
**Файл:** `src/app/components/pages/People.tsx`

**Заменить:**
- Список людей → `GET /api/v1/people/?skip=0&limit=100`
- Создание → `POST /api/v1/people/`
- Обновление → `PATCH /api/v1/people/{id}`
- Удаление → `DELETE /api/v1/people/{id}`

**Добавить:**
- Поиск → фильтрация через query `?search=`
- Фильтр по статусу → `?access_enabled_only=true`
- Pagination → `?skip=` и `?limit=`
- Отображение реального количества фотографий из `photo_count`

### 3.2 Модальное окно добавления
**Улучшить:**
- Upload фото → `POST /api/v1/people/{person_id}/photos` (multipart/form-data)
- Capture через камеру → отправка команды `capture_photos` через Commands API

---

## 🎯 Этап 4: Интеграция страницы PersonProfile

### 4.1 Детальная информация
**Файл:** `src/app/components/pages/PersonProfile.tsx`

**Реализовать:**
- Загрузка данных → `GET /api/v1/people/{id}`
- Список фотографий → `GET /api/v1/people/{person_id}/photos`
- Отображение фото → `GET /api/v1/people/{person_id}/photos/{photo_id}/content?type=thumbnail`
- Полноразмерное фото → `?type=original`
- Удаление фото → `DELETE /api/v1/people/{person_id}/photos/{id}`

**Добавить:**
- Статистика распознаваний для этого человека → `GET /api/v1/events/?person_id={id}`
- Последние события → таблица с датами распознаваний
- Кнопка "Capture More Photos" → Commands API

---

## 🎯 Этап 5: Интеграция страницы Access Logs

### 5.1 События распознавания
**Файл:** `src/app/components/pages/AccessLogs.tsx`

**Заменить:**
- Список событий → `GET /api/v1/events/?days=7&limit=100`
- Фильтр по типу → `?event_type=recognized/unknown/access_denied`
- Фильтр по датам → `?days=N`
- Экспорт CSV → локальная генерация из полученных данных
- Очистка логов → `DELETE /api/v1/events/cleanup?min_days=30`

**Добавить:**
- Загрузка фото события (если есть) из `photo_path`
- Детальная модалка с полной информацией
- Pagination с server-side

---

## 🎯 Этап 6: Интеграция страницы System

### 6.1 Реальная телеметрия
**Файл:** `src/app/components/pages/System.tsx`

**Заменить:**
- Статус сервисов → `GET /api/v1/devices/` (проверка `last_seen_at`)
- Метрики → `GET /api/v1/telemetry/devices/{device_id}/latest`
  - CPU usage
  - RAM usage
  - CPU temperature
  - Disk usage
  - Uptime
  - Camera FPS

**Добавить:**
- Автообновление метрик каждые 5 секунд
- System logs → чтение через WebSocket (если доступно) или polling
- Кнопки управления → отправка команд через Commands API:
  - `restart_recognition`
  - `restart_camera`
  - `restart_agent`
  - `reboot_device`

---

## 🎯 Этап 7: Live Camera Integration ⭐ ГЛАВНОЕ

### 7.1 Архитектура видео потока

**Raspberry Pi Agent** передаёт видео одним из способов:

#### Вариант A: MJPEG Stream (рекомендуемый для начала)
Agent создаёт HTTP endpoint `/stream` который отдаёт MJPEG поток:
```python
# В agent добавить новый endpoint (camera_stream.py)
@app.get("/stream")
async def video_stream():
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

def generate_frames():
    while True:
        frame = camera.get_frame()
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
```

**Frontend:**
```tsx
// В LiveCamera.tsx
<img 
  src="http://10.93.26.183:8001/stream" 
  alt="Live camera feed"
  className="w-full h-full object-cover"
/>
```

#### Вариант B: WebRTC (более сложный, но лучше)
- Используем библиотеку `aiortc` на Pi
- Frontend использует `react-player` или нативный WebRTC

#### Вариант C: HLS (для продакшена)
- Agent пишет HLS chunks (ffmpeg)
- Frontend использует `hls.js` или `react-player`

### 7.2 Обновить LiveCamera.tsx
**Файл:** `src/app/components/pages/LiveCamera.tsx`

**Интегрировать:**
- Видео поток с Pi
- Overlay с bounding boxes (получать через WebSocket или polling)
- Реальные события распознавания → `GET /api/v1/events/?device_id={id}&limit=10`
- Статистика → `GET /api/v1/telemetry/devices/{device_id}/latest`

**Добавить WebSocket для real-time:**
```tsx
const ws = useRef<WebSocket | null>(null);

useEffect(() => {
  ws.current = new WebSocket('ws://10.93.26.183:8000/ws/events');
  
  ws.current.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'recognition_event') {
      // Обновить список событий
      // Показать notification
    }
  };
  
  return () => ws.current?.close();
}, []);
```

**Кнопки управления:**
- Capture Photo → `POST /api/v1/commands/` с `command_type: "capture_photos"`
- Open Door → `POST /api/v1/commands/devices/{id}/open-door`
- Restart Camera → `POST /api/v1/commands/` с `command_type: "restart_camera"`
- Stop/Start Recognition → `POST /api/v1/commands/` с `command_type: "restart_recognition"`

---

## 🎯 Этап 8: Real-time Updates (WebSocket)

### 8.1 Создать WebSocket сервис
**Файл:** `src/services/websocket.service.ts`

```typescript
class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  
  connect(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = this.handleMessage.bind(this);
  }
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  // ...
}
```

### 8.2 Подключить к компонентам
- Dashboard → новые события в real-time
- LiveCamera → обновление recognition events
- AccessLogs → добавление новых записей

---

## 🎯 Этап 9: Обработка ошибок и Loading States

### 9.1 Глобальный error handler
**Файл:** `src/utils/errorHandler.ts`

```typescript
export function handleApiError(error: any) {
  if (error.response?.status === 404) {
    toast.error("Resource not found");
  } else if (error.response?.status === 500) {
    toast.error("Server error");
  } else if (error.message === "Network Error") {
    toast.error("Cannot connect to server");
  } else {
    toast.error(error.response?.data?.detail || "An error occurred");
  }
}
```

### 9.2 Loading компоненты
**Файл:** `src/components/common/LoadingStates.tsx`

- Skeleton для таблиц
- Spinner для кнопок
- Shimmer для карточек

---

## 🎯 Этап 10: Settings Page (новая страница)

### 10.1 Настройки распознавания
**Создать:** `src/app/components/pages/Settings.tsx`

**Разделы:**
- **Recognition Settings**
  - Confidence threshold slider
  - Min face size
  - Action cooldown
  
- **Camera Settings**
  - Resolution
  - FPS
  - Brightness/Contrast
  
- **Door Settings**
  - Open duration
  - Auto-close enabled
  
- **Notification Settings**
  - Email alerts
  - Webhook URL
  
- **System Settings**
  - Backup schedule
  - Log retention days

---

## 📦 Необходимые зависимости

### Установить:
```bash
npm install @tanstack/react-query  # Для data fetching
npm install socket.io-client       # Для WebSocket
npm install react-player           # Для видео (опционально)
npm install date-fns               # Уже установлено
```

---

## 🔄 Порядок реализации

### Приоритет 1 (Core):
1. ✅ API Service расширение
2. ✅ Типы для API
3. ✅ React Query setup
4. ✅ Dashboard интеграция
5. ✅ People CRUD

### Приоритет 2 (Important):
6. ✅ Access Logs интеграция
7. ✅ System monitoring
8. ⭐ **Live Camera stream**
9. ✅ Commands API integration

### Приоритет 3 (Nice to have):
10. ✅ WebSocket real-time
11. ✅ Settings page
12. ✅ Error handling improvements
13. ✅ Loading states

---

## 🎥 Live Camera Stream — Детальный план

### Backend (Agent) изменения

**Создать новый файл:** `agent/api/stream.py`

```python
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import cv2

router = APIRouter()

@router.get("/stream")
async def video_stream():
    """MJPEG stream endpoint"""
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

def generate_frames():
    from camera.camera_service import camera_service
    
    while True:
        frame = camera_service.get_frame()
        
        # Рисуем bounding boxes если есть активное распознавание
        if recognition_loop.last_result:
            bbox = recognition_loop.last_result['face_bbox']
            cv2.rectangle(
                frame,
                (bbox['x'], bbox['y']),
                (bbox['x'] + bbox['w'], bbox['y'] + bbox['h']),
                (16, 185, 129) if recognition_loop.last_result['recognized'] else (245, 158, 11),
                2
            )
            
            # Добавляем текст с именем/confidence
            text = f"{recognition_loop.last_result.get('name', 'Unknown')} {recognition_loop.last_result['confidence']:.1f}%"
            cv2.putText(frame, text, (bbox['x'], bbox['y'] - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        # Энкодим в JPEG
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
```

**Добавить в main.py:**
```python
from api.stream import router as stream_router
app.include_router(stream_router, prefix="/api/v1")
```

### Frontend реализация

**Обновить LiveCamera.tsx:**

```tsx
import { useState, useEffect, useRef } from "react";

export function LiveCamera() {
  const [streamUrl, setStreamUrl] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    // Получаем device_id из API
    const loadDevice = async () => {
      const devices = await apiService.getDevices();
      if (devices.length > 0) {
        // Предполагаем что agent запущен на том же хосте что и backend
        // но на порту 8001 (или настраиваемый)
        const agentUrl = "http://10.93.26.183:8001";
        setStreamUrl(`${agentUrl}/api/v1/stream`);
      }
    };
    
    loadDevice();
  }, []);
  
  useEffect(() => {
    if (streamUrl && imgRef.current) {
      imgRef.current.onload = () => setConnected(true);
      imgRef.current.onerror = () => setConnected(false);
    }
  }, [streamUrl]);
  
  return (
    <div className="relative">
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p>Connecting to camera...</p>
        </div>
      )}
      
      {streamUrl && (
        <img
          ref={imgRef}
          src={streamUrl}
          alt="Live camera feed"
          className="w-full h-full object-cover"
          style={{ display: connected ? 'block' : 'none' }}
        />
      )}
    </div>
  );
}
```

---

## ⚠️ Важные моменты

### Безопасность:
- Все API запросы должны включать JWT токен
- Stream endpoint тоже должен проверять токен (query parameter или header)
- CORS настроен правильно на backend

### Производительность:
- Кэширование данных через React Query (staleTime, cacheTime)
- Debounce для поиска
- Virtual scrolling для длинных списков
- Lazy loading изображений

### UX:
- Optimistic updates для быстрых операций
- Skeleton loaders везде
- Toast notifications для всех действий
- Подтверждающие модалки для деструктивных действий

---

## 🧪 Тестирование

### Что проверить:
1. Авторизация работает с backend
2. Все CRUD операции выполняются
3. Pagination работает корректно
4. Фильтры применяются
5. Поиск работает
6. Загрузка файлов проходит
7. Команды отправляются и выполняются
8. Live stream подключается
9. Real-time updates приходят
10. Error handling отображается корректно

---

**Готов начинать реализацию?** 
Скажи с чего начать, и я приступлю к написанию кода!
