# FaceGuard - Smart Doorbell System

Умный домофон с распознаванием лиц на базе Raspberry Pi 5, FastAPI и React.

## 🎯 Возможности

- ✅ **Распознавание лиц** - OpenCV LBPH (1-2 секунды)
- ✅ **Автоматическое открытие двери** - GPIO сервопривод
- ✅ **Офлайн режим** - работает без интернета, синхронизируется при подключении
- ✅ **Backend API** - 58 endpoints для управления системой
- ✅ **Raspberry Pi Agent** - автономная работа с камерой и распознаванием
- ✅ **Телеметрия** - мониторинг CPU, RAM, температуры
- ✅ **События** - лог всех распознаваний
- ✅ **Команды** - удалённое управление устройством
- ✅ **Docker** - полная контейнеризация

## 📊 Архитектура

```
┌─────────────────────────────────────────┐
│   Backend Server (VPS / Home Server)   │
│                                         │
│   - FastAPI Backend                     │
│   - PostgreSQL Database                 │
│   - 58 REST API Endpoints               │
│   - JWT Authentication                  │
│   - Event/Telemetry Storage             │
│   - Command Queue                       │
│                                         │
│   http://192.168.1.100:8000             │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP REST API
                  │ - Heartbeat (10s)
                  │ - Events
                  │ - Telemetry (30s)
                  │ - Commands (5s polling)
                  │
┌─────────────────▼───────────────────────┐
│   Raspberry Pi (на месте установки)    │
│                                         │
│   - FaceGuard Agent                     │
│   - picamera2 / USB Camera              │
│   - OpenCV LBPH Recognition             │
│   - GPIO Servo Control                  │
│   - SQLite Offline Buffer               │
│   - Autonomous Operation                │
│                                         │
│   Door Control + Face Recognition       │
└─────────────────────────────────────────┘
```

**Важно:** Backend и Agent запускаются на **разных устройствах**:
- **Backend** - на сервере (VPS, домашний сервер, NAS)
- **Agent** - на Raspberry Pi возле двери

---

## 🚀 Быстрый старт

### 1. Запуск Backend (на сервере)

```bash
# На сервере (VPS / Home Server / NAS)
cd FaceGuardV1/backend-service

# Запустить backend + PostgreSQL
docker-compose up -d --build

# Проверить статус
docker-compose ps

# Доступ:
# - API: http://YOUR_SERVER_IP:8000
# - Swagger: http://YOUR_SERVER_IP:8000/docs
```

**Документация backend:** [backend-service/README.md](../backend-service/README.md)

### 2. Создать администратора

```bash
curl -X POST http://YOUR_SERVER_IP:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_secure_password",
    "role": "superadmin"
  }'

# Получить JWT токен
curl -X POST http://YOUR_SERVER_IP:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_secure_password"
  }'
```

### 3. Зарегистрировать устройство

```bash
curl -X POST http://YOUR_SERVER_IP:8000/api/v1/devices/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Door Pi",
    "device_code": "rpi-main-001"
  }'

# Сохрани device_id из ответа!
```

### 4. Запуск Agent (на Raspberry Pi)

```bash
# На Raspberry Pi
cd FaceGuardV1/agent

# Создать конфигурацию
cp .env.example .env

# Отредактировать .env:
nano .env

# Указать:
# BACKEND_URL=http://YOUR_SERVER_IP:8000  # IP адрес сервера с backend!
# DEVICE_CODE=rpi-main-001
# HARDWARE_MODE=raspberry_pi

# Запустить agent
docker-compose up -d --build

# Проверить логи
docker-compose logs -f agent
```

**Документация agent:** [agent/README.md](../agent/README.md)

### 5. Проверить подключение

```bash
# Проверить статус устройства
curl http://YOUR_SERVER_IP:8000/api/v1/devices/by-code/rpi-main-001/heartbeat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Должен вернуть status: "online"
```

---

## 📁 Структура проекта

```
FaceGuardV1/
├── backend-service/           # FastAPI Backend (запускается на сервере)
│   ├── app/
│   │   ├── main.py
│   │   ├── api/              # 58 endpoints
│   │   ├── models/           # SQLAlchemy модели
│   │   └── schemas/          # Pydantic схемы
│   ├── docker-compose.yml    # Backend + PostgreSQL
│   ├── Dockerfile
│   ├── README.md             # Документация backend
│   ├── SETUP.md
│   └── API_DOCUMENTATION.md  # Полный список API
│
├── agent/                     # Raspberry Pi Agent (запускается на Pi)
│   ├── main.py               # Точка входа
│   ├── core/                 # Конфигурация, логирование, БД
│   ├── camera/               # Работа с камерой
│   ├── recognition/          # OpenCV LBPH распознавание
│   ├── door/                 # GPIO сервопривод
│   ├── telemetry/           # Мониторинг системы
│   ├── sync/                # Синхронизация с backend
│   ├── commands/            # Выполнение команд
│   ├── events/              # Обработка событий
│   ├── docker-compose.yml   # Agent
│   ├── Dockerfile
│   ├── README.md            # Полное руководство
│   ├── ARCHITECTURE.md      # Архитектура agent
│   └── EXAMPLES.md          # Примеры использования
│
├── data/                     # Общая папка для данных (на каждом устройстве своя)
│   ├── faces/               # Фото людей
│   ├── events/              # Снапшоты событий
│   ├── models/              # LBPH модели
│   └── logs/
│
└── README.md                 # Этот файл
```

---

## 🔧 Конфигурация

### Backend (.env)

```env
# backend-service/.env
DATABASE_URL=postgresql://faceguard:faceguard@db:5432/faceguard
APP_ENV=production
SECRET_KEY=your-secret-key-here
```

### Agent (.env)

```env
# agent/.env
BACKEND_URL=http://192.168.1.100:8000  # IP адрес сервера с backend
DEVICE_CODE=rpi-main-001
HARDWARE_MODE=raspberry_pi
RECOGNITION_THRESHOLD=70
SERVO_GPIO_PIN=17
DOOR_OPEN_DURATION=5
```

---

## 👤 Регистрация первого человека

### 1. Создать человека

```bash
curl -X POST http://YOUR_SERVER_IP:8000/api/v1/people/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "description": "Resident",
    "access_enabled": true
  }'

# Сохрани person_id из ответа!
```

### 2. Сделать фотографии через камеру

```bash
curl -X POST http://YOUR_SERVER_IP:8000/api/v1/commands/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "DEVICE_UUID",
    "command_type": "capture_photos",
    "parameters": "{\"person_id\": \"PERSON_UUID\", \"count\": 15}"
  }'
```

**Что происходит:**
- Agent получает команду через polling (5 сек)
- Делает 15 фотографий с интервалом 0.5 сек
- Обрабатывает лица через OpenCV
- Сохраняет в `data/faces/{person_id}/`

### 3. Обучить модель

```bash
curl -X POST http://YOUR_SERVER_IP:8000/api/v1/commands/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "DEVICE_UUID",
    "command_type": "rebuild_model",
    "parameters": "{}"
  }'
```

**Готово!** Теперь agent будет распознавать лица и открывать дверь автоматически.

---

## 🎯 Как работает распознавание

```
1. Камера захватывает кадр (30 FPS)
   ↓
2. Haar Cascade находит лицо (~80-150ms)
   ↓
3. LBPH модель распознаёт человека (~20-50ms)
   ↓
4. Проверка confidence < 70 (настраивается)
   ↓
5. Если распознан → Открыть дверь (GPIO ~5ms)
   ↓
6. Сохранить событие + снапшот
   ↓
7. Отправить в backend (или буфер если офлайн)
```

**Итого: 150-250ms от лица до открытия двери** ⚡

---

## 🔄 Офлайн режим

Agent полностью автономен:

### ✅ Работает без интернета:
- Распознавание лиц (локальная LBPH модель)
- Открытие двери (GPIO)
- Сохранение событий (SQLite буфер)
- Сохранение снапшотов (локальное хранилище)

### 🔄 При восстановлении связи:
1. Синхронизирует все события (batch)
2. Синхронизирует телеметрию (batch)
3. Получает pending команды
4. Обновляет модель если нужно

---

## 📚 Документация

### Backend
- [Backend README](../backend-service/README.md) - Общая информация
- [Backend SETUP](../backend-service/SETUP.md) - Установка и запуск
- [API Documentation](../backend-service/API_DOCUMENTATION.md) - Все 58 endpoints

### Agent
- [Agent README](../agent/README.md) - Полное руководство
- [Agent ARCHITECTURE](../agent/ARCHITECTURE.md) - Внутреннее устройство
- [Agent EXAMPLES](../agent/EXAMPLES.md) - Практические примеры

### Общие гайды
- [FaceGuard Guide](FaceGuard_Guide.md) - Полный гайд по системе

---

## 🛠️ Разработка

### Режим разработки (Windows/Mac/Linux)

**Backend:**
```bash
cd backend-service
docker-compose up --build
```

**Agent:**
```bash
cd agent
# В .env установить:
# HARDWARE_MODE=development
# BACKEND_URL=http://localhost:8000
docker-compose up --build
```

### Production (VPS + Raspberry Pi)

**Backend на VPS:**
```bash
# На VPS
cd backend-service
docker-compose up -d --build
```

**Agent на Raspberry Pi:**
```bash
# На Raspberry Pi
cd agent
# В .env установить:
# HARDWARE_MODE=raspberry_pi
# BACKEND_URL=http://VPS_IP:8000
docker-compose up -d --build
```

---

## 🔐 Безопасность

- ✅ JWT авторизация (30 минут)
- ✅ Роли: admin, superadmin
- ✅ SHA256 хеширование паролей
- ✅ Audit logs всех действий
- ✅ Device authentication
- ✅ Soft delete (trash/)

**Рекомендации:**
- Используй HTTPS для backend (Nginx + Let's Encrypt)
- Используй VPN/Tailscale для связи Agent ↔ Backend
- Не открывай backend напрямую в интернет без защиты
- Используй сильные пароли

---

## 📊 Backend API

### Основные группы:

| Группа | Endpoints | Описание |
|--------|-----------|----------|
| `/api/v1/auth` | 5 | Регистрация, вход, JWT |
| `/api/v1/people` | 5 | Управление людьми |
| `/api/v1/photos` | 6 | Фотографии людей |
| `/api/v1/devices` | 8 | Raspberry Pi устройства |
| `/api/v1/events` | 6 | События распознавания |
| `/api/v1/telemetry` | 5 | Телеметрия устройств |
| `/api/v1/commands` | 12 | Команды для Pi |
| `/api/v1/sync` | 3 | Офлайн синхронизация |
| `/api/v1/audit` | 5 | Audit logs |
| **Всего** | **58** | |

Полная документация: [API_DOCUMENTATION.md](../backend-service/API_DOCUMENTATION.md)

---

## 🔧 Troubleshooting

### Backend не запускается

```bash
cd backend-service
docker-compose down -v
docker-compose up -d --build
docker-compose logs -f backend
```

### Agent не подключается к backend

1. Проверь `BACKEND_URL` в `agent/.env`
2. Проверь что backend доступен: `curl http://BACKEND_IP:8000/api/v1/system/health`
3. Проверь firewall на сервере: `sudo ufw allow 8000`

### Камера не работает

```bash
# Raspberry Pi Camera
libcamera-hello

# USB Camera
ls /dev/video*

# В agent/.env попробуй другой индекс:
CAMERA_INDEX=1
```

### Распознавание не работает

1. Проверь наличие модели: `ls agent/data/models/`
2. Проверь фотографии: `ls agent/data/faces/*/processed/`
3. Переобучи модель: отправь команду `rebuild_model`

### Настройка точности

```env
# В agent/.env:
# Строже (меньше ложных допусков):
RECOGNITION_THRESHOLD=50

# Мягче (меньше отказов):
RECOGNITION_THRESHOLD=80
```

---

## 📈 Производительность

**Raspberry Pi 5:**
- Face detection: ~80-150ms
- Recognition: ~20-50ms
- Door trigger: ~5ms
- **Total: < 0.5 секунды** ⚡

**Рекомендации по threshold:**
- `40-60`: Строго (высокая безопасность)
- `60-80`: Сбалансировано (рекомендуется)
- `80-100`: Мягко (для тестирования)

---

## 🎉 Что реализовано

### ✅ Backend (backend-service/)
- 58 API endpoints
- 9 таблиц PostgreSQL
- JWT авторизация (admin/superadmin)
- CRUD для людей и фотографий
- Офлайн синхронизация (bulk events/telemetry)
- Command queue для устройств
- Audit logs
- Docker ready

### ✅ Agent (agent/)
- Модульная архитектура
- OpenCV LBPH распознавание (< 0.5 сек)
- Камера (picamera2 / OpenCV / simulated)
- GPIO сервопривод + mock
- SQLite офлайн буфер
- Автоматическая синхронизация
- Телеметрия (CPU/RAM/Temp)
- Command executor (11 команд)
- Event handler
- Docker ready

### 🚧 Optional future work
- [ ] React Admin Panel (frontend)
- [ ] WebSocket real-time события
- [ ] Video streaming (MJPEG/WebRTC)
- [ ] Backups API
- [ ] Email/Push уведомления

---

## 💡 Сетевая схема

### Типичная установка

```
Internet
   │
   └─> VPS / Home Server (192.168.1.100)
       └─> Backend (Port 8000)
           - FastAPI
           - PostgreSQL
   
Local Network (192.168.1.x)
   │
   └─> Raspberry Pi (192.168.1.200)
       └─> Agent
           - Camera
           - GPIO Door
           - HTTP → Backend (192.168.1.100:8000)
```

### С VPN (рекомендуется)

```
Backend Server              Raspberry Pi
     │                           │
     └─> Tailscale VPN ──────────┘
         (100.x.x.1)         (100.x.x.2)
         
Agent: BACKEND_URL=http://100.x.x.1:8000
```

Преимущества VPN:
- ✅ Безопасное соединение
- ✅ Не нужен белый IP
- ✅ Работает через NAT
- ✅ Шифрование трафика

---

## 📞 Поддержка

- Backend документация: [backend-service/README.md](../backend-service/README.md)
- Agent документация: [agent/README.md](../agent/README.md)
- API Reference: [backend-service/API_DOCUMENTATION.md](../backend-service/API_DOCUMENTATION.md)
- Примеры: [agent/EXAMPLES.md](../agent/EXAMPLES.md)

---

## 📝 Версии

- **Backend:** 0.1.0
- **Agent:** 1.0.0
- **Python:** 3.11+
- **PostgreSQL:** 16
- **OpenCV:** 4.10.0
- **FastAPI:** Latest

---

## 📄 Лицензия

Проект для личного использования.

---

**Дата обновления:** 2026-06-15  
**Автор:** FaceGuard Team

Made with ❤️ for smart home security
