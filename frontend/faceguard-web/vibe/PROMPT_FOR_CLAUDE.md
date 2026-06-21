# Промт для доделывания интеграции FaceGuard API

**Проект:** FaceGuard React Frontend  
**Дата:** 2026-06-20  
**Статус:** 70% завершено  
**Время на выполнение:** ~40 минут  

---

## 📋 Контекст

Ты работаешь над React приложением для системы распознавания лиц на базе Raspberry Pi. Фронтенд на React 18 с TypeScript, использует Tailwind CSS, React Query для работы с API и Sonner для уведомлений.

**API базируется на:** `http://10.93.26.183:8000/api/v1`

Базовая инфраструктура уже реализована:
- ✅ API service с axios и автоматическим JWT
- ✅ TypeScript типы для всех сущностей
- ✅ React Query хуки для всех API endpoint'ов
- ✅ Dashboard с реальными данными
- ✅ People страница с CRUD операциями
- ⏳ Access Logs (нужна интеграция)
- ⏳ System (нужна интеграция)
- ⏳ PersonProfile (нужна интеграция)

---

## 🎯 Что нужно сделать

### Задача 1: Access Logs интеграция (~10 минут)

**Файл:** `src/app/components/pages/AccessLogs.tsx`

**Текущее состояние:**
- Используются моковые данные (`SAMPLE_LOGS`)
- Компонент имеет все UI элементы (таблица, фильтры, поиск, пагинация)
- Нужно подменить моки на реальные данные из API

**Что сделать:**

#### Шаг 1.1: Импортировать хуки
```tsx
import { useGetEvents, useGetEventStats, useCleanupEvents } from "../../../hooks/api/useEvents";
import { useGetPeople } from "../../../hooks/api/usePeople";
```

#### Шаг 1.2: Получить данные из API вместо состояния
Заменить:
```tsx
// Было:
const [logs, setLogs] = useState(SAMPLE_LOGS);
```

На:
```tsx
// Стало:
const { data: events, isLoading } = useGetEvents({ 
  days: 7, 
  limit: 100 
});

// Для маппинга имён людей в случае, если событие связано с person_id
const { data: people } = useGetPeople();
```

#### Шаг 1.3: Создать маппинг данных
Преобразовать `AccessEvent[]` в формат, совместимый с существующим UI:

```tsx
// Создать Map для быстрого поиска людей по ID
const peopleMap = useMemo(() => {
  const map = new Map();
  people?.forEach((p) => map.set(p.id, p));
  return map;
}, [people]);

// Преобразовать события в LogEntry
const logs = useMemo(() => {
  return (events || []).map((event) => ({
    id: parseInt(event.id.slice(-8), 16), // Последние 8 символов UUID как число
    name: event.person_id && peopleMap.has(event.person_id) 
      ? peopleMap.get(event.person_id).name 
      : "Unknown",
    initials: event.person_id && peopleMap.has(event.person_id)
      ? peopleMap.get(event.person_id).name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "?",
    color: event.event_type === "recognized" ? "#10b981" : "#f59e0b",
    date: event.created_at.split("T")[0],
    time: event.created_at.split("T")[1].slice(0, 8),
    confidence: event.confidence || 0,
    status: event.event_type === "recognized" ? "granted" : 
            event.event_type === "access_denied" ? "denied" : "unknown",
    action: event.door_opened ? "Door opened" : "Alert sent",
    doorOpened: event.door_opened,
  }));
}, [events, peopleMap]);
```

#### Шаг 1.4: Добавить фильтрацию через API
Для фильтра по статусу (`statusFilter`) добавить параметры при вызове `useGetEvents`:

```tsx
const { data: events, isLoading } = useGetEvents({ 
  days: 7,
  event_type: statusFilter === "all" ? undefined : 
              statusFilter === "granted" ? "recognized" : 
              statusFilter === "denied" ? "access_denied" : "unknown",
  limit: 100,
});
```

#### Шаг 1.5: Реализовать очистку логов
Заменить любую функцию `handleClearLogs` на использование mutation:

```tsx
const cleanupMutation = useCleanupEvents();

function handleClearLogs() {
  cleanupMutation.mutate(30, { // 30 дней
    onSuccess: () => {
      setShowClear(false);
      // Лог будет автоматически перезагружен благодаря query invalidation
    }
  });
}

// В кнопке:
<button 
  onClick={handleClearLogs}
  disabled={cleanupMutation.isPending}
>
  {cleanupMutation.isPending ? "Clearing..." : "Clear Logs"}
</button>
```

#### Шаг 1.6: Добавить Loading state
Заменить на реальный loading из API:

```tsx
{isLoading && (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
  </div>
)}
```

#### Шаг 1.7: Убрать mock данные
Удалить `SAMPLE_LOGS` и любые другие моковые данные.

---

### Задача 2: System телеметрия интеграция (~10 минут)

**Файл:** `src/app/components/pages/System.tsx`

**Текущее состояние:**
- Используются моковые метрики в `useState`
- Все UI элементы на месте
- Нужно подменить `useState` на реальные данные из API

**Что сделать:**

#### Шаг 2.1: Импортировать хуки
```tsx
import { useGetDevices } from "../../../hooks/api/useDevices";
import { useGetLatestTelemetry } from "../../../hooks/api/useTelemetry";
import { useSendRestartRecognition, useSendRestartCamera, useSendReboot } from "../../../hooks/api/useCommands";
```

#### Шаг 2.2: Получить данные устройства и телеметрии
Заменить:
```tsx
// Было:
const [cpu, setCpu] = useState(45);
const [ram, setRam] = useState(62);
// etc...
```

На:
```tsx
// Стало:
const { data: devices, isLoading: devicesLoading } = useGetDevices();
const device = devices?.[0]; // Берём первое устройство

const { data: telemetry, isLoading: telemetryLoading } = useGetLatestTelemetry(device?.id || "");

// Готовые данные:
const cpu = telemetry?.cpu_usage || 0;
const ram = telemetry?.ram_usage || 0;
const temp = telemetry?.cpu_temperature || 0;
const disk = telemetry?.disk_usage || 0;
const uptime = telemetry?.uptime || 0;
```

#### Шаг 2.3: Определить статусы сервисов
Добавить helper функцию:

```tsx
function getServiceStatus(lastSeen: string | null): "online" | "offline" | "warning" {
  if (!lastSeen) return "offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 30000) return "online";      // Менее 30 секунд
  if (diff < 120000) return "warning";    // Менее 2 минут
  return "offline";
}

// Использовать:
const piStatus = getServiceStatus(device?.last_seen_at || null);
const cameraStatus = device?.camera_status === "ok" ? "online" : "offline";
const recognitionStatus = device?.recognition_status === "running" ? "online" : "offline";
```

#### Шаг 2.4: Форматировать uptime
Добавить функцию:

```tsx
function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

// Использовать в UI:
<div>{formatUptime(uptime)}</div>
```

#### Шаг 2.5: Подключить команды управления
```tsx
const restartRecognition = useSendRestartRecognition();
const restartCamera = useSendRestartCamera();
const rebootDevice = useSendReboot();

function doAction(label: string) {
  if (!device) return;
  
  switch (label) {
    case "Restart Recognition Service":
      restartRecognition.mutate({ deviceId: device.id });
      break;
    case "Restart Camera":
      restartCamera.mutate({ deviceId: device.id });
      break;
    case "Reboot Raspberry Pi":
      rebootDevice.mutate({ deviceId: device.id, delay: 10 });
      break;
  }
  
  setConfirm(null);
}

// В кнопке:
<button 
  onClick={() => doAction(label)}
  disabled={restartRecognition.isPending || restartCamera.isPending || rebootDevice.isPending}
>
  {(restartRecognition.isPending || restartCamera.isPending || rebootDevice.isPending) 
    ? "Executing..." 
    : label}
</button>
```

#### Шаг 2.6: Loading states
```tsx
if (devicesLoading || telemetryLoading) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
    </div>
  );
}

if (!device) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-sm text-neutral-500">No devices found</p>
    </div>
  );
}
```

#### Шаг 2.7: Убрать моки
Удалить все `useState` для метрик и замочить данные.

---

### Задача 3: PersonProfile с фотографиями (~20 минут)

**Файл:** `src/app/components/pages/PersonProfile.tsx`

**Текущее состояние:**
- Используется mock `PEOPLE` объект
- Все UI компоненты готовы
- Нужно подменить моки на реальные данные из API
- Нужно подключить загрузку фото и управление ими

**Что сделать:**

#### Шаг 3.1: Импортировать хуки и утилиты
```tsx
import { useParams } from "react-router";
import { useGetPerson, useGetPersonPhotos, useDeletePhoto, useUploadPhotos, useUpdatePerson } from "../../../hooks/api/usePeople";
import { useSendCapturePhotos } from "../../../hooks/api/useCommands";
import { useGetDevices } from "../../../hooks/api/useDevices";
import { apiService } from "../../../services/api.service";
```

#### Шаг 3.2: Получить данные человека
```tsx
const { id } = useParams<{ id: string }>();
const { data: person, isLoading } = useGetPerson(id || "");
const { data: photos, isLoading: photosLoading } = useGetPersonPhotos(id || "");
const { data: devices } = useGetDevices();
```

#### Шаг 3.3: Убрать mock PEOPLE
Удалить:
```tsx
// Удалить это:
const person = PEOPLE.find(p => p.id === parseInt(personId));
```

#### Шаг 3.4: Маппинг данных человека
```tsx
// Используй реальные данные из person:
const personColor = person?.access_enabled ? "#10b981" : "#5a5a5a";
const personInitials = person?.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .toUpperCase() || "?";
```

#### Шаг 3.5: Отображение фотографий
Преобразовать `PersonPhoto[]` в формат компонентов:

```tsx
const photoCards = useMemo(() => {
  return (photos || []).map((photo) => ({
    id: parseInt(photo.id.slice(-8), 16),
    name: photo.original_path.split("/").pop() || "photo.jpg",
    isPrimary: photo.is_primary,
    date: photo.created_at.split("T")[0],
    photoId: photo.id, // Сохраняем UUID для API
  }));
}, [photos]);
```

#### Шаг 3.6: Отображение изображений
В компоненте, где отображаются фотографии (например, PhotoCard):

```tsx
// Для thumbnail:
<img
  src={apiService.getPhotoContentUrl(person.id, photo.photoId, "thumbnail")}
  alt={photo.name}
  className="w-full h-full object-cover"
  onError={(e) => {
    e.currentTarget.style.display = "none";
  }}
/>

// Для полноразмерного фото в модалке:
<img
  src={apiService.getPhotoContentUrl(person.id, photo.photoId, "original")}
  alt={photo.name}
  className="w-full h-full object-cover"
/>
```

#### Шаг 3.7: Загрузка фотографий
```tsx
const uploadMutation = useUploadPhotos();

// На input:
<input 
  type="file" 
  accept="image/*" 
  multiple
  className="hidden" 
  ref={fileInputRef}
  onChange={(e) => {
    if (e.target.files && person) {
      uploadMutation.mutate({
        personId: person.id,
        files: Array.from(e.target.files)
      });
    }
  }}
/>

// На кнопку "Upload":
<button 
  onClick={() => fileInputRef.current?.click()}
  disabled={uploadMutation.isPending}
>
  {uploadMutation.isPending ? "Uploading..." : "Upload Photos"}
</button>
```

#### Шаг 3.8: Удаление фотографий
```tsx
const deleteMutation = useDeletePhoto();

function handleDeletePhoto(photoId: string) {
  if (!person) return;
  
  deleteMutation.mutate({
    personId: person.id,
    photoId
  });
}

// На кнопке удаления:
<button 
  onClick={() => handleDeletePhoto(photo.photoId)}
  disabled={deleteMutation.isPending}
>
  Delete
</button>
```

#### Шаг 3.9: Capture фотографий через камеру
```tsx
const captureMutation = useSendCapturePhotos();

function handleCapture() {
  if (!person || !devices?.[0]) return;
  
  captureMutation.mutate({
    deviceId: devices[0].id,
    personId: person.id,
    count: 10, // Количество фото для захвата
  });
}

// На кнопке "Capture":
<button 
  onClick={handleCapture}
  disabled={captureMutation.isPending || !devices?.[0]}
>
  {captureMutation.isPending ? "Capturing..." : "Capture from Camera"}
</button>
```

#### Шаг 3.10: Обновление имени человека
Если есть функция редактирования имени:

```tsx
const updateMutation = useUpdatePerson();

function handleSaveName(newName: string) {
  if (!person) return;
  
  updateMutation.mutate({
    personId: person.id,
    data: { name: newName }
  }, {
    onSuccess: () => {
      setEditing(false);
    }
  });
}

// На кнопке сохранения:
<button 
  onClick={() => handleSaveName(name)}
  disabled={updateMutation.isPending}
>
  {updateMutation.isPending ? "Saving..." : "Save"}
</button>
```

#### Шаг 3.11: Убрать функции, которые API не поддерживает
**Удалить:**
- `RenameModal` компонент (если есть)
- Функция "Set as Primary" (API не поддерживает)
- Любые `renamePhoto` или `setP` handlers

**Оставить:**
- Upload photos
- Delete photo
- Capture from camera
- View photo
- Edit person name

#### Шаг 3.12: Loading states
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

---

## 🎨 Важные замечания по стилю кода

### Структура и импорты
Следи за такой структурой в каждом файле:
```tsx
// 1. React импорты
import { useState, useMemo, useRef } from "react";
import { useParams } from "react-router";

// 2. UI библиотеки (иконки, чарты и т.д.)
import { Users, ChevronRight } from "lucide-react";

// 3. Custom хуки API
import { useGetPerson, useGetPersonPhotos } from "../../../hooks/api/usePeople";

// 4. Утилиты и сервисы
import { apiService } from "../../../services/api.service";
import { format } from "date-fns";
```

### Использование React Query
```tsx
// ✅ ПРАВИЛЬНО:
const { data: person, isLoading } = useGetPerson(id);
const updateMutation = useUpdatePerson();

// ❌ НЕПРАВИЛЬНО:
const [person, setPerson] = useState();
useEffect(() => {
  fetchPerson();
}, []);
```

### Обработка ошибок и loading
Все запросы должны иметь proper loading/error handling:

```tsx
if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}

if (!data) {
  return <EmptyState />;
}

// Использовать данные
return <Component data={data} />;
```

### Toast уведомления
```tsx
// ✅ ПРАВИЛЬНО:
const mutation = useMutation({
  mutationFn: someFunc,
  onSuccess: () => {
    toast.success("Operation successful");
    queryClient.invalidateQueries({ queryKey: ["people"] });
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.detail || "Failed to perform operation");
  }
});

// ❌ НЕПРАВИЛЬНО:
const result = await fetch(...);
alert("Success"); // Не использовать alert
```

### Стиль компонентов
```tsx
// ✅ Используется Tailwind + inline styles для цветов
<div 
  className="rounded-2xl p-5"
  style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
>
  {children}
</div>

// ❌ Не используется только className для всего
<div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
```

### useMemo для оптимизации
```tsx
// ✅ Используй useMemo для дорогих операций:
const logs = useMemo(() => {
  return (events || []).map(event => ({
    // маппинг
  }));
}, [events]);

// Для создания Map'ов:
const peopleMap = useMemo(() => {
  const map = new Map();
  people?.forEach(p => map.set(p.id, p));
  return map;
}, [people]);
```

---

## 🧪 Как тестировать

### Access Logs
1. Открыть страницу `/access-logs` (или `/logs`)
2. Проверить, что события загружаются из API
3. Протестировать фильтры (granted/denied/unknown)
4. Попробовать очистить логи
5. Проверить что pagination работает

### System
1. Открыть страницу `/system`
2. Проверить статусы сервисов (online/offline/warning)
3. Проверить метрики (CPU, RAM, Temperature, Disk)
4. Попробовать команды (Restart Recognition, Restart Camera)
5. Проверить что метрики обновляются (auto-refresh каждые 5 сек)

### PersonProfile
1. Перейти на страницу People и открыть профиль
2. Проверить загрузку информации о человеке
3. Загрузить фотографии (Upload)
4. Проверить отображение фото
5. Попробовать удалить фото
6. Попробовать Capture from Camera
7. Изменить имя человека

---

## ⚠️ Потенциальные проблемы и их решения

### Проблема: Photos не загружаются
**Решение:** Проверить что `apiService.getPhotoContentUrl()` используется правильно:
```tsx
// Правильно:
apiService.getPhotoContentUrl(personId, photoId, "thumbnail")

// Результат должен быть что-то вроде:
// http://10.93.26.183:8000/api/v1/people/{id}/photos/{id}/content?type=thumbnail&token=...
```

### Проблема: Events не фильтруются правильно
**Решение:** Убедись что `event_type` параметр передаётся правильно:
```tsx
// ✅ Правильно:
event_type: statusFilter === "granted" ? "recognized" : undefined

// ❌ Неправильно:
event_type: statusFilter // Передаёшь 'granted' вместо 'recognized'
```

### Проблема: Telemetry показывает старые данные
**Решение:** Убедись что используешь правильный device ID:
```tsx
const { data: telemetry } = useGetLatestTelemetry(device?.id || "");
// Без device.id это не будет работать
```

### Проблема: 401 ошибка при запросах
**Решение:** JWT токен должен быть в localStorage. Проверить:
```tsx
// В браузере консоль:
localStorage.getItem("faceguard_token")
// Должна вернуть JWT токен
```

---

## 📋 Финальный чеклист

### Access Logs
- [ ] Импортированы useGetEvents, useGetEventStats, useCleanupEvents
- [ ] Заменены SAMPLE_LOGS на реальные данные
- [ ] Реализован маппинг AccessEvent → LogEntry
- [ ] Загружены имена людей для отображения
- [ ] Реализована фильтрация по event_type
- [ ] Реализована очистка логов
- [ ] Добавлены loading states
- [ ] Удалены все моковые данные
- [ ] Протестировано и работает

### System
- [ ] Импортированы useGetDevices, useGetLatestTelemetry, команды
- [ ] Загружаются реальные метрики
- [ ] Определены статусы сервисов
- [ ] Подключены команды управления (restart, reboot)
- [ ] Форматируется uptime
- [ ] Добавлены loading states
- [ ] Удалены все useState для метрик
- [ ] Протестировано и работает

### PersonProfile
- [ ] Импортированы все необходимые хуки
- [ ] Удалён mock PEOPLE
- [ ] Загружаются данные человека и фотографии
- [ ] Отображаются фотографии через apiService.getPhotoContentUrl()
- [ ] Реализована загрузка фотографий (Upload)
- [ ] Реализовано удаление фотографий
- [ ] Подключён Capture через команду
- [ ] Удалены функции rename и set primary
- [ ] Реализовано обновление имени
- [ ] Добавлены proper loading и error states
- [ ] Протестировано и работает

---

## 🚀 Порядок выполнения (рекомендуемый)

1. **Access Logs** (проще всего) — 10 мин
2. **System** (средней сложности) — 10 мин
3. **PersonProfile** (самый сложный) — 20 мин

**Общее время:** ~40 минут

---

## 📚 Справочные материалы

Всё что может понадобиться уже в проекте:

- **Типы API:** `src/types/api.types.ts` (200+ строк)
- **API сервис:** `src/services/api.service.ts` (350+ строк)
- **Пример хука:** `src/hooks/api/usePeople.ts`
- **Пример страницы:** `src/app/components/pages/Dashboard.tsx`
- **Документация:** `API_INTEGRATION_PLAN.md`, `INTEGRATION_PLAN.md`

---

## ✨ Дополнительные советы

1. **Используй browser DevTools** для отладки:
   - Network tab для просмотра API запросов
   - Storage tab для проверки токена
   - Console для ошибок

2. **Проверяй React Query DevTools** (если установлен)
   - Посмотри какие queries запущены
   - Посмотри кэш

3. **Используй стиль, который уже есть в Dashboard и People**
   - Не создавай новые компоненты
   - Переиспользуй существующие Sub-components
   - Сохраняй цветовую схему

4. **Тестируй на реальных данных**
   - Не полагайся на моки
   - Проверь с пустыми данными
   - Проверь с большим количеством данных

---

**Готов начинать? Просто скопируй каждую задачу и выполняй шаг за шагом! 🚀**
