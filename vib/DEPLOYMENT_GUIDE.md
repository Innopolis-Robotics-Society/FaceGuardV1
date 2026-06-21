# FaceGuard - Руководство по развёртыванию

> Полное руководство по установке Backend на VPS и Agent на Raspberry Pi

**Дата:** 2026-06-15  
**Архитектура:** Backend (VPS) + Agent (Raspberry Pi) в разных сетях

---

## 📐 Архитектура системы

```
Internet
    │
    ├─> VPS Server (Публичный IP: YOUR_VPS_IP)
    │   └─> Backend (порт 8000)
    │       ├─ FastAPI
    │       ├─ PostgreSQL
    │       └─ 58 REST API endpoints
    │
    └─> Домашняя сеть (192.168.x.x)
        └─> Raspberry Pi (локальный IP)
            └─> Agent
                ├─ Отправляет HTTP → VPS:8000
                ├─ Камера (picamera2/USB)
                ├─ GPIO сервопривод
                └─ Автономная работа + офлайн буфер
```

**Важно:** Backend и Agent работают на **разных устройствах** и могут находиться в **разных сетях**.

---

## 🚀 Часть 1: Установка Backend на VPS

### Шаг 1.1: Подготовка VPS

**Требования:**
- Ubuntu 20.04+ / Debian 11+
- Минимум 1GB RAM
- 10GB свободного места
- Docker + Docker Compose

```bash
# Подключись к VPS по SSH
ssh root@YOUR_VPS_IP

# Обновить систему
apt update && apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установить Docker Compose
apt install -y docker-compose

# Проверить установку
docker --version
docker-compose --version
```

### Шаг 1.2: Клонирование проекта

```bash
# Создать директорию для проекта
mkdir -p /opt/faceguard
cd /opt/faceguard

# Клонировать репозиторий
git clone <your-repo-url> .

# Или загрузить через SCP/FTP
```

### Шаг 1.3: Настройка Backend

```bash
cd /opt/faceguard/backend-service

# Проверить docker-compose.yml
cat docker-compose.yml

# Убедись что порты открыты наружу:
# ports:
#   - "8000:8000"  # ← Должно быть так!
```

**Опционально: Создать .env для кастомных настроек**

```bash
nano .env

# Содержимое (опционально):
DATABASE_URL=postgresql://faceguard:faceguard@db:5432/faceguard
APP_ENV=production
SECRET_KEY=your-super-secret-key-change-me
```

### Шаг 1.4: Запуск Backend

```bash
# Запустить Backend + PostgreSQL
docker-compose up -d --build

# Проверить статус
docker-compose ps

# Должно быть:
# faceguard_backend    Up
# faceguard_db         Up

# Посмотреть логи
docker-compose logs -f backend
# Должно быть: "Application startup complete"
# Ctrl+C для выхода
```

### Шаг 1.5: Настройка Firewall

```bash
# Открыть порт 8000
ufw allow 8000/tcp

# Проверить статус
ufw status

# Проверить что порт слушается
netstat -tulpn | grep 8000

# Должно быть:
# tcp  0  0.0.0.0:8000  0.0.0.0:*  LISTEN  ...
```

### Шаг 1.6: Проверка Backend

```bash
# На самом VPS:
curl http://localhost:8000/api/v1/system/health
# Должно вернуть: {"status":"healthy"}

# С внешнего компьютера (замени IP):
curl http://YOUR_VPS_IP:8000/api/v1/system/health
# Также должно вернуть: {"status":"healthy"}

# Проверить Swagger UI:
# Открой в браузере: http://YOUR_VPS_IP:8000/docs
```

### Шаг 1.7: Создание первого администратора

```bash
# Создать superadmin
curl -X POST http://YOUR_VPS_IP:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "ВАШ_СИЛЬНЫЙ_ПАРОЛЬ",
    "role": "superadmin"
  }'

# Получить JWT токен
curl -X POST http://YOUR_VPS_IP:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "ВАШ_СИЛЬНЫЙ_ПАРОЛЬ"
  }'

# Скопируй access_token из ответа!
# Сохрани его как JWT_TOKEN
```

✅ **Backend на VPS готов!**

---

## 🍓 Часть 2: Установка Agent на Raspberry Pi

### Шаг 2.1: Подготовка Raspberry Pi

**Требования:**
- Raspberry Pi 3/4/5
- Raspberry Pi OS (64-bit рекомендуется)
- Docker + Docker Compose
- Камера (Raspberry Pi Camera Module или USB)
- Сервопривод на GPIO (опционально)

```bash
# Подключись к Raspberry Pi
ssh pi@raspberry-pi-ip

# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавить пользователя в группу docker
sudo usermod -aG docker $USER

# Перелогиниться
exit
ssh pi@raspberry-pi-ip

# Установить Docker Compose
sudo apt install -y docker-compose

# Проверить
docker --version
docker-compose --version
```

### Шаг 2.2: Клонирование проекта

```bash
# Создать директорию
cd ~
git clone <your-repo-url> FaceGuardV1

# Или загрузить через SCP
```

### Шаг 2.3: Настройка Agent

```bash
cd ~/FaceGuardV1/agent

# Создать .env из примера
cp .env.example .env

# Отредактировать конфигурацию
nano .env
```

**Содержимое `.env` для Raspberry Pi:**

```env
# ============================================
# BACKEND CONNECTION (ОБЯЗАТЕЛЬНО!)
# ============================================
# Публичный IP или домен вашего VPS
BACKEND_URL=http://YOUR_VPS_IP:8000

# Или если есть домен:
# BACKEND_URL=http://faceguard.yourdomain.com:8000

# Или через Tailscale VPN (рекомендуется):
# BACKEND_URL=http://100.x.x.1:8000

# ============================================
# DEVICE SETTINGS
# ============================================
# Уникальный код устройства (придумай свой)
DEVICE_CODE=rpi-home-main-001

# ID устройства (заполнится после регистрации)
DEVICE_ID=

# ============================================
# HARDWARE MODE
# ============================================
# Для Raspberry Pi всегда указывай:
HARDWARE_MODE=raspberry_pi

# ============================================
# CAMERA SETTINGS
# ============================================
# Индекс камеры (обычно 0)
CAMERA_INDEX=0
CAMERA_WIDTH=640
CAMERA_HEIGHT=480
CAMERA_FPS=30

# ============================================
# RECOGNITION SETTINGS
# ============================================
# Порог распознавания (чем ниже - тем строже)
# Рекомендуется: 60-70 для баланса
RECOGNITION_THRESHOLD=70

# Минимальный размер лица (пиксели)
MIN_FACE_SIZE=80

# Параметры детекции Haar Cascade
FACE_SCALE_FACTOR=1.2
FACE_MIN_NEIGHBORS=5

# ============================================
# DOOR CONTROL
# ============================================
# GPIO пин для сервопривода (BCM нумерация)
SERVO_GPIO_PIN=17

# Время открытия двери (секунды)
DOOR_OPEN_DURATION=5

# Cooldown между срабатываниями (секунды)
ACTION_COOLDOWN_SECONDS=5

# ============================================
# SYNC INTERVALS (секунды)
# ============================================
HEARTBEAT_INTERVAL=10       # Heartbeat каждые N сек
TELEMETRY_INTERVAL=30       # Телеметрия каждые N сек
SYNC_INTERVAL=60            # Проверка синхронизации каждые N сек
COMMAND_POLL_INTERVAL=5     # Опрос команд каждые N сек

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```

**Сохрани:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 2.4: Проверка камеры

```bash
# Для Raspberry Pi Camera Module:
libcamera-hello --list-cameras

# Если не работает:
sudo raspi-config
# Interface Options → Camera → Enable
sudo reboot

# Для USB камеры:
ls /dev/video*
# Должно показать /dev/video0 или /dev/video1

# Если камера на video1, в .env измени:
# CAMERA_INDEX=1
```

### Шаг 2.5: Запуск Agent

```bash
cd ~/FaceGuardV1/agent

# Запустить Agent
docker-compose up -d --build

# Проверить статус
docker-compose ps

# Должно быть:
# faceguard_agent    Up

# Посмотреть логи
docker-compose logs -f agent

# Должно быть:
# - "Agent initialized successfully"
# - "Camera started"
# - "Sync manager started"
# - "FaceGuard Agent is running"
# - НЕ должно быть ошибок подключения к backend
# Ctrl+C для выхода
```

✅ **Agent на Raspberry Pi запущен!**

---

## 🔗 Часть 3: Связь Backend ↔ Agent

### Шаг 3.1: Регистрация устройства

**С любого компьютера с доступом в интернет:**

```bash
# Установи переменные
VPS_IP="YOUR_VPS_IP"
JWT_TOKEN="your-jwt-token-from-step-1.7"

# Зарегистрировать устройство
curl -X POST http://$VPS_IP:8000/api/v1/devices/ \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Home Main Door - Raspberry Pi",
    "device_code": "rpi-home-main-001"
  }' | jq

# Скопируй "id" из ответа - это твой DEVICE_ID!
# Пример: "550e8400-e29b-41d4-a716-446655440000"
```

### Шаг 3.2: Добавление DEVICE_ID в Agent

```bash
# На Raspberry Pi:
nano ~/FaceGuardV1/agent/.env

# Найди строку:
# DEVICE_ID=

# Измени на:
DEVICE_ID=550e8400-e29b-41d4-a716-446655440000

# Сохрани: Ctrl+O, Enter, Ctrl+X

# Перезапусти agent
docker-compose restart agent
```

### Шаг 3.3: Проверка подключения

```bash
# Проверь статус устройства
curl http://$VPS_IP:8000/api/v1/devices/$DEVICE_ID \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# Обрати внимание на:
# - "status": "online" (должно быть online!)
# - "last_seen_at": недавняя дата (< 20 сек назад)
# - "camera_status": "ok"
# - "recognition_status": "stopped" (пока модель не обучена)
```

**Если status = "offline":**
- Проверь BACKEND_URL в agent/.env
- Проверь firewall на VPS (ufw allow 8000)
- Проверь логи agent: `docker-compose logs agent`

✅ **Agent подключён к Backend!**

---

## 👤 Часть 4: Регистрация первого человека

### Шаг 4.1: Создать человека

```bash
# Создать запись человека
PERSON_RESPONSE=$(curl -X POST http://$VPS_IP:8000/api/v1/people/ \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Иван Петров",
    "description": "Владелец дома",
    "access_enabled": true
  }')

echo $PERSON_RESPONSE | jq

# Скопируй person_id
PERSON_ID=$(echo $PERSON_RESPONSE | jq -r '.id')
echo "Person ID: $PERSON_ID"
```

### Шаг 4.2: Сделать фотографии через камеру

```bash
# Отправить команду на фотографирование
curl -X POST http://$VPS_IP:8000/api/v1/commands/ \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"command_type\": \"capture_photos\",
    \"parameters\": \"{\\\"person_id\\\": \\\"$PERSON_ID\\\", \\\"count\\\": 15}\"
  }"

echo "Команда отправлена!"
echo "Встань перед камерой Raspberry Pi и меняй положение головы."
echo "Подожди 30 секунд..."
```

**Во время съёмки (15 фото за ~7 секунд):**
1. Фото 1-3: смотри прямо в камеру
2. Фото 4-6: поверни голову немного влево
3. Фото 7-9: поверни голову немного вправо
4. Фото 10-12: подними голову немного вверх
5. Фото 13-15: опусти голову немного вниз

```bash
# Через 30 секунд проверь результат
sleep 30

curl http://$VPS_IP:8000/api/v1/commands/ \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | jq '.[] | select(.command_type == "capture_photos") | {status, result}'

# Должно быть status: "completed"
```

### Шаг 4.3: Обучить модель распознавания

```bash
# Отправить команду на обучение модели
curl -X POST http://$VPS_IP:8000/api/v1/commands/ \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"device_id\": \"$DEVICE_ID\",
    \"command_type\": \"rebuild_model\",
    \"parameters\": \"{}\"
  }"

echo "Модель обучается... Подожди 15 секунд..."
sleep 15

# Проверить статус
curl http://$VPS_IP:8000/api/v1/commands/ \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | jq '.[] | select(.command_type == "rebuild_model") | .status'

# Должно быть: "completed"
```

### Шаг 4.4: Проверка работы

```bash
# На Raspberry Pi посмотри логи
ssh pi@raspberry-pi-ip
docker-compose -f ~/FaceGuardV1/agent/docker-compose.yml logs -f agent

# Подойди к камере

# В логах должно появиться:
# INFO - Person recognized: {person_id} (confidence: 45.2)
# INFO - Opening door for 5 seconds...
# INFO - [GPIO] Servo moved to OPEN position
# INFO - Event created: recognized person

# Ctrl+C для выхода
```

**Проверь события в backend:**

```bash
curl http://$VPS_IP:8000/api/v1/events/?limit=5 \
  -H "Authorization: Bearer $JWT_TOKEN" | jq

# Должны быть события с твоим person_id
```

✅ **Распознавание работает!**

---

## 🔒 Часть 5: Безопасность (Рекомендуется!)

### Вариант 1: HTTPS с Nginx + Let's Encrypt

```bash
# На VPS установить Nginx
apt install -y nginx certbot python3-certbot-nginx

# Создать конфиг Nginx
nano /etc/nginx/sites-available/faceguard
```

**Содержимое конфига:**

```nginx
server {
    listen 80;
    server_name faceguard.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name faceguard.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/faceguard.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/faceguard.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Получить SSL сертификат
certbot --nginx -d faceguard.yourdomain.com

# Активировать конфиг
ln -s /etc/nginx/sites-available/faceguard /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# На Raspberry Pi в agent/.env изменить:
# BACKEND_URL=https://faceguard.yourdomain.com
```

### Вариант 2: VPN (Tailscale) - Рекомендуется!

**Преимущества:**
- ✅ Автоматическое шифрование
- ✅ Не нужен белый IP
- ✅ Работает через NAT
- ✅ Бесплатно до 100 устройств
- ✅ Проще чем настройка HTTPS

**На VPS:**

```bash
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Получишь приватный IP
tailscale ip -4
# Пример: 100.64.0.1
```

**На Raspberry Pi:**

```bash
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Получишь приватный IP
tailscale ip -4
# Пример: 100.64.0.2
```

**В agent/.env использовать Tailscale IP:**

```env
# Вместо публичного IP:
BACKEND_URL=http://100.64.0.1:8000

# Теперь связь зашифрована и не требует открытых портов!
```

✅ **Связь защищена!**

---

## 📊 Часть 6: Мониторинг и обслуживание

### Автозапуск при перезагрузке

**Backend на VPS:**

```bash
# Уже настроено! Docker Compose использует restart: unless-stopped

# После перезагрузки VPS:
cd /opt/faceguard/backend-service
docker-compose ps

# Должно автоматически запуститься
```

**Agent на Raspberry Pi:**

```bash
# Уже настроено! Docker Compose использует restart: unless-stopped

# После перезагрузки Pi:
docker-compose -f ~/FaceGuardV1/agent/docker-compose.yml ps

# Должно автоматически запуститься
```

### Просмотр логов

**Backend:**

```bash
# На VPS
cd /opt/faceguard/backend-service
docker-compose logs -f backend
docker-compose logs --tail=100 backend
```

**Agent:**

```bash
# На Raspberry Pi
cd ~/FaceGuardV1/agent
docker-compose logs -f agent
docker-compose logs --tail=100 agent
```

### Обновление системы

**Backend:**

```bash
# На VPS
cd /opt/faceguard/backend-service
git pull
docker-compose down
docker-compose up -d --build
```

**Agent:**

```bash
# На Raspberry Pi
cd ~/FaceGuardV1/agent
git pull
docker-compose down
docker-compose up -d --build
```

### Backup базы данных

```bash
# На VPS создать backup PostgreSQL
docker exec faceguard_db pg_dump -U faceguard faceguard > backup_$(date +%Y%m%d).sql

# Скачать backup на локальный компьютер
scp root@VPS_IP:/opt/faceguard/backend-service/backup_*.sql ./
```

### Мониторинг скрипт

**Создай на Raspberry Pi:**

```bash
nano ~/check_faceguard.sh
```

**Содержимое:**

```bash
#!/bin/bash

echo "=== FaceGuard System Status ==="
echo "Date: $(date)"
echo ""

# Backend доступен?
echo -n "Backend: "
if curl -s http://YOUR_VPS_IP:8000/api/v1/system/health > /dev/null; then
    echo "✓ Online"
else
    echo "✗ Offline"
fi

# Agent запущен?
echo -n "Agent: "
if docker ps | grep faceguard_agent > /dev/null; then
    echo "✓ Running"
else
    echo "✗ Stopped"
fi

# Модель обучена?
echo -n "Model: "
if [ -f ~/FaceGuardV1/data/models/face_model.yml ]; then
    echo "✓ Trained"
else
    echo "✗ Not trained"
fi

# Последний heartbeat
echo -n "Last heartbeat: "
docker-compose -f ~/FaceGuardV1/agent/docker-compose.yml logs agent \
  | grep "Heartbeat sent" | tail -1 | awk '{print $1, $2}'
```

```bash
# Сделать исполняемым
chmod +x ~/check_faceguard.sh

# Запустить
~/check_faceguard.sh
```

---

## 🐛 Troubleshooting

### Agent не подключается к Backend

```bash
# 1. Проверь BACKEND_URL в .env
cat ~/FaceGuardV1/agent/.env | grep BACKEND_URL

# 2. Проверь доступность VPS с Pi
ping YOUR_VPS_IP

# 3. Проверь порт 8000
telnet YOUR_VPS_IP 8000

# 4. Проверь curl
curl http://YOUR_VPS_IP:8000/api/v1/system/health

# 5. Если не работает - проверь firewall на VPS:
ssh root@VPS_IP
ufw status
ufw allow 8000
```

### Камера не работает

```bash
# Raspberry Pi Camera
libcamera-hello
# Если не работает:
sudo raspi-config
# Interface Options → Camera → Enable
sudo reboot

# USB Camera
ls /dev/video*
# Если камера /dev/video1:
# В .env измени: CAMERA_INDEX=1
```

### Распознавание не срабатывает

```bash
# 1. Проверь модель
ls ~/FaceGuardV1/data/models/
# Должны быть: face_model.yml и labels.json

# 2. Проверь фотографии
ls ~/FaceGuardV1/data/faces/*/processed/
# Должны быть .jpg файлы

# 3. Переобучи модель
# Отправь команду rebuild_model через API

# 4. Проверь threshold
# В .env попробуй: RECOGNITION_THRESHOLD=80 (мягче)
```

### Высокая задержка (latency)

```bash
# Проверь пинг до VPS
ping YOUR_VPS_IP

# Если > 200ms, увеличь интервалы в .env:
HEARTBEAT_INTERVAL=15
COMMAND_POLL_INTERVAL=10
SYNC_INTERVAL=120

docker-compose restart agent
```

---

## ✅ Финальный чеклист

### Backend (VPS):
- [ ] Docker и Docker Compose установлены
- [ ] Backend запущен: `docker-compose ps`
- [ ] Порт 8000 открыт в firewall: `ufw allow 8000`
- [ ] Backend доступен извне: `curl http://VPS_IP:8000/api/v1/system/health`
- [ ] Создан администратор
- [ ] Получен JWT токен

### Agent (Raspberry Pi):
- [ ] Docker и Docker Compose установлены
- [ ] Проект клонирован
- [ ] `.env` создан и настроен
- [ ] `BACKEND_URL` указывает на VPS
- [ ] `HARDWARE_MODE=raspberry_pi`
- [ ] Камера работает
- [ ] Agent запущен: `docker-compose ps`
- [ ] Логи без ошибок

### Связь Backend ↔ Agent:
- [ ] Устройство зарегистрировано в backend
- [ ] `DEVICE_ID` добавлен в agent/.env
- [ ] Device status = "online"
- [ ] Heartbeat приходит каждые 10 секунд
- [ ] Команды выполняются

### Распознавание:
- [ ] Создан хотя бы один человек
- [ ] Сделаны фотографии (15 штук)
- [ ] Модель обучена
- [ ] Файлы модели существуют
- [ ] Распознавание работает (логи agent)
- [ ] События попадают в backend

### Безопасность (опционально):
- [ ] Настроен HTTPS или VPN
- [ ] Используются сильные пароли
- [ ] Backend за Nginx (если нужен HTTPS)

---

## 📚 Дополнительные ресурсы

- [Agent README](agent/README.md) - Полная документация agent
- [Agent ARCHITECTURE](agent/ARCHITECTURE.md) - Внутреннее устройство
- [Agent EXAMPLES](agent/EXAMPLES.md) - Примеры использования
- [Backend API Documentation](backend-service/API_DOCUMENTATION.md) - Все API endpoints
- [Quick Start Guide](QUICKSTART.md) - Быстрый старт

---

**Дата создания:** 2026-06-15  
**Версия:** 1.0.0

🎉 **Поздравляем! Система FaceGuard развёрнута и готова к работе!**
