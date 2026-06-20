# План интеграции API для FaceGuard Frontend

**Дата:** 2026-06-20  
**API URL:** http://10.93.26.183:8000/api/v1  
**Статус:** 70% выполнено (Dashboard, People работают с реальными данными)

---

## 📊 Текущий статус

### ✅ Завершено
- ✅ Базовая инфраструктура (API service, типы, React Query)
- ✅ Dashboard — полностью интегрирован
- ✅ People — CRUD операции работают
- ✅ Хуки: usePeople, useEvents, useDevices, useTelemetry, useCommands

### ⏳ Осталось выполнить (3 задачи, ~40 минут)

1. **Access Logs интеграция** (~10 мин)
2. **System telemetry интеграция** (~10 мин)
3. **PersonProfile с фотографиями** (~20 мин)

---

## 🎯 Задача 1: Access Logs интеграция (~10 мин)

### Файл: `src/app/components/pages/AccessLogs.tsx`

### Что сделать:

#### 1.1 Заменить моковые данные на API
```tsx
// Было:
const [logs, setLogs] = useState(SAMPLE_LOGS);

// Станет:
import { useGetEvents, useCleanupEvents } from "../../../hooks/api/useEvents";

const { data: events, isLoading } = useGetEvents({ 
  days: 7, 
  limit: 100 
});
```

#### 1.2 Маппинг данных из API
```tsx
// Преобразовать AccessEvent[] в LogEntry[]
const logs: LogEntry[] = (events || []).map((event) => ({
  id: parseInt(event.id.slice(-8), 16), // Взять последние 8 символов UUID как число
  name: event.person_id ? "Loading..." : "Unknown", // Загрузить имя отдельно
  initials: "?",
  color: event.event_type === "recognized" ? "#10b981" : "#f59e0b",
  date: event.created_at.split("T")[0],
  time: event.created_at.split("T")[1].slice(0, 8),
  confidence: event.confidence || 0,
  status: event.event_type === "recognized" ? "granted" : 
          event.event_type === "access_denied" ? "denied" : "unknown",
  action: event.door_opened ? "Door opened" : "Alert sent",
  doorOpened: event.door_opened,
}));
```

#### 1.3 Добавить загрузку имён людей
```tsx
import { useGetPeople } from "../../../hooks/api/usePeople";

const { data: people } = useGetPeople();

// Создать Map для быстрого поиска
const peopleMap = useMemo(() => {
  const map = new Map();
  people?.forEach((p) => map.set(p.id, p));
  return map;
}, [people]);

// В маппинге:
name: event.person_id && peopleMap.has(event.person_id) 
  ? peopleMap.get(event.person_id).name 
  : "Unknown",
```

#### 1.4 Фильтрация через API
```tsx
// Для фильтра по статусу использовать event_type
const { data: events } = useGetEvents({
  days: 7,
  event_type: statusFilter === "all" ? undefined : 
              statusFilter === "granted" ? "recognized" : 
              statusFilter === "denied" ? "access_denied" : "unknown",
  limit: 100,
});
```

#### 1.5 Очистка логов
```tsx
const cleanupMutation = useCleanupEvents();

function handleClearLogs() {
  cleanupMutation.mutate(30, {
    onSuccess: () => {
      setShowClear(false);
    }
  });
}
```

#### 1.6 Loading states
```tsx
{isLoading && (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
  </div>
)}
```

### Время: ~10 минут

---

## 🎯 Задача 2: System telemetry интеграция (~10 мин)

### Файл: `src/app/components/pages/System.tsx`

### Что сделать:

#### 2.1 Получить список устройств
```tsx
import { useGetDevices } from "../../../hooks/api/useDevices";
import { useGetLatestTelemetry } from "../../../hooks/api/useTelemetry";

const { data: devices } = useGetDevices();
const device = devices?.[0]; // Берём первое устройство
```

#### 2.2 Загрузить телеметрию
```tsx
const { data: telemetry } = useGetLatestTelemetry(device?.id || "");
```

#### 2.3 Маппинг метрик
```tsx
// Заменить useState на реальные данные из API:
const cpu = telemetry?.cpu_usage || 0;
const ram = telemetry?.ram_usage || 0;
const temp = telemetry?.cpu_temperature || 0;
const disk = telemetry?.disk_usage || 0;
const uptime = telemetry?.uptime || 0;
```

#### 2.4 Статус сервисов
```tsx
// Определить статус на основе last_seen_at
function getServiceStatus(lastSeen: string | null): "online" | "offline" | "warning" {
  if (!lastSeen) return "offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 30000) return "online"; // Менее 30 секунд
  if (diff < 120000) return "warning"; // Менее 2 минут
  return "offline";
}

const piStatus = getServiceStatus(device?.last_seen_at || null);
const cameraStatus = device?.camera_status === "ok" ? "online" : "offline";
const recognitionStatus = device?.recognition_status === "running" ? "online" : "offline";
```

#### 2.5 Форматирование uptime
```tsx
function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
```

#### 2.6 Команды управления
```tsx
import { useSendRestartRecognition, useSendRestartCamera, useSendReboot } from "../../../hooks/api/useCommands";

const restartRecognition = useSendRestartRecognition();
const restartCamera = useSendRestartCamera();
const rebootDevice = useSendReboot();

function doAction(label: string) {
  if (!device) return;
  
  if (label === "Restart Recognition Service") {
    restartRecognition.mutate({ deviceId: device.id });
  } else if (label === "Restart Camera") {
    restartCamera.mutate({ deviceId: device.id });
  } else if (label === "Reboot Raspberry Pi") {
    rebootDevice.mutate({ deviceId: device.id, delay: 10 });
  }
  
  setConfirm(null);
}
```

#### 2.7 Loading состояния
```tsx
if (!device) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm text-neutral-500">No devices found</p>
    </div>
  );
}
```

### Время: ~10 минут

---

## 🎯 Задача 3: PersonProfile с фотографиями (~20 мин)

### Файл: `src/app/components/pages/PersonProfile.tsx`

### Что сделать:

#### 3.1 Загрузить данные человека
```tsx
import { useGetPerson, useGetPersonPhotos, useDeletePhoto, useUploadPhotos } from "../../../hooks/api/usePeople";
import { useSendCapturePhotos } from "../../../hooks/api/useCommands";

const { id } = useParams<{ id: string }>();
const { data: person, isLoading } = useGetPerson(id || "");
const { data: photos, isLoading: photosLoading } = useGetPersonPhotos(id || "");
```

#### 3.2 Маппинг данных человека
```tsx
// Удалить PEOPLE mock

const personColor = person?.access_enabled ? "#10b981" : "#5a5a5a";
const personInitials = person?.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase() || "?";
```

#### 3.3 Отображение фотографий
```tsx
// Преобразовать PersonPhoto[] в формат для PhotoCard
const photoCards = (photos || []).map((photo) => ({
  id: parseInt(photo.id.slice(-8), 16),
  name: photo.original_path.split("/").pop() || "photo.jpg",
  isPrimary: photo.is_primary,
  date: photo.created_at.split("T")[0],
  photoId: photo.id, // Сохраняем UUID для API
}));
```

#### 3.4 Отображение изображений
```tsx
import { apiService } from "../../../services/api.service";

// В PhotoCard компоненте:
<div className="aspect-square flex items-center justify-center relative"
  style={{ background: `${color}08` }}>
  <img
    src={apiService.getPhotoContentUrl(personId, photo.photoId, "thumbnail")}
    alt={photo.name}
    className="w-full h-full object-cover"
    onError={(e) => {
      // Fallback если изображение не загрузилось
      e.currentTarget.style.display = "none";
    }}
  />
  {/* ... остальное */}
</div>
```

#### 3.5 Полноразмерное фото в модалке
```tsx
// В ViewModal:
<img
  src={apiService.getPhotoContentUrl(personId, photo.photoId, "original")}
  alt={photo.name}
  className="w-full h-full object-cover"
/>
```

#### 3.6 Загрузка фотографий
```tsx
const uploadMutation = useUploadPhotos();

function handleUpload(files: FileList | null) {
  if (!files || !person) return;
  
  const fileArray = Array.from(files);
  uploadMutation.mutate({ 
    personId: person.id, 
    files: fileArray 
  });
}

// В JSX:
<input 
  type="file" 
  accept="image/*" 
  multiple
  className="hidden" 
  onChange={(e) => handleUpload(e.target.files)} 
/>
```

#### 3.7 Удаление фото
```tsx
const deleteMutation = useDeletePhoto();

function handleDeletePhoto(photoId: string) {
  if (!person) return;
  
  deleteMutation.mutate({ 
    personId: person.id, 
    photoId 
  });
}
```

#### 3.8 Capture через камеру
```tsx
const captureMutation = useSendCapturePhotos();
const { data: devices } = useGetDevices();

function handleCapture() {
  if (!person || !devices?.[0]) return;
  
  captureMutation.mutate({
    deviceId: devices[0].id,
    personId: person.id,
    count: 10,
  });
}
```

#### 3.9 Убрать функцию Rename (не поддерживается API)
```tsx
// Удалить:
// - RenameModal компонент
// - renamePhoto state
// - onRename handler
```

#### 3.10 Убрать функцию Set Primary (не поддерживается API)
```tsx
// Удалить:
// - setP функцию
// - onSetPrimary handler
```

#### 3.11 Loading states
```tsx
if (isLoading) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
    </div>
  );
}

if (!person) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm text-neutral-500">Person not found</p>
    </div>
  );
}
```

#### 3.12 Обновление имени
```tsx
import { useUpdatePerson } from "../../../hooks/api/usePeople";

const updateMutation = useUpdatePerson();

function handleSaveName() {
  if (!person) return;
  
  updateMutation.mutate({
    personId: person.id,
    data: { name },
  }, {
    onSuccess: () => {
      setEditing(false);
    }
  });
}
```

### Время: ~20 минут

---

## 📝 Итоговый чеклист

### Задача 1: Access Logs
- [ ] Импортировать useGetEvents, useCleanupEvents
- [ ] Заменить SAMPLE_LOGS на реальные данные
- [ ] Добавить маппинг AccessEvent → LogEntry
- [ ] Загрузить людей для отображения имён
- [ ] Подключить фильтрацию по event_type
- [ ] Реализовать очистку через cleanupEvents
- [ ] Добавить loading states
- [ ] Протестировать фильтры и pagination

### Задача 2: System
- [ ] Импортировать useGetDevices, useGetLatestTelemetry
- [ ] Загрузить первое устройство
- [ ] Отобразить реальные метрики из telemetry
- [ ] Определить статусы сервисов
- [ ] Подключить команды управления
- [ ] Форматировать uptime
- [ ] Добавить loading states
- [ ] Протестировать команды

### Задача 3: PersonProfile
- [ ] Импортировать useGetPerson, useGetPersonPhotos
- [ ] Удалить mock PEOPLE
- [ ] Загрузить данные человека и фотографии
- [ ] Отобразить фото через apiService.getPhotoContentUrl()
- [ ] Реализовать загрузку фотографий
- [ ] Реализовать удаление фотографий
- [ ] Подключить capture через команду
- [ ] Удалить функции rename и set primary
- [ ] Реализовать обновление имени
- [ ] Добавить loading и error states
- [ ] Протестировать все операции

---

## 🚀 Порядок выполнения

**Рекомендуемая последовательность:**

1. **Access Logs** (проще всего) — 10 мин
2. **System** (средней сложности) — 10 мин  
3. **PersonProfile** (самый сложный) — 20 мин

**Общее время:** ~40 минут

---

## ⚠️ Важные замечания

### API Base URL
Убедись, что в `api.service.ts` указан правильный URL:
```typescript
const API_BASE_URL = "http://10.93.26.183:8000/api/v1";
```

### JWT токен
Все запросы автоматически получают токен через interceptor. При 401 ошибке происходит редирект на /login.

### Фотографии
Для загрузки фото используется `getPhotoContentUrl()` который добавляет токен в query параметр:
```typescript
getPhotoContentUrl(personId, photoId, "thumbnail")
// → http://10.93.26.183:8000/api/v1/people/{id}/photos/{id}/content?type=thumbnail&token=...
```

### Auto-refresh
- Events: обновляются каждые 10 секунд
- Telemetry: обновляется каждые 5 секунд
- Можно отключить через `refetchInterval: false`

### Error handling
Все ошибки показываются через toast уведомления (sonner).

---

## 🧪 Тестирование после интеграции

### Access Logs
1. Открыть страницу /access-logs
2. Проверить загрузку событий
3. Протестировать фильтры (granted/denied/unknown)
4. Протестировать поиск по имени
5. Протестировать date range фильтры
6. Проверить pagination
7. Открыть detail modal
8. Попробовать очистку логов

### System
1. Открыть страницу /system
2. Проверить статусы сервисов
3. Проверить отображение метрик
4. Проверить auto-refresh (метрики меняются каждые 5 сек)
5. Попробовать команды (restart recognition, restart camera)
6. Проверить логи (если доступны)

### PersonProfile
1. Создать тестового человека в People
2. Открыть его профиль
3. Загрузить несколько фотографий (Upload)
4. Проверить отображение thumbnails
5. Открыть фото в full size (View)
6. Удалить фото
7. Попробовать Capture (если есть устройство)
8. Изменить имя человека
9. Проверить счётчик фотографий

---

## 📚 Справочные материалы

- **Backend API:** `backend-service/API_DOCUMENTATION.md`
- **Agent docs:** `agent/README.md`
- **Существующие хуки:** `src/hooks/api/`
- **API types:** `src/types/api.types.ts`
- **API service:** `src/services/api.service.ts`

---

**Готов к выполнению?** Дай подтверждение и я начну интеграцию по этому плану!
