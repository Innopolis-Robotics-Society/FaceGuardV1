# FaceGuard Backend - Полный MVP 🎉

Полнофункциональный backend для системы умного домофона на Raspberry Pi с поддержкой **офлайн работы**.

---

## ✅ Что реализовано

### 🔐 **Authentication (JWT)**
- Регистрация и авторизация
- JWT токены (30 минут)
- Роли: admin, superadmin
- Защита endpoints
- SHA256 хеширование паролей

### 👥 **People Management**
- CRUD операции
- **Поддержка множественных фотографий** (10-30 на человека)
- Автоматическое создание папок
- Soft delete
- Поиск и фильтрация

### 📸 **Photos Management**
- **Множественная загрузка** файлов
- Автоматические thumbnails
- Hash вычисление
- Форматы: JPG, PNG, BMP
- Получение original/thumbnail/processed

### 🖥️ **Devices (Raspberry Pi)**
- Регистрация устройств
- **Heartbeat** (каждые 5-10 сек)
- Мониторинг online/offline
- IP, версия ПО, статус камеры

### 📊 **Telemetry**
- CPU, RAM, температура, FPS
- История за период
- Статистика (avg/max/min)
- Автоочистка старых данных

### 📋 **Events (Распознавание)**
- Лог всех событий
- Типы: recognized, unknown, access_denied, manual_open
- Статистика событий
- Фильтрация

### 🎮 **Commands**
- 11 типов команд для Pi
- Очередь команд (pending)
- Статусы выполнения
- Быстрые команды

### 🔄 **Sync (Офлайн)**
- **Массовая загрузка событий**
- **Массовая загрузка телеметрии**
- Статус синхронизации
- Поддержка SQLite буфера на Pi

### 📝 **Audit Logs**
- Логирование всех действий
- Статистика по админам
- Автоочистка (минимум 30 дней)

---

## 📊 Статистика

- **58 API endpoints**
- **10 модулей API**
- **9 таблиц БД**
- **Python 3.11**
- **PostgreSQL 16**
- **FastAPI**
- **Alembic миграции**
- **Docker Compose**

---

## 🚀 Быстрый старт

### 1. Запуск

```bash
cd backend-sevice
docker-compose up -d
```

### 2. Проверка

```bash
curl http://localhost:8000/api/v1/system/health
```

### 3. Создание первого админа

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "yourpassword", "role": "superadmin"}'
```

### 4. Получение токена

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "yourpassword"}'
```

### 5. Swagger UI

Откройте: http://localhost:8000/docs

---

## 📚 Документация

- **SETUP.md** - Инструкции по установке и запуску
- **API_DOCUMENTATION.md** - Полная документация всех endpoints
- **Swagger UI** - Интерактивная документация API

---

## 🗄️ База данных

**9 таблиц:**

1. **users** - Администраторы системы
2. **people** - Люди для распознавания
3. **person_photos** - Фотографии (много на человека)
4. **devices** - Raspberry Pi устройства
5. **access_events** - События распознавания
6. **telemetry** - Телеметрия устройств
7. **device_commands** - Команды для Pi
8. **audit_logs** - Логи действий администраторов
9. **backups** - Информация о бэкапах

**Миграции:** Alembic  
**UUID:** Для всех ID  
**Soft delete:** Поддержка  
**Индексы:** Оптимизированы  

---

## 📁 Структура файлов

```
data/
├── faces/
│   └── {person_uuid}/
│       ├── original/           # 10-30 фото на человека
│       │   └── .thumbnails/    
│       └── processed/          # Для OpenCV
├── events/                     # Снапшоты
├── videos/                     # Видео
├── recognition/                # trainer.yml, labels.json
├── logs/
├── backups/
└── trash/                      # Soft delete
```

---

## 🔄 Офлайн работа (ключевая особенность)

### Как работает:

**Raspberry Pi без интернета:**
1. ✅ Распознавание работает локально
2. ✅ Дверь открывается
3. ✅ События сохраняются в SQLite
4. ✅ Телеметрия накапливается

**При восстановлении связи:**
1. Pi подключается к серверу
2. Отправляет все события через `POST /api/v1/sync/events/bulk`
3. Отправляет телеметрию через `POST /api/v1/sync/telemetry/bulk`
4. Получает pending команды
5. Обновляет модель если нужно

### API для синхронизации:

```http
POST /api/v1/sync/events/bulk?device_id=uuid
POST /api/v1/sync/telemetry/bulk?device_id=uuid
GET /api/v1/sync/status/{device_id}
```

---

## 🎯 Готово для Raspberry Pi агента

Все endpoints готовы для интеграции с вашим агентом:

### Агент должен:

1. **При старте:**
   - Подключиться к серверу
   - Отправить heartbeat
   - Загрузить модель распознавания

2. **Каждые 5-10 секунд:**
   - `POST /api/v1/devices/{id}/heartbeat`
   - `POST /api/v1/telemetry/`

3. **При событии распознавания:**
   - `POST /api/v1/events/`

4. **Периодически проверять команды:**
   - `GET /api/v1/commands/pending?device_id=uuid`

5. **При офлайн → онлайн:**
   - `POST /api/v1/sync/events/bulk`
   - `POST /api/v1/sync/telemetry/bulk`

---

## 🔐 Безопасность

- ✅ JWT авторизация
- ✅ Роли admin/superadmin
- ✅ SHA256 хеширование
- ✅ HTTP Bearer tokens
- ✅ Audit logs
- ✅ Защита критичных операций

**Superadmin требуется для:**
- Удаление людей
- Ручное открытие двери
- Перезагрузка устройств
- Управление пользователями

---

## 📈 Следующие шаги (опционально)

1. ✨ **WebSocket** - real-time команды и события
2. 🔒 **Улучшение безопасности** - bcrypt/argon2 вместо SHA256
3. 💾 **Backups API** - создание резервных копий
4. 📹 **Video Streaming** - MJPEG через WebSocket
5. 📧 **Уведомления** - email/push при событиях

---

## 🛠️ Технологии

- **FastAPI** - Современный async Python фреймворк
- **PostgreSQL 16** - Надежная СУБД
- **SQLAlchemy 2.0** - ORM
- **Alembic** - Миграции
- **Pydantic** - Валидация данных
- **python-jose** - JWT токены
- **Pillow** - Обработка изображений
- **Docker Compose** - Контейнеризация

---

## 📊 Endpoints по категориям

| Категория | Количество |
|-----------|------------|
| System | 3 |
| Auth | 5 |
| People | 5 |
| Photos | 6 |
| Devices | 8 |
| Telemetry | 5 |
| Events | 6 |
| Commands | 12 |
| Sync | 3 |
| Audit | 5 |
| **Итого** | **58** |

---

## ✨ Особенности

- ✅ **Множественные фотографии** - 10-30 на человека
- ✅ **Офлайн синхронизация** - работает без интернета
- ✅ **Автоматические thumbnails** - для быстрой загрузки
- ✅ **Audit logs** - полная история действий
- ✅ **Soft delete** - защита от случайного удаления
- ✅ **Статистика** - по всем сущностям
- ✅ **Heartbeat** - мониторинг устройств
- ✅ **Массовые операции** - для быстрой синхронизации
- ✅ **Очистка старых данных** - автоматическая
- ✅ **UUID everywhere** - надежные идентификаторы

---

## 🎓 Архитектурные решения

1. **UUID для папок людей** - не имя (имя может меняться)
2. **Original + Processed** - оригиналы для переобучения
3. **Soft delete** - trash/ на 30 дней
4. **Команды через БД + WebSocket** - офлайн очередь
5. **Множественные фото** - 10-30 для точности
6. **Heartbeat каждые 5-10 сек** - быстрое обнаружение офлайн
7. **Массовая синхронизация** - экономия запросов
8. **Статистика** - для всех сущностей

---

## 💡 Примеры использования

См. **API_DOCUMENTATION.md** для полных примеров всех endpoints.

---

## 🎉 Итог

**Полностью готовый backend** для системы умного домофона с:
- ✅ Поддержкой офлайн работы
- ✅ Множественными фотографиями
- ✅ Мониторингом устройств
- ✅ Аудитом действий
- ✅ JWT авторизацией
- ✅ 58 API endpoints

**Готов к интеграции с вашим Raspberry Pi агентом!** 🚀

---

*Создано: 2026-06-13*  
*Python 3.11 | FastAPI | PostgreSQL 16 | Docker*
