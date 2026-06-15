# 🚀 Быстрый старт Agent

## ⚠️ ВАЖНО: Перед запуском

### 1. Настройте `.env` файл

Откройте `.env` и **обязательно** замените `YOUR_BACKEND_IP` на реальный IP-адрес вашего backend сервера:

```env
# ❌ НЕПРАВИЛЬНО (не работает локально):
BACKEND_URL=http://backend:8000

# ✅ ПРАВИЛЬНО:
BACKEND_URL=http://192.168.1.100:8000
# или
BACKEND_URL=http://your-server-domain.com:8000
```

**Как узнать IP backend сервера:**
```bash
# На сервере где запущен backend:
ip addr show | grep inet

# Или через curl проверьте доступность:
curl http://YOUR_IP:8000/api/v1/system/health
```

### 2. Убедитесь что backend доступен

```bash
# Замените YOUR_BACKEND_IP на ваш IP
curl http://YOUR_BACKEND_IP:8000/api/v1/system/health

# Должен вернуть: {"status": "healthy"}
```

---

## 🐳 Запуск через Docker (рекомендуется)

### Шаг 1: Отредактировать .env
```bash
# Windows
notepad .env

# Linux/Mac
nano .env
```

### Шаг 2: Запустить
```bash
docker-compose up --build
```

### Шаг 3: Проверить логи
В логах должно появиться:
```
✓ Agent initialized successfully
✓ Camera started
✓ Sync manager started
✓ Command poller started
✓ FaceGuard Agent is running
```

Если видите ошибку:
```
❌ Failed to register device: [Errno 11001]
```
→ Значит `BACKEND_URL` неправильный, см. пункт 1 выше.

---

## 🐍 Запуск без Docker (Python напрямую)

### Шаг 1: Создать виртуальное окружение
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### Шаг 2: Установить зависимости
```bash
pip install -r requirements.txt
```

### Шаг 3: Отредактировать .env
```bash
# Убедитесь что BACKEND_URL правильный!
notepad .env
```

### Шаг 4: Запустить
```bash
python main.py
```

---

## 🔍 Проверка работы

### 1. Проверить статус агента

В логах должно быть:
```
Status:
  Camera: ✓ Available
  Recognition: ✗ Not trained (нормально для первого запуска)
  Door controller: ✓ Ready
  Backend: ✓ Online

System:
  CPU: 23.5%
  Temperature: 45.2°C
  RAM: 61.0%
  Disk: 42.3%
  Uptime: 0:00:15
```

### 2. Проверить подключение к backend

Agent должен отправлять heartbeat каждые 10 секунд:
```
DEBUG - Heartbeat sent successfully
```

Если видите:
```
ERROR - Failed to send heartbeat: ConnectError
WARNING - Backend connection lost - entering offline mode
```
→ Backend недоступен, проверьте `BACKEND_URL` и firewall.

### 3. Проверить что data/ создалась

```bash
ls -la data/

# Должно появиться:
# data/agent.db          - SQLite база
# data/faces/            - папка для фото
# data/events/           - папка для снапшотов
# data/models/           - папка для моделей
# data/logs/agent.log    - логи
```

---

## 📝 Следующие шаги

После успешного запуска агента:

1. **Зарегистрировать устройство в backend** (происходит автоматически при первом запуске)
2. **Создать человека в backend** через API
3. **Сделать фотографии** командой `capture_photos`
4. **Обучить модель** командой `rebuild_model`
5. **Проверить распознавание** — подойти к камере

Подробнее см. [README.md](README.md) раздел "Регистрация нового человека".

---

## 🐛 Частые ошибки

### ❌ `[Errno 11001] getaddrinfo failed`
**Причина:** `BACKEND_URL` содержит имя хоста которое не резолвится  
**Решение:** Используйте IP-адрес вместо имени: `http://192.168.1.100:8000`

### ❌ `Connection refused` / `ConnectError`
**Причина:** Backend не запущен или недоступен  
**Решение:** 
- Проверьте что backend запущен: `curl http://YOUR_IP:8000/api/v1/system/health`
- Проверьте firewall: `sudo ufw allow 8000` (на сервере backend)

### ❌ `Camera not found` / `Falling back to simulated camera`
**Нормально для режима разработки** если нет физической камеры.  
Agent будет работать с симулированной камерой (генерирует пустые кадры).

### ❌ `Model not trained, cannot recognize`
**Нормально для первого запуска.**  
Нужно сначала сделать фотографии и обучить модель (см. README.md).

---

## 📊 Полезные команды

```bash
# Остановить agent
docker-compose down

# Перезапустить
docker-compose restart

# Посмотреть логи
docker-compose logs -f agent

# Посмотреть последние 50 строк
docker-compose logs --tail=50 agent

# Зайти внутрь контейнера
docker exec -it faceguard_agent bash

# Проверить SQLite базу
docker exec -it faceguard_agent sqlite3 /app/data/agent.db "SELECT * FROM events LIMIT 5;"
```

---

## 🎯 Чек-лист запуска

- [ ] Backend запущен и доступен (`curl http://IP:8000/api/v1/system/health`)
- [ ] `.env` создан и `BACKEND_URL` содержит правильный IP
- [ ] `HARDWARE_MODE=development` для тестирования
- [ ] `docker-compose up --build` выполнена
- [ ] В логах: "FaceGuard Agent is running"
- [ ] В логах: "Backend: ✓ Online"
- [ ] Нет ошибок `[Errno 11001]` или `Connection refused`
- [ ] Создалась директория `data/` с `agent.db`

Если все пункты ✅ — agent работает корректно!

---

**Дата:** 2026-06-15  
**Версия:** 1.0.0
