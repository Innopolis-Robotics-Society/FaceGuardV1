# Руководство по миграциям базы данных

## Быстрая справка (для работы на сервере через Docker)

```bash
# 1. Создать backup
docker exec faceguard-db pg_dump -U faceguard faceguard > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Обновить код
git pull origin main

# 3. Пересобрать backend
docker-compose up -d --build backend

# 4. Применить миграции
docker exec -it faceguard-backend alembic upgrade head

# 5. Проверить статус
docker exec -it faceguard-backend alembic current

# Откатить если нужно
docker exec -it faceguard-backend alembic downgrade -1
```

**Важно:** Всегда делайте backup перед применением миграций на production!

---

## Что такое миграции?

Миграции базы данных - это версионированные изменения схемы БД. Они позволяют:
- Отслеживать все изменения структуры базы данных
- Применять изменения на разных окружениях (dev, staging, production)
- Откатывать изменения при необходимости
- Работать в команде без конфликтов схемы БД

В проекте используется **Alembic** - инструмент миграций для SQLAlchemy.

## Структура проекта миграций

```
backend-service/
├── alembic/                    # Папка с миграциями
│   ├── env.py                 # Конфигурация окружения Alembic
│   ├── script.py.mako         # Шаблон для новых миграций
│   └── versions/              # Папка с файлами миграций
│       ├── 001_initial_migration.py
│       └── 002_convert_parameters_to_json.py
├── alembic.ini                # Главный конфигурационный файл
└── app/
    └── models/
        └── models.py          # SQLAlchemy модели
```

## Установка зависимостей

### Локальная разработка

Перед работой с миграциями убедитесь что установлены все зависимости:

```bash
cd backend-service
pip install -r requirements.txt
```

### Работа через Docker

Если вы работаете с проектом через Docker (на сервере или в production), все команды Alembic нужно выполнять внутри контейнера backend:

```bash
# Общий шаблон команды
docker exec -it faceguard-backend alembic <команда>

# Или войти в контейнер и работать там
docker exec -it faceguard-backend bash
cd /app
alembic <команда>
```

**Важно:** Замените `faceguard-backend` на реальное имя вашего контейнера. Проверить имя можно командой:
```bash
docker ps | grep backend
```

## Основные команды Alembic

### 1. Создать новую миграцию

**Локально:**

Автоматическая генерация (рекомендуется):
```bash
cd backend-service
alembic revision --autogenerate -m "описание изменений"
```

Ручная миграция (для сложных случаев):
```bash
alembic revision -m "описание изменений"
```

**Через Docker:**

```bash
# Автоматическая генерация
docker exec -it faceguard-backend alembic revision --autogenerate -m "описание изменений"

# Ручная миграция
docker exec -it faceguard-backend alembic revision -m "описание изменений"
```

Alembic сравнит модели в `app/models/models.py` с текущей схемой БД и автоматически создаст миграцию.
### 2. Применить миграции

**Локально:**

Применить все неприменённые миграции:
```bash
alembic upgrade head
```

Применить следующую миграцию:
```bash
alembic upgrade +1
```

Применить до конкретной ревизии:
```bash
alembic upgrade 002
```

**Через Docker:**

```bash
# Применить все неприменённые миграции
docker exec -it faceguard-backend alembic upgrade head

# Применить следующую миграцию
docker exec -it faceguard-backend alembic upgrade +1

# Применить до конкретной ревизии
docker exec -it faceguard-backend alembic upgrade 002
```

### 3. Откатить миграции

**Локально:**

Откатить последнюю миграцию:
```bash
alembic downgrade -1
```

Откатить все миграции:
```bash
alembic downgrade base
```

Откатить до конкретной ревизии:
```bash
alembic downgrade 001
```

**Через Docker:**

```bash
# Откатить последнюю миграцию
docker exec -it faceguard-backend alembic downgrade -1

# Откатить все миграции
docker exec -it faceguard-backend alembic downgrade base

# Откатить до конкретной ревизии
docker exec -it faceguard-backend alembic downgrade 001
```

### 4. Посмотреть статус миграций

**Локально:**

Текущая ревизия:
```bash
alembic current
```

История миграций:
```bash
alembic history
```

Подробная история:
```bash
alembic history --verbose
```

**Через Docker:**

```bash
# Текущая ревизия
docker exec -it faceguard-backend alembic current

# История миграций
docker exec -it faceguard-backend alembic history

# Подробная история
docker exec -it faceguard-backend alembic history --verbose
```

## Пример: Изменение типа поля parameters на JSON

### Проблема

В модели `DeviceCommand` поле `parameters` было `Text`, и параметры сохранялись как JSON-строка:

```python
# Старый код
parameters = Column(Text, nullable=True)

# В API приходилось делать:
import json
parameters=json.dumps({"key": "value"})
```

### Решение

Изменить тип на `JSON` для автоматической сериализации:

```python
# Новый код
parameters = Column(JSON, nullable=True)

# В API можно напрямую передавать dict:
parameters={"key": "value"}
```

### Шаги для создания миграции

#### Шаг 1: Изменить модели

Отредактируйте `backend-service/app/models/models.py`:

```python
from sqlalchemy import JSON  # Добавить импорт

class DeviceCommand(Base):
    __tablename__ = "device_commands"
    
    # ...
    parameters = Column(JSON, nullable=True)  # Изменить с Text на JSON
    result = Column(JSON, nullable=True)       # Также изменить result
```

#### Шаг 2: Обновить схемы Pydantic

Отредактируйте `backend-service/app/schemas/schemas.py`:

```python
class DeviceCommandBase(BaseModel):
    device_id: UUID
    command_type: str
    parameters: Optional[dict] = None  # Изменить с str на dict
```

#### Шаг 3: Создать миграцию

**Локально:**

Автоматически:
```bash
cd backend-service
alembic revision --autogenerate -m "convert parameters to json"
```

Или вручную:
```bash
alembic revision -m "convert parameters to json"
```

**Через Docker (на сервере):**

```bash
# Войти в контейнер
docker exec -it faceguard-backend bash

# Внутри контейнера выполнить
cd /app
alembic revision --autogenerate -m "convert parameters to json"

# Выйти из контейнера
exit
```

Или одной командой:
```bash
docker exec -it faceguard-backend alembic revision --autogenerate -m "convert parameters to json"
```

Alembic создаст файл вида `alembic/versions/2026_06_15_1610-002_convert_parameters_to_json.py`

#### Шаг 4: Проверить и отредактировать миграцию

Откройте созданный файл и проверьте содержимое:

```python
"""convert parameters to json

Revision ID: 002
Revises: 001
Create Date: 2026-06-15 16:07:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Применить изменения"""
    # Изменить тип parameters с TEXT на JSON
    op.alter_column(
        'device_commands',
        'parameters',
        type_=postgresql.JSON(astext_type=sa.Text()),
        existing_type=sa.Text(),
        existing_nullable=True,
        postgresql_using='parameters::json'  # Конвертировать существующие данные
    )
    
    # Изменить тип result с TEXT на JSON
    op.alter_column(
        'device_commands',
        'result',
        type_=postgresql.JSON(astext_type=sa.Text()),
        existing_type=sa.Text(),
        existing_nullable=True,
        postgresql_using='result::json'
    )


def downgrade() -> None:
    """Откатить изменения"""
    # Вернуть обратно на TEXT
    op.alter_column(
        'device_commands',
        'parameters',
        type_=sa.Text(),
        existing_type=postgresql.JSON(astext_type=sa.Text()),
        existing_nullable=True,
        postgresql_using='parameters::text'
    )
    
    op.alter_column(
        'device_commands',
        'result',
        type_=sa.Text(),
        existing_type=postgresql.JSON(astext_type=sa.Text()),
        existing_nullable=True,
        postgresql_using='result::text'
    )
```

**Важно:** Параметр `postgresql_using` указывает PostgreSQL как конвертировать существующие данные.

#### Шаг 5: Применить миграцию

**Локально:**
```bash
alembic upgrade head
```

**Через Docker (на сервере):**

```bash
# Применить миграцию
docker exec -it faceguard-backend alembic upgrade head
```

Вывод будет примерно такой:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade 001 -> 002, convert parameters to json
```

#### Шаг 6: Проверить

**Локально:**
```bash
alembic current
```

**Через Docker:**
```bash
docker exec -it faceguard-backend alembic current
```

Должно показать:
```
002 (head)
```

#### Шаг 7: Обновить код API

Теперь можно убрать `json.dumps()` из кода:

```python
# Старый код
import json
command_data = DeviceCommandCreate(
    device_id=device_id,
    command_type="open_door",
    parameters=json.dumps({"duration": 5})  # ❌ Больше не нужно
)

# Новый код
command_data = DeviceCommandCreate(
    device_id=device_id,
    command_type="open_door",
    parameters={"duration": 5}  # ✅ Напрямую передаём dict
)
```

## Частые ситуации

### Добавление нового поля в таблицу

```python
def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('email', sa.String(255), nullable=True)
    )

def downgrade() -> None:
    op.drop_column('users', 'email')
```

### Создание новой таблицы

```python
def upgrade() -> None:
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
    )

def downgrade() -> None:
    op.drop_table('notifications')
```

### Удаление таблицы

```python
def upgrade() -> None:
    op.drop_table('old_table')

def downgrade() -> None:
    # Нужно восстановить структуру таблицы
    op.create_table(
        'old_table',
        sa.Column('id', sa.Integer(), primary_key=True),
        # ... все колонки
    )
```

### Переименование колонки

```python
def upgrade() -> None:
    op.alter_column('users', 'username', new_column_name='user_name')

def downgrade() -> None:
    op.alter_column('users', 'user_name', new_column_name='username')
```

### Изменение типа колонки

```python
def upgrade() -> None:
    op.alter_column(
        'users',
        'age',
        type_=sa.Integer(),
        existing_type=sa.String(10),
        postgresql_using='age::integer'  # Для PostgreSQL
    )

def downgrade() -> None:
    op.alter_column(
        'users',
        'age',
        type_=sa.String(10),
        existing_type=sa.Integer(),
        postgresql_using='age::text'
    )
```

### Добавление индекса

```python
def upgrade() -> None:
    op.create_index('idx_users_email', 'users', ['email'])

def downgrade() -> None:
    op.drop_index('idx_users_email', 'users')
```

### Добавление внешнего ключа

```python
def upgrade() -> None:
    op.create_foreign_key(
        'fk_orders_user_id',
        'orders', 'users',
        ['user_id'], ['id'],
        ondelete='CASCADE'
    )

def downgrade() -> None:
    op.drop_constraint('fk_orders_user_id', 'orders', type_='foreignkey')
```

## Миграция данных (Data Migration)

Иногда нужно не только изменить структуру, но и данные:

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

def upgrade() -> None:
    # 1. Изменить структуру
    op.add_column('users', sa.Column('full_name', sa.String(255), nullable=True))
    
    # 2. Мигрировать данные
    users_table = table('users',
        column('id', sa.Integer),
        column('first_name', sa.String),
        column('last_name', sa.String),
        column('full_name', sa.String)
    )
    
    connection = op.get_bind()
    users = connection.execute(
        sa.select(users_table.c.id, users_table.c.first_name, users_table.c.last_name)
    ).fetchall()
    
    for user in users:
        connection.execute(
            users_table.update()
            .where(users_table.c.id == user.id)
            .values(full_name=f"{user.first_name} {user.last_name}")
        )
    
    # 3. Удалить старые колонки
    op.drop_column('users', 'first_name')
    op.drop_column('users', 'last_name')
```

## Best Practices

### 1. Всегда проверяйте миграции перед применением

**Локально:**
```bash
# Посмотреть SQL который будет выполнен
alembic upgrade head --sql
```

**Через Docker:**
```bash
# Посмотреть SQL который будет выполнен
docker exec -it faceguard-backend alembic upgrade head --sql
```

### 2. Тестируйте откат

После применения миграции проверьте что откат работает:

**Локально:**
```bash
alembic downgrade -1
alembic upgrade head
```

**Через Docker:**
```bash
docker exec -it faceguard-backend alembic downgrade -1
docker exec -it faceguard-backend alembic upgrade head
```

### 3. Делайте маленькие миграции

Лучше сделать несколько маленьких миграций чем одну большую:
- Легче понять изменения
- Легче откатить при проблемах
- Меньше шанс конфликтов в команде

### 4. Именуйте миграции понятно

❌ Плохо: `alembic revision -m "update"`
✅ Хорошо: `alembic revision -m "add email field to users table"`

### 5. Всегда указывайте `postgresql_using` при изменении типов

При изменении типа колонки PostgreSQL нужно знать как конвертировать данные:

```python
postgresql_using='column_name::new_type'
```

### 6. Делайте резервные копии перед миграциями на production

**Создать backup базы данных:**
```bash
# Backup через Docker
docker exec faceguard-db pg_dump -U faceguard faceguard > backup_$(date +%Y%m%d_%H%M%S).sql

# Или с указанием имени вручную
docker exec faceguard-db pg_dump -U faceguard faceguard > backup_20260615_161100.sql
```

**Применить миграцию:**
```bash
docker exec -it faceguard-backend alembic upgrade head
```

**Если что-то пошло не так, восстановить из backup:**
```bash
docker exec -i faceguard-db psql -U faceguard faceguard < backup_20260615_161100.sql
```

## Troubleshooting

### Проблема: "Target database is not up to date"

**Причина:** База данных в другом состоянии чем ожидает Alembic.

**Решение:**
```bash
# Посмотреть текущую ревизию
alembic current

# Посмотреть что ожидается
alembic history

# Синхронизировать вручную
alembic stamp head  # Пометить БД как актуальную (осторожно!)
```

### Проблема: Конфликт миграций в команде

**Причина:** Два разработчика создали миграции от одной ревизии.

**Решение:** Слить миграции:
```bash
alembic merge -m "merge migrations" rev1 rev2
```

### Проблема: Ошибка при автогенерации

**Причина:** Alembic не видит модели или подключение к БД не работает.

**Решение:**
1. Проверьте что БД запущена
2. Проверьте `alembic.ini` - правильный ли connection string
3. Проверьте что модели импортируются в `alembic/env.py`

### Проблема: Миграция не применяется

**Причина:** Ошибка в SQL или несовместимость данных.

**Решение:**
```bash
# Посмотреть SQL
alembic upgrade head --sql > migration.sql

# Проверить SQL вручную
# Исправить миграцию и попробовать снова
```

## Workflow для команды

### Developer workflow

1. Изменить модели в `app/models/models.py`
2. Создать миграцию: `alembic revision --autogenerate -m "описание"`
3. Проверить созданную миграцию
4. Применить локально: `alembic upgrade head`
5. Протестировать изменения
6. Закоммитить миграцию в git
7. Создать PR

### Reviewer workflow

1. Проверить файл миграции
2. Проверить что есть и `upgrade()` и `downgrade()`
3. Проверить что изменения соответствуют описанию
4. Локально применить и откатить миграцию
5. Одобрить PR

### Production deployment workflow (на сервере через Docker)

**Полный процесс применения миграций на production сервере:**

#### 1. Подключиться к серверу

```bash
ssh user@your-server.com
cd /path/to/FaceGuardV1
```

#### 2. Проверить статус контейнеров

```bash
# Проверить что все контейнеры запущены
docker ps

# Найти имя backend контейнера (обычно faceguard-backend)
docker ps | grep backend
```

#### 3. Создать резервную копию БД (обязательно!)

```bash
# Создать backup с текущей датой и временем
docker exec faceguard-db pg_dump -U faceguard faceguard > backup_$(date +%Y%m%d_%H%M%S).sql

# Проверить что backup создан
ls -lh backup_*.sql
```

#### 4. Проверить текущий статус миграций

```bash
# Посмотреть какая миграция применена сейчас
docker exec -it faceguard-backend alembic current

# Посмотреть историю всех миграций
docker exec -it faceguard-backend alembic history
```

#### 5. Обновить код из Git

```bash
# Получить последние изменения
git pull origin main

# Или переключиться на нужную ветку
git checkout feature/new-migrations
git pull
```

#### 6. Пересобрать backend контейнер (если изменились модели)

```bash
# Пересобрать и перезапустить backend
docker-compose up -d --build backend

# Подождать пока контейнер запустится (5-10 секунд)
docker ps | grep backend
```

#### 7. Посмотреть какой SQL будет выполнен (опционально)

```bash
# Проверить SQL перед применением
docker exec -it faceguard-backend alembic upgrade head --sql
```

#### 8. Применить миграцию

```bash
# Применить все новые миграции
docker exec -it faceguard-backend alembic upgrade head
```

Вы увидите вывод:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade 001 -> 002, convert parameters to json
```

#### 9. Проверить что миграция применилась

```bash
# Проверить текущую ревизию
docker exec -it faceguard-backend alembic current

# Должно показать последнюю миграцию
# 002 (head)
```

#### 10. Проверить что приложение работает

```bash
# Проверить логи backend
docker logs faceguard-backend --tail 50

# Проверить что API отвечает
curl http://localhost:8000/api/v1/health

# Проверить веб-интерфейс
# Открыть в браузере http://your-server.com
```

#### 11. Если что-то пошло не так - откатить

```bash
# Откатить последнюю миграцию
docker exec -it faceguard-backend alembic downgrade -1

# Или восстановить из backup
docker exec -i faceguard-db psql -U faceguard faceguard < backup_20260615_161100.sql

# Перезапустить контейнеры
docker-compose restart backend
```

#### 12. Очистить старые backup (опционально)

```bash
# Оставить только последние 5 backup файлов
ls -t backup_*.sql | tail -n +6 | xargs rm -f
```

### Пример полной команды для быстрого применения на production

```bash
# Скрипт для быстрого применения миграций
#!/bin/bash
set -e

echo "=== Создание backup БД ==="
docker exec faceguard-db pg_dump -U faceguard faceguard > backup_$(date +%Y%m%d_%H%M%S).sql

echo "=== Обновление кода ==="
git pull origin main

echo "=== Пересборка backend ==="
docker-compose up -d --build backend
sleep 10

echo "=== Текущий статус миграций ==="
docker exec -it faceguard-backend alembic current

echo "=== Применение миграций ==="
docker exec -it faceguard-backend alembic upgrade head

echo "=== Проверка статуса ==="
docker exec -it faceguard-backend alembic current

echo "=== Готово! ==="
```

Сохраните этот скрипт как `apply-migrations.sh` и выполняйте:
```bash
chmod +x apply-migrations.sh
./apply-migrations.sh
```

## Полезные ссылки

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLAlchemy Column Types](https://docs.sqlalchemy.org/en/20/core/types.html)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)

## Заключение

Миграции - это важная часть работы с базой данных. Они позволяют безопасно изменять схему и работать в команде. Всегда:
- Проверяйте миграции перед применением
- Тестируйте откат
- Делайте backup на production
- Пишите понятные названия миграций
