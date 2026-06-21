# FaceGuard — Полный гайд по реализации

> Умный домофон на Raspberry Pi 5 с React Admin Panel и FastAPI Backend

---

## Содержание

1. [Общая архитектура](#1-общая-архитектура)
2. [Где что хостить](#2-где-что-хостить)
3. [Структура проекта](#3-структура-проекта)
4. [Технологии](#4-технологии)
5. [Как работает распознавание](#5-как-работает-распознавание)
6. [Как работает оффлайн-режим](#6-как-работает-оффлайн-режим)
7. [Как работает видео](#7-как-работает-видео)
8. [Как делать фото через админ-панель](#8-как-делать-фото-через-админ-панель)
9. [База данных — таблицы](#9-база-данных--таблицы)
10. [API эндпоинты](#10-api-эндпоинты)
11. [WebSocket — каналы и команды](#11-websocket--каналы-и-команды)
12. [Структура файлов на сервере](#12-структура-файлов-на-сервере)
13. [MVP — этапы разработки](#13-mvp--этапы-разработки)
14. [Деплой на VPS](#14-деплой-на-vps)
15. [Настройка Raspberry Pi](#15-настройка-raspberry-pi)
16. [Безопасность](#16-безопасность)
17. [Важные решения и почему](#17-важные-решения-и-почему)

---

## 1. Общая архитектура

```
┌──────────────────────────────────────────┐
│            VPS (Hetzner / DO)            │
│                                          │
│  ┌─────────────┐   ┌──────────────────┐ │
│  │    React    │   │  FastAPI Backend │ │
│  │ Admin Panel │   │  + PostgreSQL    │ │
│  │   (Nginx)   │   │  + File Storage  │ │
│  └─────────────┘   └──────────────────┘ │
└──────────────────────────────────────────┘
              ↑
      WebSocket + REST (интернет)
              ↓
┌──────────────────────────────────────────┐
│          Raspberry Pi 5 (дома)           │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │        raspberry-agent           │   │
│  │  picamera2 → OpenCV LBPH         │   │
│  │  servo motor → door control      │   │
│  │  локальный SQLite (оффлайн буфер)│   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

**Принцип:**
- React — только интерфейс, ничего больше
- FastAPI — вся логика, права, файлы, база, команды
- Raspberry Pi Agent — камера, OpenCV, сервопривод, телеметрия
- Pi умеет работать без интернета и синхронизируется когда связь появилась

---

## 2. Где что хостить

### VPS (рекомендован Hetzner CX22 — €4/мес)
- React Admin Panel (статика через Nginx)
- FastAPI Backend
- PostgreSQL
- Хранилище файлов (фото, бэкапы, логи)

### Raspberry Pi 5 (дома)
- raspberry-agent (Python systemd-сервис)
- OpenCV + LBPH модель (`trainer.yml` + `labels.json`)
- picamera2
- Сервопривод (GPIO)
- Локальный SQLite для оффлайн буфера

### Почему не FastAPI на самой Pi?

| | FastAPI на VPS | FastAPI на Pi |
|---|---|---|
| Сайт онлайн | ✅ Всегда | ❌ Нужен белый IP или туннель |
| Pi работает оффлайн | ✅ Agent автономен | ✅ |
| Надёжность | ✅ VPS не падает | ❌ SD-карта, питание, перегрев |
| Масштабирование | ✅ Легко | ❌ Ограничен железом |

### Безопасное соединение Pi → VPS

Используй **Tailscale** (бесплатно до 3 устройств):
```bash
# На VPS и на Pi
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up
```
Pi получает фиксированный приватный IP (например `100.x.x.x`) и не торчит в открытый интернет.

---

## 3. Структура проекта

```
faceguard/
├── frontend/                  # React + Vite + TypeScript
│
├── backend/                   # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py    # JWT, bcrypt
│   │   │   └── logging.py
│   │   ├── api/v1/
│   │   │   ├── auth.py
│   │   │   ├── persons.py
│   │   │   ├── photos.py
│   │   │   ├── events.py
│   │   │   ├── devices.py
│   │   │   ├── commands.py
│   │   │   ├── telemetry.py
│   │   │   ├── logs.py
│   │   │   ├── backups.py
│   │   │   └── websocket.py
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # бизнес-логика
│   │   └── db/
│   ├── migrations/            # Alembic
│   ├── Dockerfile
│   └── requirements.txt
│
├── raspberry-agent/           # Python agent для Pi
│   ├── agent/
│   │   ├── main.py
│   │   ├── camera/            # picamera2
│   │   ├── recognition/       # OpenCV LBPH
│   │   ├── door/              # сервопривод GPIO
│   │   ├── telemetry/         # CPU, RAM, температура
│   │   ├── commands/          # получение и выполнение команд
│   │   ├── sync/              # синхронизация при восстановлении связи
│   │   └── local_db/          # SQLite оффлайн буфер
│   ├── config/
│   ├── Dockerfile
│   └── requirements.txt
│
├── data/                      # volume для VPS
│   ├── faces/                 # фото людей
│   ├── events/                # снапшоты событий
│   ├── videos/                # записи событий
│   ├── logs/
│   ├── backups/
│   └── trash/                 # soft delete
│
├── infrastructure/
│   ├── nginx/
│   │   └── nginx.conf
│   └── scripts/
│       └── backup.sh
│
├── docker-compose.yml         # dev
├── docker-compose.prod.yml    # production
└── .env.example
```

---

## 4. Технологии

### Backend
| Что | Технология |
|---|---|
| API Framework | FastAPI |
| База данных | PostgreSQL |
| ORM | SQLAlchemy 2.0 (async) |
| Миграции | Alembic |
| Авторизация | JWT (python-jose) |
| Пароли | bcrypt (passlib) |
| Файлы | aiofiles |
| WebSocket | FastAPI WebSocket |
| Контейнер | Docker |

### Frontend
| Что | Технология |
|---|---|
| Framework | React + Vite + TypeScript |
| UI | Tailwind CSS |
| State | Zustand |
| HTTP | Axios |
| WebSocket | native WS |
| Видео | `<img>` MJPEG stream |

### Raspberry Pi Agent
| Что | Технология |
|---|---|
| Камера | picamera2 |
| Детекция | OpenCV Haar Cascade |
| Распознавание | OpenCV LBPH |
| GPIO / Servo | RPi.GPIO или gpiozero |
| Оффлайн БД | SQLite (aiosqlite) |
| WS клиент | websockets |

---

## 5. Как работает распознавание

### Модель: OpenCV LBPH (Local Binary Patterns Histograms)

**Обучение** (один раз при добавлении/изменении людей):
```
data/faces/{uuid}/processed/*.jpg
        ↓
  cv2.face.LBPHFaceRecognizer_create()
  recognizer.train(faces, labels)
        ↓
  trainer.yml   ← сама модель (держится в памяти на Pi)
  labels.json   ← маппинг: число → person_uuid
```

**Распознавание** (каждый раз у двери):
```
кадр с picamera2
    ↓ (30ms)
Haar Cascade → найти лицо на кадре
    ↓ (100ms)
обрезать лицо → grayscale → resize 200x200
    ↓ (50ms)
recognizer.predict(face) → (label_id, confidence)
    ↓
confidence < 70  →  известный человек → открыть дверь
confidence >= 70 →  неизвестный → сохранить снапшот
```

### Скорость на Raspberry Pi 5

| Этап | Время |
|---|---|
| Захват кадра | ~30ms |
| Детекция лица (Haar) | ~80-150ms |
| LBPH predict | ~20-50ms |
| Сигнал на сервопривод | ~5ms |
| **Итого** | **~150-250ms** |

Открытие двери занимает **меньше 0.5 секунды**. 1-2 секунды — это с учётом нескольких попыток при плохом освещении.

### Confidence threshold

```python
CONFIDENCE_THRESHOLD = 70  # настраивается в .env

if confidence < CONFIDENCE_THRESHOLD:
    # знакомый — открыть
else:
    # незнакомый — сохранить фото и уведомить
```

Чем **ниже** число — тем строже (меньше ложных срабатываний).
Чем **выше** — тем мягче (больше ложных срабатываний).

### Upgrade путь

Сейчас: OpenCV LBPH (быстро, просто)
Потом (без переделки архитектуры): `face_recognition` на базе dlib — точнее, ~300-500ms на Pi 5

---

## 6. Как работает оффлайн-режим

Pi запускается и пытается подключиться к серверу. Независимо от результата — начинает работать.

```
Pi стартует
    ↓
Загружает trainer.yml из локального диска
    ↓
Пытается WebSocket → серверу
    ├── Успех → онлайн-режим (телеметрия, команды, события в реальном времени)
    └── Неудача → оффлайн-режим:
            - Распознаёт лица (работает полностью локально)
            - Открывает/закрывает дверь
            - Сохраняет события в локальный SQLite
            - Каждые 30 сек пробует переподключиться
    ↓
Интернет появился → переподключается
    ↓
Синхронизирует накопленные события с сервером
    ↓
Скачивает новые фото/модель если были обновления
```

### Что не работает без интернета
- Просмотр событий в браузере (они сохранятся и придут потом)
- Добавление нового человека через Admin Panel
- Live view с камеры

### Что работает без интернета
- Распознавание лиц ✅
- Открытие двери ✅
- Сохранение событий (локально, синхронизируются потом) ✅

---

## 7. Как работает видео

### Способ: MJPEG через WebSocket

Самый простой и достаточный для домофона.

```
Pi захватывает кадр (picamera2)
    ↓
Сжимает в JPEG (~640x480, quality=70)
    ↓
Отправляет bytes через WebSocket → серверу
    ↓
Сервер ретранслирует bytes → всем браузерам в /ws/camera
    ↓
Браузер: const img = document.getElementById('stream')
         ws.onmessage = (e) => img.src = URL.createObjectURL(e.data)
```

**Задержка:** ~200-500ms — достаточно для домофона.
**Трафик:** ~5-15 Мбит/с (только когда кто-то смотрит).

Pi шлёт кадры только когда есть активные зрители (сервер сигнализирует через WebSocket-команду `start_stream` / `stop_stream`).

---

## 8. Как делать фото через админ-панель

Полный цикл регистрации нового человека:

```
1. Админ создаёт запись человека (имя, метка)
   POST /api/v1/persons
   → сервер создаёт папку data/faces/{uuid}/original/ и /processed/

2. Админ нажимает "Сфотографировать"
   POST /api/v1/commands  { type: "capture_photos", person_id: "uuid", count: 10 }
   → команда записывается в БД со статусом "pending"

3. Pi получает команду через WebSocket (push от сервера)
   { "cmd": "capture_photos", "person_id": "uuid", "count": 10 }

4. Pi делает 10 фото через picamera2
   Pi вырезает лицо через OpenCV
   Pi сохраняет локально временно

5. Pi загружает каждое фото на сервер
   POST /api/v1/photos/upload
   multipart/form-data: file + person_id + type=original
   → сервер сохраняет в data/faces/{uuid}/original/photo_001.jpg
   → OpenCV вырезает лицо → /processed/face_001.jpg
   → запись в person_photos

6. Pi отправляет результат команды
   { "cmd_id": "...", "status": "done", "count": 10 }

7. Сервер уведомляет браузер через WebSocket events
   { "event": "photos_ready", "person_id": "uuid" }

8. Админ видит фото в браузере, выбирает хорошие, плохие удаляет

9. Админ нажимает "Обучить модель"
   POST /api/v1/commands  { type: "rebuild_model" }

10. Pi переобучает модель на всех processed фото
    Сохраняет новый trainer.yml
    Загружает модель в память
    Уведомляет сервер: "model_rebuilt"
```

---

## 9. База данных — таблицы

### admin_users
```sql
id, username, hashed_password, is_superadmin, created_at, last_login
```

### persons
```sql
id UUID, name, label, notes, photo_dir (UUID папки),
is_active, access_enabled, created_at, updated_at, created_by
```

### person_photos
```sql
id, person_id → persons, filename, filepath_original, filepath_processed,
is_primary, is_deleted, uploaded_at
```

### access_events
```sql
id, person_id (nullable = неизвестный), person_name (денорм.),
recognized, confidence, door_opened,
snapshot_path, event_type (ring|recognized|denied|manual_open),
timestamp
```

### device_commands
```sql
id, device_id, type, payload (JSON), status (pending|sent|done|error),
created_by, created_at, executed_at, result
```

### devices
```sql
id, name, device_token (hashed), last_seen, ip_address,
cpu_percent, ram_percent, temperature, uptime_seconds,
camera_ok, recognition_running
```

### audit_logs
```sql
id, admin_user_id, username (денорм.), action, details (JSON),
ip_address, timestamp
```

### backups
```sql
id, filename, filepath, size_bytes, includes_faces, includes_model,
created_by, created_at, checksum
```

---

## 10. API эндпоинты

### Auth
```
POST   /api/v1/auth/login          → JWT токен
GET    /api/v1/auth/me             → текущий пользователь
POST   /api/v1/auth/users          → создать админа (superadmin)
DELETE /api/v1/auth/users/{id}     → удалить админа
```

### Persons
```
GET    /api/v1/persons             → список (пагинация, фильтры)
POST   /api/v1/persons             → создать
GET    /api/v1/persons/{id}        → детали + фото
PATCH  /api/v1/persons/{id}        → изменить (имя, метка, доступ)
DELETE /api/v1/persons/{id}        → soft delete
```

### Photos
```
GET    /api/v1/persons/{id}/photos         → список фото
POST   /api/v1/photos/upload               → загрузить фото (Pi или ручной upload)
DELETE /api/v1/photos/{id}                 → удалить фото
PATCH  /api/v1/photos/{id}/primary         → сделать основным
GET    /api/v1/photos/{id}/file            → скачать файл
```

### Events
```
GET    /api/v1/events              → лог событий (фильтр: дата, тип, person)
GET    /api/v1/events/{id}         → детали события + снапшот
POST   /api/v1/events              → создать событие (только Pi, device token)
```

### Commands
```
POST   /api/v1/commands            → создать команду (Pi исполнит)
GET    /api/v1/commands            → история команд
GET    /api/v1/commands/pending    → очередь (только Pi)
PATCH  /api/v1/commands/{id}       → обновить статус (только Pi)
```

### Device
```
GET    /api/v1/device/status       → статус устройства (онлайн/оффлайн, телеметрия)
POST   /api/v1/device/telemetry    → принять телеметрию (только Pi)
POST   /api/v1/device/reboot       → команда перезагрузки
POST   /api/v1/device/restart-recognition → перезапуск сервиса
POST   /api/v1/device/open-door    → ручное открытие (superadmin)
```

### Logs & Backup
```
GET    /api/v1/logs/admin          → audit log (фильтры)
GET    /api/v1/logs/system         → системные логи (скачать)
POST   /api/v1/backups             → создать бэкап
GET    /api/v1/backups             → список бэкапов
GET    /api/v1/backups/{id}/download → скачать .zip
POST   /api/v1/backups/restore     → восстановить
```

---

## 11. WebSocket — каналы и команды

### /ws/pi — соединение с Raspberry Pi (device token)

**Pi → Сервер:**
```json
{ "type": "heartbeat" }
{ "type": "telemetry", "cpu": 34.2, "ram": 61.0, "temp": 52.3, "uptime": 86400 }
{ "type": "event", "event_type": "recognized", "person_id": "uuid", "confidence": 45.2 }
{ "type": "event", "event_type": "unknown", "snapshot_base64": "..." }
{ "type": "cmd_result", "cmd_id": "...", "status": "done", "data": {} }
{ "type": "stream_frame", "frame": <bytes> }
```

**Сервер → Pi:**
```json
{ "cmd": "capture_photos", "cmd_id": "...", "person_id": "uuid", "count": 10 }
{ "cmd": "rebuild_model", "cmd_id": "..." }
{ "cmd": "reload_model", "cmd_id": "..." }
{ "cmd": "open_door", "cmd_id": "...", "duration": 5 }
{ "cmd": "restart_recognition", "cmd_id": "..." }
{ "cmd": "reboot", "cmd_id": "..." }
{ "cmd": "start_stream" }
{ "cmd": "stop_stream" }
{ "cmd": "collect_logs", "cmd_id": "..." }
```

### /ws/events — браузер (JWT)
Сервер → Браузер (реальное время):
```json
{ "type": "device_online" }
{ "type": "device_offline" }
{ "type": "ring", "timestamp": "..." }
{ "type": "recognized", "person_name": "...", "confidence": 45.2 }
{ "type": "unknown_person", "snapshot_url": "..." }
{ "type": "door_opened", "by": "auto|manual" }
{ "type": "photos_ready", "person_id": "...", "count": 10 }
{ "type": "model_rebuilt" }
{ "type": "telemetry", "cpu": 34.2, ... }
```

### /ws/camera — видео стрим (JWT)
Сервер → Браузер: бинарные bytes (JPEG кадры)

---

## 12. Структура файлов на сервере

```
data/
├── faces/
│   └── {person_uuid}/
│       ├── original/
│       │   ├── photo_001.jpg   ← полный кадр с камеры
│       │   └── photo_002.jpg
│       └── processed/
│           ├── face_001.jpg    ← вырезанное лицо, grayscale, 200x200
│           └── face_002.jpg
│
├── events/
│   └── 2025/01/15/
│       └── {event_uuid}.jpg   ← снапшот в момент события
│
├── videos/
│   └── 2025/01/15/
│       └── {event_uuid}.mp4
│
├── recognition/               ← модели для Pi (скачивает при синхронизации)
│   ├── trainer.yml
│   └── labels.json
│
├── logs/
│   ├── backend/
│   └── agent/
│
├── backups/
│   └── backup_2025-01-15_120000.zip
│
└── trash/                     ← soft delete (30 дней, потом auto clean)
    └── photos/
```

**Почему UUID папки для person, а не имя:**
- имя может поменяться
- могут быть одинаковые имена
- кириллица в путях = проблемы на некоторых системах

---

## 13. MVP — этапы разработки

### MVP 1 — Основа (неделя 1)
- [ ] FastAPI запускается
- [ ] PostgreSQL в Docker
- [ ] Таблицы: admin_users, persons, person_photos
- [ ] JWT авторизация (login/me)
- [ ] CRUD для persons
- [ ] Upload фото + сохранение в папки
- [ ] OpenCV вырезает лицо при upload

### MVP 2 — Pi Agent (неделя 2)
- [ ] raspberry-agent подключается по WebSocket
- [ ] Heartbeat каждые 10 сек
- [ ] Телеметрия (CPU, RAM, температура)
- [ ] Получение и подтверждение команд
- [ ] Оффлайн-режим с SQLite буфером

### MVP 3 — Фото через камеру (неделя 3)
- [ ] Команда capture_photos
- [ ] Pi делает серию фото через picamera2
- [ ] OpenCV вырезает лица
- [ ] Загружает на сервер через POST /photos/upload
- [ ] Браузер видит новые фото в реальном времени

### MVP 4 — Распознавание (неделя 4)
- [ ] Команда rebuild_model
- [ ] Pi обучает LBPH на processed/*.jpg
- [ ] Сохраняет trainer.yml + labels.json
- [ ] Pi распознаёт в реальном времени
- [ ] При совпадении — открывает дверь через GPIO

### MVP 5 — События (неделя 5)
- [ ] Pi отправляет события распознавания
- [ ] Сохранение снапшотов событий
- [ ] Страница Events в React с реальным временем
- [ ] Unknown person тоже сохраняется

### MVP 6 — Управление и логи (неделя 6)
- [ ] Перезапуск сервиса распознавания
- [ ] Перезагрузка Pi
- [ ] Сбор логов
- [ ] Audit log для всех действий
- [ ] Бэкап и восстановление
- [ ] Live view с камеры (MJPEG)

---

## 14. Деплой на VPS

### docker-compose.prod.yml
```yaml
version: "3.9"
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./data:/app/data
      - certbot_data:/etc/letsencrypt

  backend:
    build: ./backend
    env_file: .env
    volumes:
      - ./data:/app/data
    depends_on: [postgres]

  postgres:
    image: postgres:16-alpine
    env_file: .env
    volumes:
      - postgres_data:/var/lib/postgresql/data

  frontend:
    build: ./frontend
    # собирает статику, nginx её раздаёт

volumes:
  postgres_data:
  certbot_data:
```

### Порядок запуска на VPS
```bash
git clone https://github.com/you/faceguard
cd faceguard
cp .env.example .env
# заполнить .env (SECRET_KEY, DB_PASSWORD, PI_SECRET, TAILSCALE_IP)
docker compose -f docker-compose.prod.yml up -d
# Migrations
docker compose exec backend alembic upgrade head
```

### HTTPS (Let's Encrypt)
```bash
docker run --rm -v certbot_data:/etc/letsencrypt certbot/certbot \
  certonly --webroot -w /var/www/html -d yourdomain.com
```

---

## 15. Настройка Raspberry Pi

### Установка
```bash
# Установить зависимости
sudo apt update
sudo apt install python3-pip python3-venv libopencv-dev

# Клонировать проект
git clone https://github.com/you/faceguard
cd faceguard/raspberry-agent

# Venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Конфиг
cp config/.env.example config/.env
# Заполнить: BACKEND_WS_URL, BACKEND_API_URL, DEVICE_TOKEN, PI_SECRET
```

### .env для агента
```env
BACKEND_WS_URL=ws://100.x.x.x:8000/ws/pi      # Tailscale IP сервера
BACKEND_API_URL=http://100.x.x.x:8000
DEVICE_TOKEN=уникальный_токен_устройства
PI_SECRET=тот_же_секрет_что_в_серверном_.env
CONFIDENCE_THRESHOLD=70
SERVO_PIN=18
DOOR_OPEN_SECONDS=5
OFFLINE_SYNC_INTERVAL=30
```

### systemd сервис (автозапуск)
```ini
# /etc/systemd/system/faceguard-agent.service
[Unit]
Description=FaceGuard Agent
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/faceguard/raspberry-agent
ExecStart=/home/pi/faceguard/raspberry-agent/venv/bin/python -m agent.main
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable faceguard-agent
sudo systemctl start faceguard-agent
sudo journalctl -u faceguard-agent -f  # логи
```

---

## 16. Безопасность

### Аутентификация Pi на сервере
Pi идентифицируется через:
1. `X-Device-Token` заголовок (уникальный токен в БД, hashed)
2. `X-Pi-Secret` заголовок (общий секрет из .env)

### Роли пользователей
| Действие | admin | superadmin |
|---|---|---|
| Просмотр людей и событий | ✅ | ✅ |
| Добавление/изменение людей | ✅ | ✅ |
| Удаление людей | ❌ | ✅ |
| Ручное открытие двери | ❌ | ✅ |
| Перезагрузка Pi | ❌ | ✅ |
| Управление администраторами | ❌ | ✅ |
| Восстановление бэкапа | ❌ | ✅ |

### Что важно не делать
- ❌ Не открывать порты Pi напрямую в интернет — только через Tailscale
- ❌ Не хранить фото в PostgreSQL — только пути
- ❌ Не использовать имя человека как название папки
- ❌ Не удалять фото навсегда сразу — сначала в trash/
- ❌ Не переобучать модель во время активного распознавания (atomically swap)
- ❌ Не делать reboot без audit log

---

## 17. Важные решения и почему

### UUID папки для человека (не имя)
```
✅  data/faces/3a8f6d8e-2d4c-4f90-a310.../
❌  data/faces/Иван Петров/
```
Имя может поменяться, могут быть одинаковые имена, кириллица ломает пути.

### Original + Processed фото отдельно
```
original/ — полный кадр (нужен для ручной проверки и переобучения)
processed/ — вырезанное лицо 200x200 grayscale (нужен для LBPH train)
```
Если перейдёшь на другую модель — original фото всегда можно переобработать.

### Soft delete (trash/)
Фото и люди сначала идут в trash/, через 30 дней удаляются. Защита от случайного удаления.

### Команды через БД + WebSocket
Команды пишутся в таблицу `device_commands`, затем пушатся по WebSocket. Если Pi оффлайн — команда висит в статусе `pending` и выполнится при следующем подключении.

### LBPH vs face_recognition
Сейчас: **LBPH** — быстрее, проще, не нужен интернет для установки.
Потом: **face_recognition (dlib)** — точнее, устойчивее к изменению внешности. Архитектура не меняется — только модуль `recognition/recognizer.py`.

---

*Документ актуален на момент начала разработки. Обновляй по мере реализации этапов.*
