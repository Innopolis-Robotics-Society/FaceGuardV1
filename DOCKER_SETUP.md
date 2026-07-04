# Docker Setup для FaceGuard

## Быстрый старт

### 1. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и настройте значения:

```bash
cp .env.example .env
```

Отредактируйте `.env` и установите безопасные значения для продакшена:
- `POSTGRES_PASSWORD` - пароль для базы данных
- `SECRET_KEY` - секретный ключ для JWT токенов

### 2. Запуск всех сервисов

```bash
docker-compose up -d
```

Это запустит:
- **PostgreSQL** (порт 5432) - база данных
- **Backend API** (порт 8000) - FastAPI сервер
- **Frontend** (порт 3000) - React приложение

### 3. Проверка статуса

```bash
docker-compose ps
```

### 4. Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend
```

### 5. Применение миграций базы данных

После первого запуска нужно применить миграции:

```bash
docker-compose exec backend alembic upgrade head
```

## Доступ к сервисам

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432 (пользователь: faceguard)

## Остановка сервисов

```bash
# Остановить без удаления
docker-compose stop

# Остановить и удалить контейнеры
docker-compose down

# Остановить и удалить контейнеры + volumes (удалит данные БД!)
docker-compose down -v
```

## Пересборка образов

Если вы изменили код или Dockerfile:

```bash
# Пересобрать все образы
docker-compose build

# Пересобрать конкретный сервис
docker-compose build backend

# Пересобрать и перезапустить
docker-compose up -d --build
```

## Разработка

### Hot reload для backend

Раскомментируйте volume mapping в docker-compose.yml:

```yaml
backend:
  volumes:
    - ./backend-service/app:/app/app
```

И измените CMD в Dockerfile на:

```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

## Troubleshooting

### Backend не может подключиться к БД

Проверьте, что PostgreSQL запущен и здоров:

```bash
docker-compose logs postgres
```

### Frontend не может подключиться к Backend

Убедитесь, что backend доступен:

```bash
curl http://localhost:8000/api/v1/system/health
```

Проверьте переменные окружения `VITE_API_URL` и `VITE_WS_URL` в сборке frontend.

### Порты заняты

Если порты 3000, 8000 или 5432 уже заняты, измените их в docker-compose.yml:

```yaml
ports:
  - "3001:80"  # Изменить внешний порт
```

## Продакшн

Для продакшн окружения:

1. Установите `APP_ENV=production` в `.env`
2. Используйте сильный `SECRET_KEY` (сгенерируйте через `openssl rand -hex 32`)
3. Используйте сильный `POSTGRES_PASSWORD`
4. Настройте SSL сертификаты для nginx
5. Не монтируйте исходный код через volumes
6. Используйте внешнюю управляемую БД вместо Docker PostgreSQL
