# FaceGuard Raspberry Pi Agent - Полное руководство

> Автономный агент для распознавания лиц и управления дверью на Raspberry Pi

## 📋 Содержание

1. [Что это](#что-это)
2. [Как это работает](#как-это-работает)
3. [Быстрый старт](#быстрый-старт)
4. [Установка и настройка](#установка-и-настройка)
5. [Запуск в режиме разработки](#запуск-в-режиме-разработки)
6. [Запуск на Raspberry Pi](#запуск-на-raspberry-pi)
7. [Регистрация нового человека](#регистрация-нового-человека)
8. [Работа офлайн режима](#работа-офлайн-режима)
9. [Мониторинг и логи](#мониторинг-и-логи)
10. [Troubleshooting](#troubleshooting)

---

## 📖 Что это

FaceGuard Agent — это Python-приложение, которое запускается на Raspberry Pi и выполняет:

- **Захват видео** с камеры (picamera2 или USB веб-камеры)
- **Распознавание лиц** через OpenCV LBPH (< 0.5 сек)
- **Автоматическое открытие двери** через GPIO сервопривод
- **Офлайн работу** — все функции доступны без интернета
- **Синхронизацию с backend** — отправка событий и получение команд
- **Телеметрию** — мониторинг CPU, RAM, температуры Pi

**Agent работает автономно** — даже если backend недоступен, распознавание и открытие двери продолжают работать.

---

## 🎯 Как это работает

### Общая схема

```
┌─────────────────────────────────────────────────────┐
│              Raspberry Pi Agent                     │
│                                                     │
│  ┌──────────┐    ┌─────────────┐    ┌──────────┐  │
│  │  Camera  │ -> │ Recognition │ -> │   Door   │  │
│  │ Service  │    │    Loop     │    │Controller│  │
│  └──────────┘    └─────────────┘    └──────────┘  │
│       │                  │                 │        │
│       │                  │                 │        │
│       v                  v                 v        │
│  ┌──────────────────────────────────────────────┐  │
│  │         Event Handler + SQLite Buffer       │  │
│  └──────────────────────────────────────────────┘  │
│                       │                            │
│                       v                            │
│  ┌──────────────────────────────────────────────┐  │
│  │          Sync Manager (online/offline)       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │ HTTP REST API
                      v
┌─────────────────────────────────────────────────────┐
│          Backend Service (на другом сервере)        │
│     PostgreSQL + API + Commands + Events            │
└─────────────────────────────────────────────────────┘
```

### Основные компоненты

#### 1. **Camera Service** (`camera/camera_service.py`)
- Непрерывно захватывает кадры (30 FPS)
- Поддерживает picamera2 (Raspberry Pi Camera) или OpenCV (USB камера)
- Симулированная камера для тестирования без физической камеры

#### 2. **Recognition Service** (`recognition/recognizer.py`)
- Использует **OpenCV LBPH** (Local Binary Patterns Histograms)
- Обучается на фотографиях из `data/faces/{person_id}/processed/`
- Распознаёт лица с confidence < 70 (настраивается)
- Сохраняет модель в `data/models/face_model.yml`

#### 3. **Recognition Loop** (`recognition/recognition_loop.py`)
- Фоновый поток, который постоянно анализирует кадры
- При обнаружении лица → распознаёт → принимает решение
- Cooldown 5 секунд для одного человека (избегает повторных срабатываний)

#### 4. **Door Controller** (`door/door_controller.py`)
- Управляет GPIO сервоприводом на Raspberry Pi
- Mock-режим для разработки на Windows/Mac
- Открывает дверь на 5 секунд (настраивается)

#### 5. **Sync Manager** (`sync/sync_manager.py`)
- Проверяет подключение к backend каждые 60 секунд
- Если online → отправляет события и телеметрию сразу
- Если offline → буферизует в SQLite (`data/agent.db`)
- При восстановлении связи → синхронизирует все накопленные данные

#### 6. **Command Poller** (`commands/command_poller.py`)
- Опрашивает backend каждые 5 секунд на наличие команд
- Выполняет команды через Command Executor
- Отправляет результат обратно в backend

---

## 🚀 Быстрый старт

### Минимальная настройка для тестирования

```bash
# 1. Перейти в папку agent
cd agent

# 2. Создать файл конфигурации
cp .env.example .env

# 3. Отредактировать .env
# Минимум нужно указать:
# BACKEND_URL=http://IP_АДРЕС_BACKEND:8000
# DEVICE_CODE=rpi-main-001
# HARDWARE_MODE=development

# 4. Запустить через Docker
docker-compose up --build
```

**Готово!** Agent запущен и ждёт команд от backend.

---

## 🛠️ Установка и настройка

### Предварительные требования

**Для Raspberry Pi:**
- Raspberry Pi 3/4/5 с Raspberry Pi OS (64-bit рекомендуется)
- Python 3.11+
- Camera Module или USB веб-камера
- Сервопривод на GPIO pin 17 (по умолчанию)
- Docker (опционально, но рекомендуется)

**Для разработки (Windows/Mac/Linux):**
- Python 3.11+
- Docker Desktop
- USB веб-камера (опционально)

### Шаг 1: Клонирование и настройка

```bash
# Клонировать проект
git clone <your-repo>
cd FaceGuardV1/agent

# Создать .env файл
cp .env.example .env
```

### Шаг 2: Настройка .env

Открой файл `.env` и настрой параметры:

```env
# ============================================
# BACKEND CONNECTION (ОБЯЗАТЕЛЬНО!)
# ============================================
# URL backend сервиса (укажи IP адрес сервера где запущен backend)
BACKEND_URL=http://192.168.1.100:8000

# Уникальный код устройства (должен совпадать с backend)
DEVICE_CODE=rpi-main-001

# ID устройства (будет получен автоматически после регистрации)
DEVICE_ID=

# ============================================
# HARDWARE MODE
# ============================================
# development - для тестирования на Windows/Mac/Linux
# raspberry_pi - для работы на Raspberry Pi с реальным GPIO
HARDWARE_MODE=development

# ============================================
# CAMERA SETTINGS
# ============================================
CAMERA_INDEX=0          # Индекс камеры (0 = первая камера)
CAMERA_WIDTH=640        # Разрешение
CAMERA_HEIGHT=480
CAMERA_FPS=30           # Кадры в секунду

# ============================================
# RECOGNITION SETTINGS
# ============================================
# Порог распознавания (чем ниже - тем строже)
# 40-50: очень строго (почти нет ложных допусков)
# 50-70: рекомендуемый диапазон
# 70-100: мягко (больше ложных допусков)
RECOGNITION_THRESHOLD=70

# Минимальный размер лица для детекции (пиксели)
MIN_FACE_SIZE=80

# Параметры Haar Cascade
FACE_SCALE_FACTOR=1.2
FACE_MIN_NEIGHBORS=5

# ============================================
# DOOR CONTROL
# ============================================
# GPIO пин для сервопривода (BCM нумерация)
SERVO_GPIO_PIN=17

# Сколько секунд дверь остаётся открытой
DOOR_OPEN_DURATION=5

# Cooldown между повторными открытиями для одного человека (сек)
ACTION_COOLDOWN_SECONDS=5

# ============================================
# SYNC INTERVALS
# ============================================
HEARTBEAT_INTERVAL=10      # Heartbeat каждые N секунд
TELEMETRY_INTERVAL=30      # Телеметрия каждые N секунд
SYNC_INTERVAL=60           # Проверка синхронизации каждые N секунд
COMMAND_POLL_INTERVAL=5    # Опрос команд каждые N секунд

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

**Важные параметры:**

| Параметр | Описание | Пример |
|----------|----------|--------|
| `BACKEND_URL` | URL backend сервиса | `http://192.168.1.100:8000` |
| `DEVICE_CODE` | Уникальный код устройства | `rpi-main-001` |
| `HARDWARE_MODE` | Режим работы | `development` или `raspberry_pi` |
| `RECOGNITION_THRESHOLD` | Порог распознавания | `70` |

---

## 💻 Запуск в режиме разработки

Режим разработки (`HARDWARE_MODE=development`) используется для тестирования на обычном компьютере (Windows/Mac/Linux) без Raspberry Pi.

**Что работает в режиме разработки:**
- ✅ Захват с веб-камеры или симулированная камера
- ✅ Распознавание лиц
- ✅ Mock-дверь (логирование вместо GPIO)
- ✅ Синхронизация с backend
- ✅ Все команды (кроме reboot)

### Вариант 1: Docker (рекомендуется)

```bash
cd agent

# Создать .env
cp .env.example .env
# Отредактировать .env:
# - BACKEND_URL=http://localhost:8000  (если backend на том же компьютере)
# - HARDWARE_MODE=development

# Запустить
docker-compose up --build

# В отдельном терминале смотреть логи
docker-compose logs -f agent
```

### Вариант 2: Без Docker (Python напрямую)

```bash
cd agent

# Создать виртуальное окружение
python -m venv venv

# Активировать (Windows)
venv\Scripts\activate

# Активировать (Linux/Mac)
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt

# Запустить
python main.py
```

**Проверка работы:**

```bash
# Логи должны показывать:
# - "Agent initialized successfully"
# - "Camera started"
# - "Sync manager started"
# - "FaceGuard Agent is running"
```

---

## 🍓 Запуск на Raspberry Pi

### Подготовка Raspberry Pi

```bash
# 1. Обновить систему
sudo apt update && sudo apt upgrade -y

# 2. Установить Docker (если ещё не установлен)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Перелогиниться после добавления в группу docker

# 3. Установить Docker Compose
sudo apt install docker-compose -y

# 4. Клонировать проект
cd ~
git clone <your-repo>
cd FaceGuardV1/agent
```

### Настройка для Raspberry Pi

```bash
# Создать .env
cp .env.example .env

# Отредактировать .env:
nano .env
```

Установи параметры:

```env
BACKEND_URL=http://192.168.1.100:8000  # IP твоего backend сервера
DEVICE_CODE=rpi-main-001
HARDWARE_MODE=raspberry_pi  # ВАЖНО!
SERVO_GPIO_PIN=17  # Проверь подключение
```

### Запуск

```bash
# Запустить в фоне
docker-compose up -d --build

# Проверить статус
docker-compose ps

# Логи
docker-compose logs -f agent

# Остановить
docker-compose down

# Перезапустить
docker-compose restart agent
```

### Автозапуск при перезагрузке

Docker Compose уже настроен с `restart: unless-stopped`, поэтому agent автоматически запустится после перезагрузки Pi.

Проверка:

```bash
# Перезагрузить Pi
sudo reboot

# После загрузки проверить
docker-compose ps
```

---

## 👤 Регистрация нового человека

Для того чтобы agent мог распознавать человека, нужно:

1. Создать запись человека в backend
2. Сделать 10-30 фотографий этого человека
3. Обучить модель распознавания

### Шаг 1: Создать человека в backend

```bash
# Получить JWT токен
curl -X POST http://192.168.1.100:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your_password"}'

# Создать человека
curl -X POST http://192.168.1.100:8000/api/v1/people/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Иван Иванов",
    "description": "Житель квартиры",
    "access_enabled": true
  }'

# Запомни person_id из ответа!
```

### Шаг 2: Зарегистрировать устройство

```bash
# Создать устройство в backend
curl -X POST http://192.168.1.100:8000/api/v1/devices/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raspberry Pi - Главный вход",
    "device_code": "rpi-main-001"
  }'

# Запомни device_id из ответа!
```

### Шаг 3: Сделать фотографии через камеру

```bash
# Отправить команду capture_photos
curl -X POST http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "DEVICE_UUID",
    "command_type": "capture_photos",
    "parameters": "{\"person_id\": \"PERSON_UUID\", \"count\": 15}"
  }'
```

**Что происходит:**
1. Backend создаёт команду и сохраняет её в БД
2. Agent через 5 секунд получает команду (polling)
3. Agent делает 15 фотографий с интервалом 0.5 сек
4. Для каждого фото:
   - Сохраняет оригинал в `data/faces/{person_id}/original/`
   - Находит лицо через Haar Cascade
   - Вырезает лицо, конвертирует в grayscale, ресайзит до 200x200
   - Сохраняет в `data/faces/{person_id}/processed/`
5. Agent отправляет результат в backend

**Важно:** Человек должен стоять перед камерой и менять положение головы (прямо, влево, вправо, вверх, вниз) для лучшей точности.

### Шаг 4: Обучить модель

```bash
# Отправить команду rebuild_model
curl -X POST http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "DEVICE_UUID",
    "command_type": "rebuild_model",
    "parameters": "{}"
  }'
```

**Что происходит:**
1. Agent получает команду
2. Сканирует все папки в `data/faces/`
3. Загружает все обработанные фото из `processed/`
4. Обучает LBPH модель на всех фотографиях
5. Сохраняет модель в `data/models/face_model.yml`
6. Сохраняет маппинг меток в `data/models/labels.json`
7. Перезагружает модель в память
8. Отправляет результат в backend

### Шаг 5: Проверка

После обучения модели agent автоматически начнёт распознавать лица.

**Проверь логи:**

```bash
docker-compose logs -f agent

# Должны появиться записи:
# "Person recognized: {person_id} (confidence: 45.2)"
# "Opening door for 5 seconds..."
# "Event created: recognized person {person_id}"
```

---

## 🔌 Работа офлайн режима

Agent полностью автономен и работает без подключения к backend.

### Что работает офлайн

✅ **Распознавание лиц** - использует локальную LBPH модель  
✅ **Открытие двери** - GPIO не требует сети  
✅ **Сохранение событий** - буферизация в SQLite  
✅ **Сохранение снапшотов** - локальное хранилище  
✅ **Телеметрия** - накапливается локально  

### Что не работает офлайн

❌ Получение новых команд от backend  
❌ Обновление модели при добавлении новых людей  
❌ Просмотр событий в реальном времени в админ-панели  

### Как работает синхронизация

```
┌────────────────────────────────────────────────────┐
│  Agent работает онлайн                             │
│  - События отправляются сразу в backend            │
│  - Команды получаются каждые 5 секунд             │
└────────────────────────────────────────────────────┘
                     ↓
         Интернет пропал / Backend недоступен
                     ↓
┌────────────────────────────────────────────────────┐
│  Agent переходит в офлайн режим                    │
│  - Распознавание продолжает работать               │
│  - События сохраняются в SQLite (agent.db)         │
│  - Телеметрия накапливается локально               │
│  - Каждые 60 сек проверяет доступность backend    │
└────────────────────────────────────────────────────┘
                     ↓
         Интернет восстановился
                     ↓
┌────────────────────────────────────────────────────┐
│  Agent переходит обратно в онлайн режим            │
│  1. Синхронизирует все накопленные события (bulk)  │
│  2. Синхронизирует телеметрию (bulk)               │
│  3. Получает pending команды                       │
│  4. Обновляет модель если были изменения           │
└────────────────────────────────────────────────────┘
```

### Мониторинг офлайн буфера

```bash
# Подключиться к контейнеру
docker exec -it faceguard_agent bash

# Проверить SQLite базу
cd data
sqlite3 agent.db

# Посмотреть несинхронизированные события
SELECT * FROM events WHERE synced = 0;

# Посмотреть несинхронизированную телеметрию
SELECT * FROM telemetry WHERE synced = 0;

# Выйти
.exit
exit
```

---

## 📊 Мониторинг и логи

### Просмотр логов

```bash
# Все логи agent
docker-compose logs -f agent

# Последние 100 строк
docker-compose logs --tail=100 agent

# Логи с определённого времени
docker-compose logs --since 30m agent
```

### Статус agent

```bash
# Проверить запущен ли контейнер
docker-compose ps

# Должно быть:
# NAME                 STATUS
# faceguard_agent      Up X minutes
```

### Телеметрия

Agent отправляет телеметрию каждые 30 секунд:

```json
{
  "device_id": "uuid",
  "cpu_usage": 34.5,
  "cpu_temperature": 52.3,
  "ram_usage": 61.0,
  "disk_usage": 45.2,
  "uptime": 86400,
  "camera_fps": 30.0,
  "network_status": "online",
  "recognition_running": true
}
```

Проверить через backend:

```bash
curl http://192.168.1.100:8000/api/v1/telemetry/devices/{device_id}/latest \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Файлы логов

Логи также сохраняются в файл:

```bash
# На хосте
cat data/logs/agent.log

# Внутри контейнера
docker exec faceguard_agent cat /app/data/logs/agent.log
```

---

## 🔧 Troubleshooting

### 1. Agent не может подключиться к backend

**Симптомы:**
```
ERROR - Failed to send heartbeat: ConnectError
WARNING - Backend connection lost - entering offline mode
```

**Решение:**
1. Проверь, что backend запущен:
   ```bash
   curl http://192.168.1.100:8000/api/v1/system/health
   ```

2. Проверь `BACKEND_URL` в `.env`:
   ```env
   # Должен быть IP адрес, а не localhost!
   BACKEND_URL=http://192.168.1.100:8000
   ```

3. Проверь firewall на сервере с backend:
   ```bash
   # На сервере с backend
   sudo ufw allow 8000
   ```

### 2. Камера не найдена

**Симптомы:**
```
WARNING - picamera2 not available, falling back to OpenCV
ERROR - Failed to open camera at index 0
INFO - Falling back to simulated camera
```

**Решение для Raspberry Pi Camera:**
```bash
# Проверить подключение камеры
libcamera-hello

# Если не работает:
sudo raspi-config
# Interface Options → Camera → Enable

# Перезагрузить
sudo reboot
```

**Решение для USB камеры:**
```bash
# Проверить устройство
ls /dev/video*

# Если камера на /dev/video1:
# В .env изменить:
CAMERA_INDEX=1
```

### 3. Распознавание не работает

**Симптомы:**
```
WARNING - Model not trained, cannot recognize
```

**Решение:**
1. Проверь наличие модели:
   ```bash
   ls -la data/models/
   # Должны быть: face_model.yml и labels.json
   ```

2. Проверь наличие фотографий:
   ```bash
   ls -la data/faces/
   # Должны быть папки с person_id
   ```

3. Обучи модель через команду `rebuild_model`

### 4. Слишком много ложных распознаваний

**Симптомы:**
- Дверь открывается для незнакомых людей
- В логах много событий "recognized" с высоким confidence (> 80)

**Решение:**
```env
# Понизить threshold в .env
RECOGNITION_THRESHOLD=50  # Было 70, теперь строже
```

### 5. Слишком много отказов в распознавании

**Симптомы:**
- Дверь не открывается для знакомых людей
- В логах события "unknown" с низким confidence (< 60)

**Решение:**
```env
# Повысить threshold в .env
RECOGNITION_THRESHOLD=80  # Было 70, теперь мягче
```

### 6. Дверь не открывается

**Симптомы (development mode):**
```
INFO - [MOCK] Door opened for 5 seconds
```
Это нормально для режима разработки.

**Симптомы (raspberry_pi mode):**
```
ERROR - Failed to open door: ...
```

**Решение:**
1. Проверь GPIO подключение:
   ```bash
   # Тестовая команда
   echo "17" > /sys/class/gpio/export
   ```

2. Проверь питание сервопривода (нужен внешний источник 5V)

3. Проверь пин в .env:
   ```env
   SERVO_GPIO_PIN=17  # BCM нумерация
   ```

4. Установи pigpio для стабильного PWM:
   ```bash
   sudo apt install pigpio
   sudo systemctl enable pigpiod
   sudo systemctl start pigpiod
   ```

### 7. Высокая нагрузка на CPU

**Симптомы:**
```
CPU: 95.0%
camera_fps: 10.0  # Вместо 30
```

**Решение:**
1. Понизь FPS камеры:
   ```env
   CAMERA_FPS=15  # Было 30
   ```

2. Увеличь разрешение для детекции:
   ```env
   MIN_FACE_SIZE=100  # Было 80
   ```

3. Используй более мощную Pi (Pi 4/5 вместо Pi 3)

### 8. Переполнение диска

**Симптомы:**
```
ERROR - No space left on device
```

**Решение:**
```bash
# Проверить место
df -h

# Очистить старые логи
rm -rf data/logs/*.log.*

# Очистить старые события (оставить последние 7 дней)
find data/events/ -type f -mtime +7 -delete

# Очистить SQLite базу от старых записей
# (agent делает это автоматически каждые 30 дней)
```

---

## 📚 Дополнительные ресурсы

- [Backend API Documentation](../backend-service/API_DOCUMENTATION.md)
- [Backend Setup Guide](../backend-service/SETUP.md)
- [FaceGuard Full Guide](../FaceGuard_Guide.md)

---

## 🎯 Чеклист быстрого старта

- [ ] Backend запущен и доступен
- [ ] Создан .env файл с правильным BACKEND_URL
- [ ] DEVICE_CODE соответствует устройству в backend
- [ ] Agent запущен (`docker-compose up -d`)
- [ ] В логах нет ошибок подключения
- [ ] Создан тестовый человек в backend
- [ ] Сделаны фотографии (команда capture_photos)
- [ ] Модель обучена (команда rebuild_model)
- [ ] Проверено распознавание (подойти к камере)
- [ ] Дверь открывается при распознавании

---

**Версия:** 1.0.0  
**Дата:** 2026-06-15  
**Python:** 3.11+  
**OpenCV:** 4.10.0
