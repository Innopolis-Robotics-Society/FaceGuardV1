# FaceGuard Backend Setup

## Требования

- Docker
- Docker Compose

## Быстрый старт

### 1. Переход в папку backend

```bash
cd D:\CODE\IU\Software-summer\FaceGuardV1\backend-sevice
```

### 2. Создание папки для данных (если еще не создана)

```bash
mkdir -p data/faces data/events data/recognition data/logs data/backups data/temporary data/trash
```

### 3. Запуск через Docker Compose

```bash
docker-compose up --build
```

Эта команда:
- Соберет Docker образ для backend
- Запустит PostgreSQL контейнер
- Запустит Backend контейнер
- Создаст volumes для данных

### 4. Проверка работоспособности

После запуска откройте в браузере:

- **API документация (Swagger)**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/api/v1/system/health
- **Readiness check**: http://localhost:8000/api/v1/system/readiness

### 5. Остановка

```bash
docker-compose down
```

Для удаления данных БД:

```bash
docker-compose down -v
```

## Структура проекта

```
FaceGuardV1/
├── backend-sevice/
│   ├── app/
│   │   ├── main.py                 # Точка входа FastAPI
│   │   ├── core/
│   │   │   ├── config.py           # Настройки приложения
│   │   │   └── database.py         # Подключение к БД
│   │   ├── api/
│   │   │   └── system.py           # Health check endpoints
│   │   └── models/
│   ├── Dockerfile
│   └── requirements.txt
├── data/                            # Volume для файлов
│   ├── faces/
│   ├── events/
│   ├── recognition/
│   ├── logs/
│   └── backups/
├── docker-compose.yml
└── .env.example
```

## Переменные окружения

Все настройки в `docker-compose.yml`:

- `APP_NAME` - название приложения
- `APP_VERSION` - версия приложения
- `APP_ENV` - окружение (development/production)
- `DATABASE_URL` - строка подключения к PostgreSQL
- `DATA_DIR` - путь к папке с данными

## Endpoints

### System

- `GET /` - Информация о API
- `GET /api/v1/system/health` - Health check
- `GET /api/v1/system/readiness` - Readiness check (проверка БД)

### People (Управление людьми)

- `GET /api/v1/people/` - Список людей (с фильтрацией, поиском, пагинацией)
- `GET /api/v1/people/{id}` - Получить информацию о человеке
- `POST /api/v1/people/` - Создать человека (автоматически создаются папки для фото)
- `PATCH /api/v1/people/{id}` - Обновить информацию о человеке
- `DELETE /api/v1/people/{id}` - Удалить человека (soft delete по умолчанию)

### Photos (Управление фотографиями)

- `GET /api/v1/people/{person_id}/photos` - Список всех фото человека
- `GET /api/v1/people/{person_id}/photos/{photo_id}` - Информация о фото
- `POST /api/v1/people/{person_id}/photos` - Загрузить фото (поддержка множественной загрузки)
- `GET /api/v1/people/{person_id}/photos/{photo_id}/content?type=original` - Получить файл фото
  - `type=original` - оригинальное фото
  - `type=thumbnail` - миниатюра
  - `type=processed` - обработанное лицо (после OpenCV)
- `DELETE /api/v1/people/{person_id}/photos/{photo_id}` - Удалить фото

### Telemetry (Телеметрия устройств)

- `POST /api/v1/telemetry/` - Принять телеметрию от Pi (каждые 5-10 сек)
- `GET /api/v1/telemetry/devices/{device_id}` - История телеметрии за период
- `GET /api/v1/telemetry/devices/{device_id}/latest` - Последняя запись телеметрии
- `GET /api/v1/telemetry/devices/{device_id}/stats` - Статистика (avg/max/min за период)
- `DELETE /api/v1/telemetry/devices/{device_id}/cleanup` - Очистка старых записей

### Events (События распознавания)

- `GET /api/v1/events/` - Лог событий с фильтрацией
- `GET /api/v1/events/{id}` - Детали события
- `POST /api/v1/events/` - Создать событие (вызывается Pi агентом)
- `GET /api/v1/events/stats/summary` - Статистика событий за период
- `DELETE /api/v1/events/{id}` - Удалить событие
- `DELETE /api/v1/events/cleanup` - Очистка старых событий

### Commands (Команды для устройств)

- `GET /api/v1/commands/` - История команд
- `GET /api/v1/commands/pending?device_id={id}` - Очередь команд для Pi
- `GET /api/v1/commands/{id}` - Детали команды
- `POST /api/v1/commands/` - Создать команду
- `PATCH /api/v1/commands/{id}` - Обновить статус (Pi агент)
- `DELETE /api/v1/commands/{id}` - Удалить команду

**Быстрые команды:**
- `POST /api/v1/commands/devices/{id}/capture-photos` - Сделать фото для регистрации
- `POST /api/v1/commands/devices/{id}/rebuild-model` - Переобучить модель
- `POST /api/v1/commands/devices/{id}/open-door` - Открыть дверь вручную
- `POST /api/v1/commands/devices/{id}/reboot` - Перезагрузить Pi

## Разработка

### Запуск в режиме разработки

Backend использует `--reload` флаг, поэтому изменения в коде автоматически применяются.

### Логи

Просмотр логов backend:

```bash
docker-compose logs -f backend
```

Просмотр логов PostgreSQL:

```bash
docker-compose logs -f db
```

### Подключение к PostgreSQL

```bash
docker exec -it faceguard_db psql -U faceguard -d faceguard
```

## Следующие шаги

1. Создание моделей БД (tables: users, people, person_photos, devices, events)
2. Настройка Alembic для миграций
3. Создание API endpoints для управления людьми
4. Интеграция с Raspberry Pi Agent

## Troubleshooting

### Порт 5432 занят

Если PostgreSQL уже запущен на хосте, измените порт в `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Внешний порт 5433
```

И в `DATABASE_URL` измените хост при прямом подключении с хоста.

### Порт 8000 занят

Измените порт backend в `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"
```

### Ошибка подключения к БД

Убедитесь, что контейнер PostgreSQL запущен и готов:

```bash
docker-compose ps
```

Проверьте health check:

```bash
docker-compose exec db pg_isready -U faceguard
```
