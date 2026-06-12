# FaceGuard Admin Panel + FastAPI Backend Plan

## 1. Цель проекта

FaceGuard — это система умного домофона на Raspberry Pi.

Основная логика:

- Raspberry Pi получает изображение с камеры.
- OpenCV распознаёт лицо.
- Если человек знакомый и доступ разрешён, открывается дверь через сервопривод.
- Все события сохраняются в системе.
- Администратор управляет людьми, фотографиями, устройством и логами через React Admin Panel.

---

## 2. Главная идея архитектуры

React Admin Panel не должен напрямую работать с Raspberry Pi, камерой, папками или системными командами.

Правильная схема:

```text
React Admin Panel
        ↓
FastAPI Backend
        ↓
PostgreSQL + File Storage
        ↓
Raspberry Pi Agent
        ↓
Camera + OpenCV + Servo Motor
```

То есть:

- React отвечает только за интерфейс.
- FastAPI отвечает за API, права доступа, базу, файлы, команды и аудит.
- Raspberry Pi Agent отвечает за камеру, OpenCV, сервопривод, телеметрию и выполнение команд.
- PostgreSQL хранит данные.
- Файлы хранятся отдельно в папках.

---

## 3. Основные компоненты системы

### 3.1 React Admin Panel

Сайт для администратора.

Функции:

- Вход администратора.
- Dashboard с состоянием Raspberry Pi.
- Просмотр телеметрии.
- Добавление новых людей.
- Создание фото нового человека через камеру.
- Управление фотографиями людей.
- Просмотр событий распознавания.
- Просмотр неизвестных людей.
- Просмотр видео или фото с камеры.
- Удалённый перезапуск устройства.
- Перезапуск сервиса распознавания.
- Сбор логов.
- Создание и скачивание бэкапов.
- Просмотр audit log.

---

### 3.2 FastAPI Backend

Центральный сервер.

Функции:

- Авторизация и роли пользователей.
- REST API для React.
- WebSocket для онлайн-обновлений.
- Управление людьми.
- Управление фотографиями.
- Управление Raspberry Pi устройствами.
- Создание команд для Raspberry Pi.
- Приём телеметрии.
- Приём событий распознавания.
- Хранение информации в PostgreSQL.
- Работа с файловым хранилищем.
- Создание резервных копий.
- Ведение audit log.

---

### 3.3 Raspberry Pi Agent

Отдельный Python-сервис на Raspberry Pi.

Функции:

- Подключение к FastAPI.
- Отправка heartbeat.
- Отправка телеметрии.
- Работа с камерой.
- Распознавание лиц через OpenCV.
- Управление сервоприводом.
- Получение команд от сервера.
- Создание фотографий для регистрации человека.
- Отправка событий распознавания.
- Сбор логов.
- Перезапуск сервисов.
- Перезагрузка Raspberry Pi.

---

### 3.4 PostgreSQL

Локальная база данных.

В ней хранятся:

- Пользователи админ-панели.
- Люди, которым разрешён доступ.
- Пути к фотографиям.
- Устройства Raspberry Pi.
- События распознавания.
- Телеметрия.
- Команды устройству.
- Логи действий администратора.
- Информация о бэкапах.

Фотографии и видео не стоит хранить прямо в базе.
База должна хранить только пути к файлам и метаданные.

---

### 3.5 File Storage

Физические файлы системы:

- Фотографии людей.
- Обработанные лица.
- Фотографии событий.
- Видео событий.
- Превью.
- Логи.
- Бэкапы.
- Модели OpenCV.

---

## 4. Общая структура проекта

```text
faceguard/
├── frontend/
│   └── React Admin Panel
│
├── backend/
│   └── FastAPI Backend
│
├── raspberry-agent/
│   └── Python service for Raspberry Pi
│
├── data/
│   ├── faces/
│   ├── events/
│   ├── videos/
│   ├── thumbnails/
│   ├── recognition/
│   ├── logs/
│   ├── backups/
│   ├── temporary/
│   └── trash/
│
├── infrastructure/
│   ├── nginx/
│   ├── mediamtx/
│   ├── postgres/
│   ├── scripts/
│   └── systemd/
│
├── docker-compose.yml
├── docker-compose.production.yml
├── .env.example
└── README.md
```

---

## 5. Структура backend

```text
backend/
├── app/
│   ├── main.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   ├── permissions.py
│   │   └── logging.py
│   │
│   ├── api/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── people/
│   │   ├── photos/
│   │   ├── events/
│   │   ├── devices/
│   │   ├── commands/
│   │   ├── telemetry/
│   │   ├── logs/
│   │   ├── backups/
│   │   ├── video/
│   │   └── websocket/
│   │
│   ├── models/
│   ├── schemas/
│   ├── repositories/
│   ├── services/
│   │   ├── person_service.py
│   │   ├── photo_service.py
│   │   ├── command_service.py
│   │   ├── device_service.py
│   │   ├── telemetry_service.py
│   │   ├── backup_service.py
│   │   ├── audit_service.py
│   │   └── recognition_service.py
│   │
│   ├── storage/
│   ├── tasks/
│   └── database/
│
├── migrations/
├── tests/
├── Dockerfile
└── requirements.txt
```

---

## 6. Структура Raspberry Pi Agent

```text
raspberry-agent/
├── agent/
│   ├── main.py
│   │
│   ├── camera/
│   │   ├── camera_service.py
│   │   └── capture_service.py
│   │
│   ├── detection/
│   │   └── face_detector.py
│   │
│   ├── recognition/
│   │   ├── recognizer.py
│   │   ├── trainer.py
│   │   ├── labels.py
│   │   └── model_loader.py
│   │
│   ├── dataset_sync/
│   │   ├── sync_faces.py
│   │   └── download_dataset.py
│   │
│   ├── telemetry/
│   │   └── telemetry_service.py
│   │
│   ├── commands/
│   │   ├── command_listener.py
│   │   └── command_executor.py
│   │
│   ├── door/
│   │   └── servo_service.py
│   │
│   ├── streaming/
│   │   └── video_stream.py
│   │
│   ├── events/
│   │   └── event_sender.py
│   │
│   ├── uploads/
│   │   └── upload_service.py
│   │
│   └── system/
│       ├── reboot_service.py
│       ├── log_collector.py
│       └── health_check.py
│
├── config/
├── tests/
├── Dockerfile
└── requirements.txt
```

---

## 7. Структура фотографий людей

Так как фотографий будет много и они будут разделены по людям, лучше не использовать имя человека как название папки.

Плохой вариант:

```text
faces/
├── Oleg/
├── Ivan/
└── Maria/
```

Проблема:

- имя может измениться;
- могут быть одинаковые имена;
- могут быть пробелы, кириллица, ошибки;
- переименование папки может сломать связи.

Правильный вариант:

```text
data/
└── faces/
    ├── 3a8f6d8e-2d4c-4f90-a310-8a5502c0fd91/
    │   ├── original/
    │   │   ├── photo_001.jpg
    │   │   ├── photo_002.jpg
    │   │   └── photo_003.jpg
    │   │
    │   └── processed/
    │       ├── face_001.jpg
    │       ├── face_002.jpg
    │       └── face_003.jpg
    │
    └── 51bb1af9-9236-4595-91cc-a3c47f042ded/
        ├── original/
        └── processed/
```

Где название папки — это `person_id`.

В базе будет храниться:

```text
person_id: 3a8f6d8e-2d4c-4f90-a310-8a5502c0fd91
name: Oleg
access_enabled: true
```

---

## 8. Original и processed

Для каждого человека нужны две папки.

### original

Полные кадры с камеры.

Используются для:

- просмотра в админ-панели;
- повторной обработки;
- восстановления;
- переобучения;
- перехода на другую модель в будущем.

Пример:

```text
faces/person_id/original/photo_001.jpg
```

### processed

Подготовленные изображения лиц.

Обычно это:

- найденное лицо;
- обрезанное лицо;
- выровненное лицо;
- лицо в нужном размере;
- возможно, изображение в оттенках серого.

Именно эту папку OpenCV будет использовать для обучения или распознавания.

Пример:

```text
faces/person_id/processed/face_001.jpg
```

---

## 9. Логика добавления нового человека

Процесс:

```text
1. Администратор открывает React Admin Panel.
2. Переходит в раздел People.
3. Нажимает Add Person.
4. Вводит имя человека.
5. FastAPI создаёт запись в таблице people.
6. FastAPI создаёт person_id.
7. FastAPI создаёт папки:
   - data/faces/person_id/original
   - data/faces/person_id/processed
8. Администратор нажимает Capture Photos.
9. FastAPI создаёт команду для Raspberry Pi.
10. Raspberry Pi получает команду.
11. Raspberry Pi делает серию фотографий.
12. OpenCV ищет лицо на каждом кадре.
13. Система проверяет качество фото.
14. Оригиналы сохраняются в original.
15. Обрезанные лица сохраняются в processed.
16. FastAPI записывает информацию о фото в person_photos.
17. Администратор подтверждает хорошие фото.
18. FastAPI создаёт команду reload_faces или rebuild_recognition_model.
19. Raspberry Pi обновляет модель OpenCV.
20. Новый человек становится доступен для распознавания.
```

---

## 10. Сколько фотографий нужно для одного человека

Для первой версии желательно делать 10–30 фотографий на человека.

Нужны разные варианты:

- лицо прямо;
- немного влево;
- немного вправо;
- немного вверх;
- немного вниз;
- разное освещение;
- разное расстояние до камеры;
- очки и без очков, если человек носит очки;
- нейтральное лицо;
- лёгкая улыбка.

Не нужно сохранять сотни почти одинаковых кадров.
Это занимает место и не всегда улучшает качество.

---

## 11. OpenCV-распознавание

### Важное правило

Не нужно при каждом кадре заново читать все фотографии из папок.

Плохой вариант:

```text
Каждый кадр с камеры
        ↓
Открыть все папки
        ↓
Загрузить все фотографии
        ↓
Сравнить
```

Это будет медленно, если пользователей и фотографий станет много.

Правильный вариант:

```text
Фотографии изменились
        ↓
OpenCV обучает или обновляет модель
        ↓
Модель сохраняется на диск
        ↓
Сервис распознавания загружает готовую модель
        ↓
Камера использует готовую модель для каждого кадра
```

---

## 12. Если используется OpenCV LBPH

Для Raspberry Pi это простой и удобный вариант для первой версии.

Структура:

```text
data/
├── faces/
│   └── person_id/
│       ├── original/
│       └── processed/
│
└── recognition/
    ├── trainer.yml
    ├── labels.json
    └── model_info.json
```

### trainer.yml

Обученная модель OpenCV LBPH.

### labels.json

Соответствие числовой метки OpenCV и человека.

Пример:

```text
1 -> person_id Олега
2 -> person_id Ивана
3 -> person_id Марии
```

Логика:

```text
OpenCV вернул label = 2
        ↓
labels.json нашёл person_id
        ↓
FastAPI или локальная база вернула имя человека
```

Важно:

- OpenCV label должен быть числом.
- Имя человека не должно быть label.
- Имя хранится в базе.
- Связь должна идти через `person_id`.

---

## 13. Если использовать embeddings в будущем

Более современный вариант:

```text
Кадр
 ↓
OpenCV или DNN находит лицо
 ↓
Модель получает embedding лица
 ↓
Embedding сравнивается с базой известных лиц
 ↓
Возвращается ближайший человек
```

Структура:

```text
data/
└── recognition/
    ├── embeddings.npy
    ├── labels.json
    ├── model_info.json
    └── index.bin
```

Плюсы embeddings:

- выше точность;
- проще добавлять новых людей;
- не всегда нужно полностью переобучать модель;
- удобнее работать с большим количеством фотографий;
- можно хранить несколько embeddings на одного человека.

Минусы:

- сложнее реализация;
- выше нагрузка;
- может потребоваться оптимизация под Raspberry Pi.

Рекомендация:

- Для первой версии можно начать с OpenCV LBPH.
- Для более точной версии позже перейти на embeddings.

---

## 14. Версионирование модели OpenCV

Нельзя удалять старую модель до успешного создания новой.

Рекомендуемая структура:

```text
data/
└── recognition/
    ├── versions/
    │   ├── model_001/
    │   │   ├── trainer.yml
    │   │   ├── labels.json
    │   │   └── model_info.json
    │   │
    │   ├── model_002/
    │   └── model_003/
    │
    ├── current/
    └── previous/
```

Процесс обновления:

```text
1. Добавили или удалили фото.
2. FastAPI создаёт команду rebuild_recognition_model.
3. Raspberry Pi создаёт новую модель во временной папке.
4. Старая модель продолжает работать.
5. Если новая модель успешно обучилась, она становится current.
6. Старая current становится previous.
7. Если новая модель сломалась, система возвращается на previous.
```

---

## 15. Таблицы базы данных

### users

Пользователи админ-панели.

```text
id
username
password_hash
role
is_active
created_at
last_login_at
```

---

### people

Люди, которых система может распознавать.

```text
id
name
description
access_enabled
created_at
updated_at
created_by
deleted_at
```

---

### person_photos

Фотографии людей.

```text
id
person_id
original_path
processed_path
thumbnail_path
is_primary
quality_score
face_detected
width
height
blur_score
brightness_score
file_hash
created_at
created_by
deleted_at
```

---

### devices

Raspberry Pi устройства.

```text
id
name
device_code
status
ip_address
last_seen_at
software_version
camera_status
recognition_status
created_at
```

---

### access_events

События распознавания.

```text
id
device_id
person_id
event_type
confidence
door_opened
photo_path
video_path
created_at
```

Типы событий:

```text
recognized
unknown
access_denied
door_opened
manual_open
recognition_error
```

---

### telemetry

История состояния Raspberry Pi.

```text
id
device_id
cpu_usage
cpu_temperature
ram_usage
disk_usage
uptime
camera_fps
network_status
created_at
```

---

### device_commands

Команды для Raspberry Pi.

```text
id
device_id
command_type
parameters
status
created_by
created_at
started_at
completed_at
result
error_message
```

Статусы команд:

```text
pending
sent
received
running
completed
failed
expired
```

---

### audit_logs

Действия администраторов.

```text
id
user_id
action
entity_type
entity_id
old_value
new_value
ip_address
created_at
```

Примеры действий:

```text
create_person
update_person
delete_person
add_photo
delete_photo
manual_open_door
restart_device
create_backup
restore_backup
```

---

### backups

Информация о резервных копиях.

```text
id
filename
file_path
size
checksum
status
created_by
created_at
```

---

## 16. API-группы FastAPI

```text
/api/v1/auth
/api/v1/users
/api/v1/people
/api/v1/people/{person_id}/photos
/api/v1/events
/api/v1/devices
/api/v1/devices/{device_id}/commands
/api/v1/devices/{device_id}/telemetry
/api/v1/logs
/api/v1/audit
/api/v1/backups
/api/v1/video
/api/v1/system
/ws/devices/{device_id}
/ws/admin
```

React не должен знать реальные пути к папкам.

Правильно:

```text
/api/v1/photos/photo_id/content
```

Неправильно:

```text
/home/pi/FaceGuard/faces/Oleg/photo1.jpg
```

---

## 17. Связь FastAPI и Raspberry Pi

Для первой версии лучше использовать:

- REST API для загрузки фото, событий и логов.
- WebSocket для команд, статусов и онлайн-обновлений.

Схема:

```text
Raspberry Pi Agent подключается к FastAPI через WebSocket
        ↓
FastAPI видит, что устройство online
        ↓
Администратор создаёт команду
        ↓
FastAPI отправляет команду через WebSocket
        ↓
Raspberry Pi выполняет команду
        ↓
Raspberry Pi возвращает результат
        ↓
FastAPI сохраняет результат
        ↓
React показывает статус
```

---

## 18. Удалённые команды для Raspberry Pi

Нужные команды:

```text
capture_person_photos
reload_faces
rebuild_recognition_model
restart_recognition
restart_camera
restart_agent
reboot_device
open_door
collect_logs
get_health_status
```

Каждая команда должна иметь:

- кто создал;
- когда создал;
- для какого устройства;
- тип команды;
- параметры;
- статус;
- результат;
- ошибку, если она есть.

---

## 19. Логика удалённого перезапуска устройства

React не должен напрямую перезапускать Raspberry Pi.

Правильный процесс:

```text
1. Администратор нажимает Reboot Device.
2. React отправляет запрос в FastAPI.
3. FastAPI проверяет права администратора.
4. FastAPI создаёт запись в device_commands.
5. FastAPI записывает audit log.
6. Raspberry Pi получает команду reboot_device.
7. Raspberry Pi подтверждает получение.
8. Raspberry Pi выполняет безопасный reboot.
9. После запуска Raspberry Pi снова отправляет heartbeat.
10. React показывает, что устройство снова online.
```

---

## 20. Телеметрия Raspberry Pi

Raspberry Pi должен отправлять heartbeat каждые 5–10 секунд.

Данные heartbeat:

```text
device_id
current_time
cpu_usage
cpu_temperature
ram_usage
disk_usage
uptime
camera_available
camera_fps
recognition_service_running
servo_available
network_address
software_version
```

В React Dashboard нужно показывать:

- online/offline;
- CPU;
- RAM;
- температура;
- свободное место;
- статус камеры;
- статус распознавания;
- версия агента;
- последнее подключение.

Не нужно хранить телеметрию каждые 10 секунд навсегда.

Рекомендация:

- детальные данные хранить 7 дней;
- средние значения по минутам хранить 30 дней;
- средние значения по часам хранить 1 год.

---

## 21. События распознавания

Когда Raspberry Pi кого-то увидел, он должен создать событие.

### Если человек распознан

```text
1. Камера получает кадр.
2. OpenCV находит лицо.
3. OpenCV распознаёт человека.
4. Проверяется access_enabled.
5. Если доступ разрешён, открывается дверь.
6. Сохраняется фото события.
7. При необходимости сохраняется короткое видео.
8. Raspberry Pi отправляет событие в FastAPI.
9. FastAPI сохраняет событие в access_events.
10. React получает уведомление через WebSocket.
```

### Если человек неизвестный

```text
1. Камера получает кадр.
2. OpenCV находит лицо.
3. Человек не распознан.
4. Дверь не открывается.
5. Сохраняется фото unknown.
6. Создаётся событие unknown.
7. Администратор может позже создать нового человека из этого события.
```

---

## 22. Видео с камеры

FastAPI не должен быть основным видеосервером.

Для живого видео лучше использовать:

- MediaMTX;
- RTSP;
- WebRTC;
- HLS.

Рекомендуемая схема:

```text
Camera on Raspberry Pi
        ↓
RTSP stream
        ↓
MediaMTX
        ↓
WebRTC or HLS
        ↓
React Admin Panel
```

### Для live video

Лучший вариант:

```text
WebRTC
```

Потому что задержка меньше.

### Для истории событий

При событии можно сохранять короткий MP4-клип.

Например:

```text
5 секунд до события
+
10 секунд после события
=
15 секунд видео
```

Не нужно сразу записывать видео круглосуточно.
Это быстро заполнит диск.

---

## 23. Бэкапы

Резервная копия должна включать:

- PostgreSQL dump;
- фотографии людей;
- обработанные лица;
- OpenCV-модель;
- labels.json;
- настройки системы;
- информацию об устройствах;
- manifest.json.

Структура бэкапа:

```text
backup-2026-06-11-180000/
├── database.sql
├── faces/
├── processed/
├── recognition/
├── configuration/
├── manifest.json
└── checksum.sha256
```

### manifest.json

Должен содержать:

```text
system_version
database_version
created_at
people_count
photos_count
recognition_model_type
recognition_model_version
files
checksum
```

### Виды бэкапов

- Полный бэкап.
- Бэкап без видео.
- Только база данных.
- Только фотографии и модель.

### Рекомендация по расписанию

```text
Каждый день: база данных
Каждую неделю: база + фотографии + модель
Хранить последние 7 ежедневных бэкапов
Хранить последние 4 недельных бэкапа
```

Важно:

Бэкап не должен храниться только на той же Raspberry Pi.
Если SD-карта сломается, пропадёт и система, и бэкап.

Лучше дополнительно копировать бэкапы:

- на USB-диск;
- на другой компьютер;
- на NAS;
- в облачное хранилище.

---

## 24. Безопасность

Особенно важно защитить:

- ручное открытие двери;
- удаление людей;
- удаление фотографий;
- перезапуск устройства;
- восстановление бэкапа;
- просмотр камеры;
- системные логи.

Нужно сделать:

- HTTPS;
- JWT-авторизацию;
- роли пользователей;
- audit log;
- отдельный device token для Raspberry Pi;
- ограничение прав;
- проверку загружаемых файлов;
- запрет произвольных путей к файлам;
- защиту от удаления системных папок;
- rate limit для API;
- автоматическое завершение старых сессий;
- резервное копирование.

Для удалённого доступа лучше использовать:

- Tailscale;
- WireGuard;
- домашний VPN.

Не стоит открывать SSH и API Raspberry Pi напрямую в интернет.

---

## 25. Docker

Через Docker Compose можно запускать:

```text
frontend
backend
postgres
nginx
mediamtx
redis
```

### frontend

React Admin Panel.

### backend

FastAPI Backend.

### postgres

Локальная база данных.

### nginx

Единая точка входа:

```text
https://faceguard.local
```

Nginx может:

- раздавать React;
- проксировать `/api` в FastAPI;
- работать с HTTPS;
- ограничивать доступ.

### mediamtx

Видео через RTSP, WebRTC или HLS.

### redis

Можно добавить позже для:

- фоновых задач;
- очередей;
- кеша;
- WebSocket-состояний.

### Raspberry Pi Agent

Агент можно запускать:

- через Docker;
- через systemd.

Для камеры, GPIO и reboot часто удобнее systemd.

---

## 26. Удаление людей и фотографий

Не нужно сразу физически удалять файлы.

Лучше использовать soft delete.

Процесс удаления человека:

```text
1. Администратор нажимает Delete Person.
2. FastAPI проверяет права.
3. В people ставится deleted_at.
4. access_enabled становится false.
5. Папка человека переносится в trash.
6. Создаётся audit log.
7. Запускается rebuild_recognition_model.
8. Через определённое время данные можно удалить окончательно.
```

Структура trash:

```text
data/
└── trash/
    └── people/
        └── person_id/
```

Это защищает от случайного удаления.

---

## 27. Основные страницы React Admin Panel

### Dashboard

- статус устройства;
- CPU;
- RAM;
- температура;
- диск;
- камера;
- распознавание;
- последние события;
- последние неизвестные лица;
- быстрые действия.

### People

- список людей;
- поиск;
- фильтр активных и заблокированных;
- количество фото;
- дата добавления;
- статус доступа.

### Person Details

- имя;
- описание;
- статус доступа;
- список фото;
- основное фото;
- кнопка добавить фото;
- кнопка пересобрать модель;
- история действий.

### Capture Person Photos

- live preview камеры;
- кнопка сделать фото;
- серия фото;
- проверка качества;
- подтверждение фото;
- сохранение.

### Events

- кто пришёл;
- дата;
- confidence;
- дверь открыта или нет;
- фото события;
- видео события;
- фильтр по людям;
- фильтр unknown.

### Devices

- список Raspberry Pi;
- статус online/offline;
- версия ПО;
- последние heartbeat;
- команды устройству.

### Logs

- системные логи;
- ошибки;
- фильтр по уровню;
- скачать архив логов.

### Audit

- действия администраторов;
- кто что сделал;
- когда сделал;
- IP-адрес;
- старые и новые значения.

### Backups

- создать бэкап;
- скачать бэкап;
- удалить старый бэкап;
- восстановить бэкап;
- расписание бэкапов.

---

## 28. Этапы разработки

### Этап 1. Базовая структура проекта

- [ ] Создать папку `faceguard`.
- [ ] Создать `frontend`.
- [ ] Создать `backend`.
- [ ] Создать `raspberry-agent`.
- [ ] Создать `data`.
- [ ] Создать `.env.example`.
- [ ] Создать `docker-compose.yml`.
- [ ] Подготовить README.

---

### Этап 2. FastAPI Backend

- [ ] Создать FastAPI-приложение.
- [ ] Настроить конфиг.
- [ ] Настроить подключение к PostgreSQL.
- [ ] Добавить SQLAlchemy или SQLModel.
- [ ] Добавить Alembic migrations.
- [ ] Создать health check endpoint.
- [ ] Добавить базовую структуру API.
- [ ] Добавить обработку ошибок.
- [ ] Добавить логирование.

---

### Этап 3. База данных

- [ ] Создать таблицу `users`.
- [ ] Создать таблицу `people`.
- [ ] Создать таблицу `person_photos`.
- [ ] Создать таблицу `devices`.
- [ ] Создать таблицу `access_events`.
- [ ] Создать таблицу `telemetry`.
- [ ] Создать таблицу `device_commands`.
- [ ] Создать таблицу `audit_logs`.
- [ ] Создать таблицу `backups`.
- [ ] Проверить миграции.

---

### Этап 4. Авторизация

- [ ] Создать регистрацию первого администратора.
- [ ] Создать вход по username/password.
- [ ] Добавить password hashing.
- [ ] Добавить JWT.
- [ ] Добавить роли.
- [ ] Добавить проверку прав.
- [ ] Добавить logout.
- [ ] Добавить refresh token, если нужно.

---

### Этап 5. Управление людьми

- [ ] Создать API для списка людей.
- [ ] Создать API для создания человека.
- [ ] Создать API для изменения человека.
- [ ] Создать API для блокировки доступа.
- [ ] Создать API для soft delete.
- [ ] Создать автоматическое создание папок человека.
- [ ] Добавить audit log на действия.

---

### Этап 6. Управление фотографиями

- [ ] Создать загрузку фотографии.
- [ ] Сохранять оригинал в `original`.
- [ ] Обрабатывать лицо через OpenCV.
- [ ] Сохранять лицо в `processed`.
- [ ] Создавать thumbnail.
- [ ] Записывать фото в `person_photos`.
- [ ] Добавить удаление фото через soft delete.
- [ ] Добавить выбор основной фотографии.
- [ ] Добавить перемещение фото к другому человеку, если понадобится.

---

### Этап 7. Raspberry Pi Agent

- [ ] Создать Python-сервис агента.
- [ ] Настроить конфиг агента.
- [ ] Добавить device token.
- [ ] Добавить подключение к FastAPI.
- [ ] Добавить heartbeat.
- [ ] Добавить отправку телеметрии.
- [ ] Добавить WebSocket listener.
- [ ] Добавить выполнение команд.
- [ ] Добавить отправку результата команд.

---

### Этап 8. Камера и OpenCV

- [ ] Подключить камеру.
- [ ] Получать кадры.
- [ ] Обнаруживать лицо.
- [ ] Проверять качество кадра.
- [ ] Сохранять original.
- [ ] Сохранять processed.
- [ ] Настроить LBPH recognizer.
- [ ] Создать обучение модели.
- [ ] Создать `trainer.yml`.
- [ ] Создать `labels.json`.
- [ ] Добавить загрузку current model.
- [ ] Добавить распознавание в реальном времени.

---

### Этап 9. Регистрация человека через камеру

- [ ] React отправляет команду capture photos.
- [ ] FastAPI создаёт device command.
- [ ] Raspberry Pi получает команду.
- [ ] Raspberry Pi делает серию фотографий.
- [ ] OpenCV обрабатывает фото.
- [ ] Фото отправляются на сервер.
- [ ] Администратор выбирает хорошие фото.
- [ ] Фото сохраняются за человеком.
- [ ] Создаётся команда rebuild model.
- [ ] Новая модель применяется.

---

### Этап 10. События распознавания

- [ ] Создать API для приёма событий от Raspberry Pi.
- [ ] Сохранять recognized events.
- [ ] Сохранять unknown events.
- [ ] Сохранять confidence.
- [ ] Сохранять photo_path.
- [ ] Сохранять video_path, если есть.
- [ ] Отправлять события в React через WebSocket.
- [ ] Добавить страницу Events в React.

---

### Этап 11. Управление дверью

- [ ] Добавить servo service.
- [ ] Открывать дверь при успешном распознавании.
- [ ] Добавить задержку закрытия.
- [ ] Добавить ручное открытие из админ-панели.
- [ ] Добавить audit log для manual open.
- [ ] Добавить защиту от частых повторных открытий.

---

### Этап 12. Управление устройством

- [ ] Команда restart_camera.
- [ ] Команда restart_recognition.
- [ ] Команда reload_faces.
- [ ] Команда rebuild_recognition_model.
- [ ] Команда restart_agent.
- [ ] Команда reboot_device.
- [ ] Команда collect_logs.
- [ ] Отображение статуса команд в React.

---

### Этап 13. Видео

- [ ] Настроить получение видео с камеры.
- [ ] Выбрать способ: WebRTC, HLS или MJPEG.
- [ ] Настроить MediaMTX.
- [ ] Добавить live view в React.
- [ ] Добавить запись коротких событий.
- [ ] Добавить сохранение MP4.
- [ ] Добавить превью видео.
- [ ] Добавить просмотр видео события.

---

### Этап 14. Логи

- [ ] Настроить системные логи backend.
- [ ] Настроить системные логи agent.
- [ ] Добавить API просмотра логов.
- [ ] Добавить команду collect_logs.
- [ ] Добавить скачивание архива логов.
- [ ] Добавить audit log для действий пользователей.

---

### Этап 15. Бэкапы

- [ ] Создать backup service.
- [ ] Делать PostgreSQL dump.
- [ ] Архивировать faces.
- [ ] Архивировать recognition model.
- [ ] Создавать manifest.json.
- [ ] Создавать checksum.
- [ ] Сохранять запись в backups.
- [ ] Добавить скачивание бэкапа.
- [ ] Добавить восстановление бэкапа.
- [ ] Добавить расписание автоматических бэкапов.

---

### Этап 16. Docker и запуск

- [ ] Создать Dockerfile для backend.
- [ ] Создать Dockerfile для frontend.
- [ ] Добавить PostgreSQL в docker-compose.
- [ ] Добавить nginx.
- [ ] Добавить mediamtx.
- [ ] Добавить volume для data.
- [ ] Добавить volume для postgres.
- [ ] Проверить запуск одной командой.
- [ ] Подготовить production compose.

---

### Этап 17. Безопасность

- [ ] Включить HTTPS.
- [ ] Настроить роли.
- [ ] Защитить команды устройства.
- [ ] Защитить ручное открытие двери.
- [ ] Защитить видео.
- [ ] Защитить файлы.
- [ ] Запретить произвольные пути.
- [ ] Добавить rate limit.
- [ ] Добавить device token.
- [ ] Настроить VPN или Tailscale.

---

### Этап 18. Финальная проверка

- [ ] Проверить добавление человека.
- [ ] Проверить фото через камеру.
- [ ] Проверить обучение модели.
- [ ] Проверить распознавание.
- [ ] Проверить открытие двери.
- [ ] Проверить unknown person.
- [ ] Проверить события.
- [ ] Проверить телеметрию.
- [ ] Проверить удалённый reboot.
- [ ] Проверить сбор логов.
- [ ] Проверить бэкап.
- [ ] Проверить восстановление из бэкапа.

---

## 29. Рекомендуемый минимальный MVP

Чтобы не делать всё сразу, лучше начать с MVP.

### MVP 1

- [ ] FastAPI запускается.
- [ ] PostgreSQL работает.
- [ ] Можно создать человека.
- [ ] Можно загрузить фото человека.
- [ ] Фото сохраняются в правильные папки.
- [ ] Есть таблица people.
- [ ] Есть таблица person_photos.

### MVP 2

- [ ] Raspberry Pi Agent подключается к серверу.
- [ ] Отправляет heartbeat.
- [ ] Отправляет телеметрию.
- [ ] Получает команду.
- [ ] Возвращает результат команды.

### MVP 3

- [ ] Через админ-панель можно сделать фото с камеры.
- [ ] Фото сохраняется за человеком.
- [ ] OpenCV обрезает лицо.
- [ ] Фото попадает в processed.

### MVP 4

- [ ] OpenCV обучает LBPH-модель.
- [ ] Создаётся trainer.yml.
- [ ] Создаётся labels.json.
- [ ] Raspberry Pi распознаёт человека.
- [ ] При совпадении открывает дверь.

### MVP 5

- [ ] Событие распознавания отправляется в FastAPI.
- [ ] Событие видно в React.
- [ ] Unknown person тоже сохраняется.

### MVP 6

- [ ] Можно перезапустить сервис распознавания.
- [ ] Можно перезапустить Raspberry Pi.
- [ ] Можно собрать логи.
- [ ] Все действия пишутся в audit log.

---

## 30. Главные решения по архитектуре

- [x] Backend делать на FastAPI.
- [x] Frontend делать на React.
- [x] Распознавание делать на Raspberry Pi через OpenCV.
- [x] Фотографии хранить в папках.
- [x] В базе хранить пути и метаданные.
- [x] Для папок людей использовать UUID, а не имя.
- [x] Хранить original и processed фотографии отдельно.
- [x] Использовать PostgreSQL локально.
- [x] Для команд использовать FastAPI + WebSocket.
- [x] Для видео использовать отдельный streaming-подход, а не обычный REST API.
- [x] Для первой версии можно использовать OpenCV LBPH.
- [x] В будущем можно перейти на embeddings.
- [x] Добавить бэкапы, чтобы не регистрировать людей заново.

---

## 31. Что важно не забыть

- Не давать React прямой доступ к файловой системе.
- Не хранить фотографии прямо в PostgreSQL.
- Не использовать имя человека как название основной папки.
- Не удалять фотографии сразу навсегда.
- Не переобучать модель прямо во время активного распознавания без fallback.
- Не открывать Raspberry Pi API напрямую в интернет.
- Не делать reboot без audit log.
- Не делать ручное открытие двери без проверки роли пользователя.
- Не хранить бэкап только на той же SD-карте.
- Не записывать видео постоянно без ограничения размера.

---

## 32. Итоговая рекомендуемая схема

```text
Frontend:
React Admin Panel

Backend:
FastAPI

Database:
PostgreSQL

Files:
Local file storage with UUID folders

Recognition:
OpenCV LBPH for first version
Possible embeddings later

Device communication:
REST + WebSocket

Video:
MediaMTX + WebRTC/HLS

Deployment:
Docker Compose

Raspberry Pi service:
Python Agent via systemd or Docker

Remote access:
Tailscale / WireGuard / VPN

Backup:
PostgreSQL dump + faces + recognition model + config
```

---

## 33. Следующий практический шаг

Начинать лучше не с камеры и не с распознавания.

Правильный порядок:

```text
1. FastAPI + PostgreSQL + Docker
2. Таблицы people и person_photos
3. API создания человека
4. API загрузки фото
5. Правильное сохранение файлов по папкам
6. Raspberry Pi Agent heartbeat
7. Команды через WebSocket
8. Фото с камеры через админ-панель
9. OpenCV обработка фото
10. Обучение модели
11. Распознавание
12. Открытие двери
13. Логи, бэкапы, видео
```

Так проект будет развиваться стабильно и без хаоса.
