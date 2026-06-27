# FaceGuard Agent - Примеры использования

> Практические сценарии работы с агентом

## 📋 Содержание

1. [Первоначальная настройка](#-первоначальная-настройка)
2. [Регистрация первого человека](#-регистрация-первого-человека)
3. [Добавление второго человека](#-добавление-второго-человека)
4. [Проверка работы распознавания](#-проверка-работы-распознавания)
5. [Настройка точности распознавания](#-настройка-точности-распознавания)
6. [Работа с командами](#-работа-с-командами)
7. [Мониторинг системы](#-мониторинг-системы)
8. [Восстановление после сбоя](#-восстановление-после-сбоя)

---

## 🎬 Первоначальная настройка

### Сценарий: Запуск системы с нуля

**Исходные данные:**
- Backend запущен на сервере 192.168.1.100:8000
- Raspberry Pi с установленным Docker
- Камера подключена

**Шаги:**

#### 1. Настроить backend

```bash
# На сервере с backend
cd backend-service
docker-compose up -d

# Создать первого администратора
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "SecurePass123!",
    "role": "superadmin"
  }'

# Получить токен
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "SecurePass123!"}' | jq -r '.access_token')

echo "JWT Token: $TOKEN"
```

#### 2. Зарегистрировать устройство в backend

```bash
# Создать устройство
curl -X POST http://192.168.1.100:8000/api/v1/devices/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Door Raspberry Pi",
    "device_code": "rpi-main-001"
  }'

# Ответ:
# {
#   "id": "550e8400-e29b-41d4-a716-446655440000",
#   "name": "Main Door Raspberry Pi",
#   "device_code": "rpi-main-001",
#   "status": "offline",
#   ...
# }

# Сохрани device_id!
DEVICE_ID="550e8400-e29b-41d4-a716-446655440000"
```

#### 3. Настроить agent на Raspberry Pi

```bash
# На Raspberry Pi
cd ~/FaceGuardV1/agent

# Создать .env
cat > .env << EOF
BACKEND_URL=http://192.168.1.100:8000
DEVICE_CODE=rpi-main-001
DEVICE_ID=$DEVICE_ID
HARDWARE_MODE=raspberry_pi
RECOGNITION_THRESHOLD=70
SERVO_GPIO_PIN=17
DOOR_OPEN_DURATION=5
ACTION_COOLDOWN_SECONDS=5
LOG_LEVEL=INFO
EOF

# Запустить agent
docker-compose up -d --build

# Проверить логи
docker-compose logs -f agent
```

#### 4. Проверить подключение

```bash
# Проверить, что agent online
curl http://192.168.1.100:8000/api/v1/devices/$DEVICE_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.status'

# Должно быть: "online"

# Проверить последний heartbeat
curl http://192.168.1.100:8000/api/v1/devices/$DEVICE_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.last_seen_at'
```

**Результат:** Agent запущен и подключён к backend ✅

---

## 👤 Регистрация первого человека

### Сценарий: Добавить владельца квартиры

**Исходные данные:**
- Agent работает и подключён
- Человек готов стоять перед камерой

**Шаги:**

#### 1. Создать запись человека

```bash
# Создать человека
PERSON_RESPONSE=$(curl -X POST http://192.168.1.100:8000/api/v1/people/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Иван Петров",
    "description": "Владелец квартиры",
    "access_enabled": true
  }')

echo $PERSON_RESPONSE | jq

# Ответ:
# {
#   "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
#   "name": "Иван Петров",
#   "description": "Владелец квартиры",
#   "access_enabled": true,
#   ...
# }

# Сохрани person_id!
PERSON_ID=$(echo $PERSON_RESPONSE | jq -r '.id')
echo "Person ID: $PERSON_ID"
```

#### 2. Сделать фотографии

```bash
# Отправить команду на фотографирование
curl -X POST http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"command_type\": \"capture_photos\",
    \"parameters\": \"{\\\"person_id\\\": \\\"$PERSON_ID\\\", \\\"count\\\": 15}\"
  }"

# Ответ:
# {
#   "id": "cmd-123...",
#   "status": "pending",
#   ...
# }
```

**Что происходит дальше:**

```
0-5 сек:  Agent получает команду через polling
5-12 сек: Agent делает 15 фотографий (интервал 0.5 сек)
          → Человек должен менять положение головы:
             1-3 фото: прямо
             4-6 фото: немного влево
             7-9 фото: немного вправо
             10-12 фото: немного вверх
             13-15 фото: немного вниз
12-15 сек: Agent обрабатывает фото (детекция лиц, ресайз)
15-20 сек: Agent сохраняет фото локально
20-25 сек: Agent отправляет результат в backend
```

#### 3. Проверить результат

```bash
# Проверить статус команды (подожди 30 секунд)
sleep 30

curl http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.command_type == "capture_photos") | .status'

# Должно быть: "completed"

# Посмотреть фотографии
curl http://192.168.1.100:8000/api/v1/people/$PERSON_ID/photos \
  -H "Authorization: Bearer $TOKEN" | jq

# На Raspberry Pi проверить файлы
ssh pi@raspberry-pi
ls -la ~/FaceGuardV1/data/faces/$PERSON_ID/original/
ls -la ~/FaceGuardV1/data/faces/$PERSON_ID/processed/

# Должно быть по 15 файлов в каждой папке
```

#### 4. Обучить модель

```bash
# Отправить команду на обучение
curl -X POST http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"command_type\": \"rebuild_model\",
    \"parameters\": \"{}\"
  }"

# Подожди 10-15 секунд
sleep 15

# Проверить статус
curl http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.command_type == "rebuild_model") | .status'

# Должно быть: "completed"

# Проверить модель на Pi
ssh pi@raspberry-pi
ls -la ~/FaceGuardV1/data/models/
# Должны быть: face_model.yml и labels.json
```

#### 5. Проверить работу распознавания

```bash
# Подойди к камере
# В логах agent должно появиться:
docker-compose -f ~/FaceGuardV1/agent/docker-compose.yml logs -f agent

# Логи:
# INFO - Person recognized: a1b2c3d4-... (confidence: 45.2)
# INFO - Opening door for 5 seconds...
# INFO - [GPIO] Servo moved to OPEN position
# INFO - Event created: recognized person a1b2c3d4-...
```

**Результат:** Первый человек зарегистрирован и распознаётся ✅

---

## 👥 Добавление второго человека

### Сценарий: Добавить члена семьи

Процесс аналогичен первому человеку:

```bash
# 1. Создать человека
PERSON2_RESPONSE=$(curl -X POST http://192.168.1.100:8000/api/v1/people/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Мария Петрова",
    "description": "Член семьи",
    "access_enabled": true
  }')

PERSON2_ID=$(echo $PERSON2_RESPONSE | jq -r '.id')

# 2. Сфотографировать
curl -X POST http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"command_type\": \"capture_photos\",
    \"parameters\": \"{\\\"person_id\\\": \\\"$PERSON2_ID\\\", \\\"count\\\": 15}\"
  }"

# Подожди выполнения
sleep 30

# 3. ПЕРЕОБУЧИТЬ модель (важно!)
curl -X POST http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"command_type\": \"rebuild_model\",
    \"parameters\": \"{}\"
  }"

sleep 15

echo "Второй человек добавлен!"
```

**Теперь agent распознаёт обоих людей.**

---

## 🔍 Проверка работы распознавания

### Сценарий: Тестирование системы

#### Проверка через события

```bash
# Посмотреть последние события
curl http://192.168.1.100:8000/api/v1/events/?limit=10 \
  -H "Authorization: Bearer $TOKEN" | jq

# Пример ответа:
# [
#   {
#     "id": "event-123...",
#     "person_id": "a1b2c3d4-...",
#     "event_type": "recognized",
#     "confidence": 45.2,
#     "door_opened": true,
#     "created_at": "2026-06-15T12:15:30Z"
#   }
# ]

# Фильтр по типу события
curl "http://192.168.1.100:8000/api/v1/events/?event_type=unknown" \
  -H "Authorization: Bearer $TOKEN" | jq

# Фильтр по человеку
curl "http://192.168.1.100:8000/api/v1/events/?person_id=$PERSON_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

#### Проверка через логи agent

```bash
# На Raspberry Pi
docker-compose logs --tail=50 agent | grep "recognized"

# Примеры:
# INFO - Person recognized: a1b2c3d4-... (confidence: 45.2)
# INFO - Person recognized: a1b2c3d4-... (confidence: 52.1)
# INFO - Unknown person detected (confidence: 85.3)
```

---

## 🎯 Настройка точности распознавания

### Сценарий: Слишком много ложных срабатываний

**Проблема:** Дверь открывается для незнакомых людей.

**Решение:** Понизить threshold (сделать строже).

```bash
# На Raspberry Pi
cd ~/FaceGuardV1/agent

# Изменить .env
nano .env
# Было: RECOGNITION_THRESHOLD=70
# Стало: RECOGNITION_THRESHOLD=50

# Перезапустить agent
docker-compose restart agent

# Проверить логи
docker-compose logs -f agent
```

**Эффект:**
- Меньше ложных допусков
- Возможно, больше отказов для знакомых людей (если плохое освещение)

### Сценарий: Слишком много отказов

**Проблема:** Дверь не открывается для знакомых людей.

**Решение:** Повысить threshold (сделать мягче).

```bash
# Изменить .env
# Было: RECOGNITION_THRESHOLD=50
# Стало: RECOGNITION_THRESHOLD=80

docker-compose restart agent
```

**Эффект:**
- Меньше отказов для знакомых
- Возможно, больше ложных допусков

### Таблица рекомендаций

| Threshold | Поведение | Использование |
|-----------|-----------|---------------|
| 30-40 | Очень строго | Высокая безопасность, мало людей |
| 40-60 | Строго | Рекомендуется для продакшена |
| 60-80 | Сбалансировано | По умолчанию, хорошо для семьи |
| 80-100 | Мягко | Для тестирования, много людей |

---

## 🎮 Работа с командами

### Ручное открытие двери

```bash
curl -X POST http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"command_type\": \"open_door\",
    \"parameters\": \"{\\\"duration\\\": 10}\"
  }"

# Дверь откроется на 10 секунд
```

### Перезагрузить модель (после обновления threshold)

```bash
curl -X POST http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"command_type\": \"reload_model\",
    \"parameters\": \"{}\"
  }"
```

### Перезапустить распознавание

```bash
curl -X POST http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"command_type\": \"restart_recognition\",
    \"parameters\": \"{}\"
  }"
```

### Перезагрузить Raspberry Pi

```bash
curl -X POST http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"command_type\": \"reboot_device\",
    \"parameters\": \"{\\\"delay\\\": 10}\"
  }"

# Перезагрузится через 10 секунд
```

---

## 📊 Мониторинг системы

### Проверка телеметрии

```bash
# Последняя телеметрия
curl http://192.168.1.100:8000/api/v1/telemetry/devices/$DEVICE_ID/latest \
  -H "Authorization: Bearer $TOKEN" | jq

# Ответ:
# {
#   "cpu_usage": 45.2,
#   "cpu_temperature": 55.3,
#   "ram_usage": 62.1,
#   "disk_usage": 35.8,
#   "uptime": 86400,
#   "camera_fps": 28.5,
#   "network_status": "online",
#   "created_at": "2026-06-15T12:15:00Z"
# }

# Статистика за 24 часа
curl "http://192.168.1.100:8000/api/v1/telemetry/devices/$DEVICE_ID/stats?hours=24" \
  -H "Authorization: Bearer $TOKEN" | jq

# История за последний час
curl "http://192.168.1.100:8000/api/v1/telemetry/devices/$DEVICE_ID?hours=1" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Проверка статуса устройства

```bash
curl http://192.168.1.100:8000/api/v1/devices/$DEVICE_ID \
  -H "Authorization: Bearer $TOKEN" | jq

# Важные поля:
# - status: "online" / "offline"
# - last_seen_at: последний heartbeat
# - camera_status: "ok" / "error"
# - recognition_status: "running" / "stopped"
```

---

## 🚑 Восстановление после сбоя

### Сценарий: Agent перестал отвечать

```bash
# 1. Проверить статус контейнера
ssh pi@raspberry-pi
cd ~/FaceGuardV1/agent
docker-compose ps

# Если контейнер не запущен:
docker-compose up -d

# Если запущен, но не работает:
docker-compose restart agent

# 2. Посмотреть логи
docker-compose logs --tail=100 agent

# 3. Если проблема с камерой:
# Проверить камеру
ls /dev/video*
# Перезагрузить Pi
sudo reboot

# 4. Если проблема с моделью:
# Пересоздать модель
curl -X POST http://192.168.1.100:8000/api/v1/commands/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"command_type\": \"rebuild_model\",
    \"parameters\": \"{}\"
  }"
```

### Сценарий: Офлайн буфер переполнен

```bash
# Проверить размер SQLite базы
ssh pi@raspberry-pi
du -sh ~/FaceGuardV1/data/agent.db

# Если > 100MB, очистить вручную:
docker exec -it faceguard_agent bash
cd /app/data
sqlite3 agent.db

# Посмотреть количество несинхронизированных записей
SELECT COUNT(*) FROM events WHERE synced = 0;
SELECT COUNT(*) FROM telemetry WHERE synced = 0;

# Удалить старые синхронизированные (старше 7 дней)
DELETE FROM events WHERE synced = 1 
  AND synced_at < datetime('now', '-7 days');
DELETE FROM telemetry WHERE synced = 1 
  AND synced_at < datetime('now', '-7 days');

.exit
exit

# Перезапустить agent для синхронизации
docker-compose restart agent
```

### Сценарий: Backend недоступен длительное время

**Agent продолжает работать офлайн:**

```bash
# На Raspberry Pi посмотреть офлайн события
ssh pi@raspberry-pi
cd ~/FaceGuardV1/agent
docker exec -it faceguard_agent bash

sqlite3 /app/data/agent.db
SELECT COUNT(*) FROM events WHERE synced = 0;
# Покажет количество накопленных событий

SELECT * FROM events WHERE synced = 0 ORDER BY created_at DESC LIMIT 5;
# Покажет последние 5 событий
.exit
exit

# Когда backend станет доступен, agent автоматически синхронизирует все события
```

---

## 💡 Полезные команды

### Быстрая диагностика

```bash
# Скрипт для проверки всей системы
#!/bin/bash

echo "=== FaceGuard System Status ==="

# Backend
echo -n "Backend: "
curl -s http://192.168.1.100:8000/api/v1/system/health > /dev/null && echo "✓ OK" || echo "✗ FAIL"

# Agent
echo -n "Agent: "
ssh pi@raspberry-pi "docker-compose -f ~/FaceGuardV1/agent/docker-compose.yml ps -q agent" > /dev/null && echo "✓ Running" || echo "✗ Stopped"

# Device status
echo -n "Device status: "
curl -s http://192.168.1.100:8000/api/v1/devices/$DEVICE_ID \
  -H "Authorization: Bearer $TOKEN" | jq -r '.status'

# Model trained
echo -n "Model trained: "
ssh pi@raspberry-pi "test -f ~/FaceGuardV1/data/models/face_model.yml" && echo "✓ Yes" || echo "✗ No"

# People count
echo -n "Registered people: "
curl -s http://192.168.1.100:8000/api/v1/people/ \
  -H "Authorization: Bearer $TOKEN" | jq '. | length'

# Recent events
echo "Recent events:"
curl -s http://192.168.1.100:8000/api/v1/events/?limit=5 \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[] | "\(.created_at) - \(.event_type) - confidence: \(.confidence)"'
```

---

**Версия:** 1.0.0  
**Обновлено:** 2026-06-15
