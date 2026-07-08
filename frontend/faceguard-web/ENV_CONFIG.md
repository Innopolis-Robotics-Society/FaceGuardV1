# 🔧 Frontend Environment Configuration

## 📋 Настройка API для FaceGuard Web

### Файлы конфигурации

- **`.env`** — ваш локальный файл (не коммитится в git)
- **`.env.example`** — шаблон для других разработчиков

### Доступные переменные

```env
# Backend API URL
VITE_API_URL=http://localhost:8000/api/v1

# WebSocket URL (для real-time обновлений)
VITE_WS_URL=ws://localhost:8000
```

## 🚀 Как использовать

### 1. Локальная разработка (по умолчанию)

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000
```

### 2. Удаленный сервер

```env
VITE_API_URL=http://192.168.1.100:8000/api/v1
VITE_WS_URL=ws://192.168.1.100:8000
```

### 3. Производственный сервер

```env
VITE_API_URL=https://api.faceguard.example.com/api/v1
VITE_WS_URL=wss://api.faceguard.example.com
```

## 📝 Инструкция

### Шаг 1: Создайте `.env` файл

```bash
cd frontend/faceguard-web
cp .env.example .env
```

### Шаг 2: Отредактируйте `.env`

Откройте `.env` и укажите ваш API URL:

```env
VITE_API_URL=http://YOUR_SERVER_IP:8000/api/v1
VITE_WS_URL=ws://YOUR_SERVER_IP:8000
```

### Шаг 3: Перезапустите dev сервер

```bash
npm run dev
```

## ⚠️ Важно

- **Всегда используйте префикс `VITE_`** для переменных окружения в Vite
- После изменения `.env` нужно перезапустить `npm run dev`
- Файл `.env` добавлен в `.gitignore` и не будет закоммичен

## 🔍 Проверка настроек

Откройте консоль браузера (F12) и выполните:

```javascript
console.log(import.meta.env.VITE_API_URL)
console.log(import.meta.env.VITE_WS_URL)
```

Вы должны увидеть ваши настройки.

## 🌐 Примеры конфигураций

### Локальная сеть (Raspberry Pi)
```env
VITE_API_URL=http://192.168.1.50:8000/api/v1
VITE_WS_URL=ws://192.168.1.50:8000
```

### Университетская сеть
```env
VITE_API_URL=http://10.93.26.183:8000/api/v1
VITE_WS_URL=ws://10.93.26.183:8000
```

### Docker контейнер (с хоста)
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000
```

### Production с SSL
```env
VITE_API_URL=https://faceguard.yourdomain.com/api/v1
VITE_WS_URL=wss://faceguard.yourdomain.com
```

## 🐛 Решение проблем

### Проблема: API запросы не работают

**Проверьте:**
1. Backend запущен и доступен по указанному URL
2. Файл `.env` создан и содержит правильные URL
3. Dev сервер перезапущен после изменения `.env`
4. URL не содержит опечаток и лишних слэшей

### Проблема: WebSocket соединение не устанавливается

**Решение:**
- Убедитесь что `VITE_WS_URL` использует `ws://` (или `wss://` для SSL)
- Проверьте, что backend поддерживает WebSocket на `/ws/events`
- Проверьте firewall и сетевые настройки

### Проблема: Переменные undefined

**Решение:**
- Проверьте префикс `VITE_` (обязателен для Vite)
- Перезапустите dev сервер
- Очистите кэш: `rm -rf node_modules/.vite`

## 📚 Дополнительная информация

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- Backend API документация: `http://localhost:8000/docs`
- WebSocket события: `/ws/events` endpoint
