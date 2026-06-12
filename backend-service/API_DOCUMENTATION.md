# FaceGuard Backend API - Полная документация

## 📋 Общая информация

**Версия:** 0.1.0  
**База данных:** PostgreSQL 16  
**Python:** 3.11  
**Framework:** FastAPI  

## 🚀 Запуск

```bash
cd backend-sevice
docker-compose up -d
```

**API:** http://localhost:8000  
**Swagger:** http://localhost:8000/docs  
**Readiness:** http://localhost:8000/api/v1/system/readiness

---

## 🔐 Authentication (JWT)

### Регистрация и вход

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "password123",
  "role": "admin"  // admin или superadmin
}
```

**Первый пользователь автоматически становится superadmin.**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### Использование токена

Все защищенные endpoints требуют заголовок:
```
Authorization: Bearer <access_token>
```

### Endpoints

- `POST /api/v1/auth/register` - Регистрация
- `POST /api/v1/auth/login` - Вход
- `GET /api/v1/auth/me` - Текущий пользователь (требует auth)
- `GET /api/v1/auth/users` - Список пользователей (superadmin)
- `DELETE /api/v1/auth/users/{id}` - Удалить пользователя (superadmin)

---

## 👥 People API (Управление людьми)

### Список людей с фильтрацией

```http
GET /api/v1/people/?skip=0&limit=100&search=John&access_enabled_only=true
```

### Создать человека

```http
POST /api/v1/people/
Content-Type: application/json

{
  "name": "John Doe",
  "description": "Main resident",
  "access_enabled": true
}
```

**Автоматически создаются папки:**
- `data/faces/{person_id}/original/`
- `data/faces/{person_id}/processed/`

### Обновить человека

```http
PATCH /api/v1/people/{person_id}
Content-Type: application/json

{
  "name": "John Smith",
  "access_enabled": false
}
```

### Удалить (soft delete)

```http
DELETE /api/v1/people/{person_id}?permanent=false
```

**Endpoints:**
- `GET /api/v1/people/` - Список
- `GET /api/v1/people/{id}` - Детали
- `POST /api/v1/people/` - Создать
- `PATCH /api/v1/people/{id}` - Обновить
- `DELETE /api/v1/people/{id}` - Удалить

---

## 📸 Photos API (Фотографии)

### Загрузить фотографии (множественная загрузка)

```http
POST /api/v1/people/{person_id}/photos
Content-Type: multipart/form-data

files: [file1.jpg, file2.jpg, file3.jpg, ...]
```

**Поддержка форматов:** JPG, PNG, BMP  
**Для каждого фото:**
- Сохраняется оригинал
- Создается thumbnail
- Вычисляется hash
- Определяются размеры

### Получить список фото

```http
GET /api/v1/people/{person_id}/photos
```

### Получить файл фото

```http
GET /api/v1/people/{person_id}/photos/{photo_id}/content?type=original
```

**Параметр type:**
- `original` - оригинальное фото
- `thumbnail` - миниатюра
- `processed` - обработанное лицо (после OpenCV)

**Endpoints:**
- `POST /api/v1/people/{person_id}/photos` - Загрузить (множественная)
- `GET /api/v1/people/{person_id}/photos` - Список
- `GET /api/v1/people/{person_id}/photos/{id}` - Детали
- `GET /api/v1/people/{person_id}/photos/{id}/content` - Файл
- `DELETE /api/v1/people/{person_id}/photos/{id}` - Удалить

---

## 🖥️ Devices API (Raspberry Pi)

### Зарегистрировать устройство

```http
POST /api/v1/devices/
Content-Type: application/json

{
  "name": "Main Door Pi",
  "device_code": "rpi-main-001"
}
```

### Heartbeat от устройства (каждые 5-10 сек)

```http
POST /api/v1/devices/{device_id}/heartbeat
Content-Type: application/json

{
  "ip_address": "192.168.1.100",
  "software_version": "1.0.0",
  "camera_status": "ok",
  "recognition_status": "running"
}
```

Обновляет:
- `status` → "online"
- `last_seen_at` → now
- Все переданные поля

### Heartbeat по device_code

```http
POST /api/v1/devices/by-code/{device_code}/heartbeat
```

**Endpoints:**
- `GET /api/v1/devices/` - Список
- `GET /api/v1/devices/{id}` - Детали
- `POST /api/v1/devices/` - Создать
- `PATCH /api/v1/devices/{id}` - Обновить
- `DELETE /api/v1/devices/{id}` - Удалить
- `POST /api/v1/devices/{id}/heartbeat` - Heartbeat
- `POST /api/v1/devices/by-code/{code}/heartbeat` - Heartbeat по коду

---

## 📊 Telemetry API (Мониторинг Pi)

### Отправить телеметрию от Pi

```http
POST /api/v1/telemetry/
Content-Type: application/json

{
  "device_id": "uuid",
  "cpu_usage": 34.5,
  "cpu_temperature": 52.3,
  "ram_usage": 61.0,
  "disk_usage": 45.2,
  "uptime": 86400,
  "camera_fps": 30.0,
  "network_status": "online"
}
```

### Получить историю

```http
GET /api/v1/telemetry/devices/{device_id}?hours=24&limit=1000
```

### Получить статистику

```http
GET /api/v1/telemetry/devices/{device_id}/stats?hours=24
```

Возвращает avg/max/min для всех метрик.

**Endpoints:**
- `POST /api/v1/telemetry/` - Отправить
- `GET /api/v1/telemetry/devices/{id}` - История
- `GET /api/v1/telemetry/devices/{id}/latest` - Последняя запись
- `GET /api/v1/telemetry/devices/{id}/stats` - Статистика
- `DELETE /api/v1/telemetry/devices/{id}/cleanup` - Очистка старых

---

## 📋 Events API (События распознавания)

### Создать событие от Pi

```http
POST /api/v1/events/
Content-Type: application/json

{
  "device_id": "uuid",
  "person_id": "uuid",  // или null для unknown
  "event_type": "recognized",
  "confidence": 45.2,
  "door_opened": true,
  "photo_path": "events/2026/06/13/event_uuid.jpg",
  "video_path": null
}
```

**Типы событий:**
- `recognized` - человек распознан
- `unknown` - неизвестный человек
- `access_denied` - доступ запрещен
- `manual_open` - ручное открытие
- `door_opened` - дверь открыта
- `recognition_error` - ошибка распознавания

### Получить лог событий

```http
GET /api/v1/events/?days=7&device_id=uuid&event_type=recognized
```

### Статистика

```http
GET /api/v1/events/stats/summary?days=7
```

**Endpoints:**
- `GET /api/v1/events/` - Лог с фильтрацией
- `GET /api/v1/events/{id}` - Детали
- `POST /api/v1/events/` - Создать (от Pi)
- `GET /api/v1/events/stats/summary` - Статистика
- `DELETE /api/v1/events/{id}` - Удалить
- `DELETE /api/v1/events/cleanup` - Очистка старых

---

## 🎮 Commands API (Команды для Pi)

### Создать команду

```http
POST /api/v1/commands/
Content-Type: application/json

{
  "device_id": "uuid",
  "command_type": "capture_photos",
  "parameters": "{\"person_id\": \"uuid\", \"count\": 10}"
}
```

**Типы команд:**
- `capture_photos` - сделать серию фото
- `rebuild_model` - переобучить модель
- `reload_model` - перезагрузить модель
- `open_door` - открыть дверь
- `restart_recognition` - перезапуск распознавания
- `restart_camera` - перезапуск камеры
- `restart_agent` - перезапуск агента
- `reboot_device` - перезагрузка Pi
- `collect_logs` - собрать логи
- `start_stream` - начать видео
- `stop_stream` - остановить видео

### Pi получает очередь команд

```http
GET /api/v1/commands/pending?device_id=uuid
```

### Pi обновляет статус команды

```http
PATCH /api/v1/commands/{command_id}
Content-Type: application/json

{
  "status": "completed",
  "completed_at": "2026-06-13T00:00:00Z",
  "result": "{\"success\": true, \"photos_count\": 10}"
}
```

**Статусы:** pending, sent, received, running, completed, failed, expired

### Быстрые команды

```http
POST /api/v1/commands/devices/{id}/capture-photos?person_id=uuid&count=10
POST /api/v1/commands/devices/{id}/rebuild-model
POST /api/v1/commands/devices/{id}/open-door?duration=5
POST /api/v1/commands/devices/{id}/reboot?delay=10
```

**Endpoints:**
- `GET /api/v1/commands/` - История
- `GET /api/v1/commands/pending` - Очередь для Pi
- `GET /api/v1/commands/{id}` - Детали
- `POST /api/v1/commands/` - Создать
- `PATCH /api/v1/commands/{id}` - Обновить статус (Pi)
- `DELETE /api/v1/commands/{id}` - Удалить

---

## 🔄 Sync API (Офлайн синхронизация)

### Массовая загрузка событий

```http
POST /api/v1/sync/events/bulk?device_id=uuid
Content-Type: application/json

[
  {
    "device_id": "uuid",
    "person_id": "uuid",
    "event_type": "recognized",
    "confidence": 45.2,
    "door_opened": true
  },
  // ... больше событий
]
```

**Используется когда Pi работал офлайн и накопил события в SQLite.**

### Массовая загрузка телеметрии

```http
POST /api/v1/sync/telemetry/bulk?device_id=uuid
Content-Type: application/json

[
  {
    "device_id": "uuid",
    "cpu_usage": 34.5,
    "ram_usage": 61.0
  },
  // ... больше записей
]
```

### Проверить статус синхронизации

```http
GET /api/v1/sync/status/{device_id}
```

Возвращает:
- Последнее событие
- Последняя телеметрия
- Количество pending команд
- Нужна ли синхронизация

**Endpoints:**
- `POST /api/v1/sync/events/bulk` - События массово
- `POST /api/v1/sync/telemetry/bulk` - Телеметрия массово
- `GET /api/v1/sync/status/{device_id}` - Статус синхронизации

---

## 📝 Audit Logs API

### Получить audit log

```http
GET /api/v1/audit/?days=30&user_id=uuid&action=create_person
```

### Создать запись (обычно автоматически)

```http
POST /api/v1/audit/
Content-Type: application/json

{
  "user_id": "uuid",
  "action": "manual_open_door",
  "entity_type": "device",
  "entity_id": "uuid",
  "ip_address": "192.168.1.50"
}
```

**Типичные действия:**
- `create_person`, `update_person`, `delete_person`
- `add_photo`, `delete_photo`
- `manual_open_door`
- `restart_device`, `reboot_device`
- `create_backup`, `restore_backup`

### Статистика

```http
GET /api/v1/audit/stats/summary?days=30
```

**Endpoints:**
- `GET /api/v1/audit/` - Лог с фильтрацией
- `GET /api/v1/audit/{id}` - Детали
- `POST /api/v1/audit/` - Создать
- `GET /api/v1/audit/stats/summary` - Статистика
- `DELETE /api/v1/audit/cleanup` - Очистка (мин. 30 дней)

---

## 📦 Полный список всех endpoints

**System:** 3 endpoints  
**Auth:** 5 endpoints  
**People:** 5 endpoints  
**Photos:** 6 endpoints  
**Devices:** 8 endpoints  
**Telemetry:** 5 endpoints  
**Events:** 6 endpoints  
**Commands:** 12 endpoints (включая быстрые)  
**Sync:** 3 endpoints  
**Audit:** 5 endpoints  

**Итого: 58 endpoints**

---

## 🗄️ База данных

**Таблицы:**
1. `users` - администраторы
2. `people` - люди для распознавания
3. `person_photos` - фотографии (много на человека)
4. `devices` - Raspberry Pi устройства
5. `access_events` - события распознавания
6. `telemetry` - телеметрия устройств
7. `device_commands` - команды для устройств
8. `audit_logs` - логи действий админов
9. `backups` - информация о бэкапах

---

## 🔐 Безопасность

**JWT токены:** 30 минут  
**Роли:** admin, superadmin  
**Хеширование:** bcrypt  
**Защита:** HTTP Bearer Authorization  

**Superadmin требуется для:**
- Удаление людей
- Ручное открытие двери
- Перезагрузка устройств
- Управление пользователями
- Восстановление бэкапов

---

## 📁 Структура файлов

```
data/
├── faces/
│   └── {person_uuid}/
│       ├── original/           # Оригинальные фото
│       │   └── .thumbnails/    # Миниатюры
│       └── processed/          # Обработанные лица (OpenCV)
├── events/                     # Снапшоты событий
├── videos/                     # Видео событий
├── recognition/                # Модели (trainer.yml, labels.json)
├── logs/                       # Логи
├── backups/                    # Бэкапы
└── trash/                      # Soft delete
```

---

## 🔄 Офлайн режим (для Pi агента)

**Когда Pi теряет связь:**
1. События сохраняются в локальный SQLite
2. Телеметрия накапливается локально
3. Распознавание продолжает работать
4. Дверь открывается локально

**При восстановлении связи:**
1. Pi подключается к серверу
2. Отправляет все накопленные события через `/sync/events/bulk`
3. Отправляет телеметрию через `/sync/telemetry/bulk`
4. Получает pending команды через `/commands/pending`
5. Обновляет модель если были изменения

---

*Документация актуальна на 2026-06-13*
