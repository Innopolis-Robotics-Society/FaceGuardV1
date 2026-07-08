# 🐳 Docker для FaceGuard Frontend

## 📋 Быстрый старт

Этот Docker Compose запускает **только frontend** на порту **3000**.  
Backend и Agent должны быть запущены отдельно на портах **8000** и **8001**.

---

## 🚀 Запуск

### 1. Убедитесь, что backend запущен

```bash
# Проверьте что backend доступен
curl http://localhost:8000/api/v1/system/health
```

### 2. Запустите frontend в Docker

```bash
cd frontend/faceguard-web

# Запустить
docker-compose up -d

# Или с пересборкой
docker-compose up -d --build
```

### 3. Откройте в браузере

```
http://localhost:3000
```

---

## ⚙️ Настройка API URL

Если ваш backend на другом адресе, отредактируйте `docker-compose.yml`:

```yaml
build:
  args:
    VITE_API_URL: http://YOUR_SERVER_IP:8000/api/v1
    VITE_WS_URL: ws://YOUR_SERVER_IP:8000
```

### Примеры:

**Для удаленного сервера:**
```yaml
VITE_API_URL: http://192.168.1.100:8000/api/v1
VITE_WS_URL: ws://192.168.1.100:8000
```

**Для production с доменом:**
```yaml
VITE_API_URL: https://api.faceguard.com/api/v1
VITE_WS_URL: wss://api.faceguard.com
```

---

## 🔧 Команды Docker

### Запустить
```bash
docker-compose up -d
```

### Остановить
```bash
docker-compose down
```

### Пересобрать и запустить
```bash
docker-compose up -d --build
```

### Посмотреть логи
```bash
docker-compose logs -f
```

### Удалить контейнер
```bash
docker-compose down -v
```

---

## 📊 Порты

| Сервис | Порт | Описание |
|--------|------|----------|
| Frontend | 3000 | Веб-интерфейс FaceGuard |
| Backend | 8000 | API (должен быть запущен отдельно) |
| Stream | 8001 | Видеопоток (должен быть запущен отдельно) |

---

## 🐛 Решение проблем

### Проблема: "Connection refused" к backend

**Решение:**
1. Убедитесь, что backend запущен: `curl http://localhost:8000/api/v1/system/health`
2. Проверьте что используется `network_mode: "host"` в docker-compose.yml
3. На Windows/Mac замените `localhost` на IP хоста

### Проблема: Frontend не обновляется после изменений

**Решение:**
```bash
docker-compose down
docker-compose up -d --build --force-recreate
```

### Проблема: API URL не применяется

**Решение:**  
API URL задается при сборке образа. После изменения нужна пересборка:
```bash
docker-compose up -d --build
```

---

## 🌐 Для продакшена

### Вариант 1: Обратный прокси (рекомендуется)

Используйте Nginx/Caddy на хосте:

```nginx
# Nginx конфиг на хосте
server {
    listen 80;
    server_name faceguard.example.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Вариант 2: Внешний порт 80

Измените порт в docker-compose.yml:
```yaml
ports:
  - "80:80"
```

---

## 📝 Альтернатива: Запуск без Docker

Если не хотите использовать Docker:

```bash
cd frontend/faceguard-web

# 1. Установите зависимости
npm install

# 2. Настройте .env
cp .env.example .env
nano .env  # Укажите ваш API URL

# 3. Запустите dev сервер
npm run dev

# Или соберите для продакшена
npm run build
npm run preview
```

---

## 📚 Дополнительная информация

- Frontend использует Vite + React + TypeScript
- Nginx служит статические файлы
- API URL задается при сборке образа
- Network mode `host` позволяет обращаться к localhost:8000

Готово! 🎉
