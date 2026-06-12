# FaceGuard Raspberry Pi Agent

Отдельный offline-first Python-сервис для устройства FaceGuard. Он работает:

- на Raspberry Pi с реальной камерой и GPIO-сервоприводом;
- на Windows для разработки и проверки с веб-камерой и имитацией сервопривода;
- без подключения к интернету после установки зависимостей;
- самостоятельно, даже если центральный FastAPI-сервер временно недоступен.

## Что уже реализовано

- фоновое получение кадров с камеры;
- автоматический переход на симулированную камеру, если камера недоступна;
- OpenCV Haar Cascade для обнаружения лица;
- OpenCV LBPH для распознавания;
- регистрация человека серией фотографий;
- хранение `original` и `processed` фотографий;
- обучение и безопасная перезагрузка модели;
- автоматическое открытие двери при распознавании;
- mock-сервопривод на Windows;
- GPIO-сервопривод на Raspberry Pi через `gpiozero`;
- heartbeat/телеметрия;
- локальная SQLite-очередь событий;
- фотографии событий `recognized` и `unknown`;
- команды устройства;
- перезапуск сервиса и Raspberry Pi с безопасным флагом;
- сбор логов в ZIP;
- MJPEG-видеопоток для тестов;
- WebSocket событий для будущей React-панели;
- необязательная синхронизация с будущим центральным FastAPI.

## Архитектура

```text
CameraService ──> RecognitionService ──> DoorController
      │                   │                    │
      │                   ├── event photo      ├── GPIO on Raspberry Pi
      │                   ├── SQLite event     └── mock on Windows
      │                   └── WebSocket event
      │
      └── snapshot / MJPEG stream

TelemetryService ──> local API
                 └── optional CentralClient

CentralClient:
- heartbeat;
- batch synchronization of unsynced events;
- polling remote commands;
- works only when CENTRAL_SERVER_URL is configured.
```

## Структура данных

```text
data/
├── faces/
│   └── person_id/
│       ├── person.json
│       ├── original/
│       └── processed/
├── models/
│   ├── face_model.yml
│   └── labels.json
├── events/YYYY/MM/DD/
├── logs/
├── backups/
└── agent.db
```

`person_id` должен быть постоянным идентификатором. Имя человека хранится в `person.json`, поэтому имя можно изменить без переименования папки.

## Быстрый запуск на Windows

Требуется Python 3.11 x64.

```powershell
cd raspberry-agent
PowerShell -ExecutionPolicy Bypass -File .\scripts\run_windows.ps1
```

После запуска:

```text
Swagger:   http://127.0.0.1:8081/docs
Health:    http://127.0.0.1:8081/api/v1/health
```

По умолчанию API-ключ:

```text
change-me-agent-key
```

Для защищённых запросов добавляется заголовок:

```text
X-Agent-Key: change-me-agent-key
```

Проверка основных функций:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\test_api_windows.ps1
```

Поток камеры можно проверить в Swagger или запросом:

```text
GET /api/v1/camera/stream
```

Обычная вкладка браузера не умеет добавить заголовок `X-Agent-Key`. Для прямой проверки можно временно использовать Swagger. В React заголовок будет передаваться программно.

## Регистрация человека

### 1. Сделать серию фотографий с камеры

```http
POST /api/v1/people/oleg-uuid/capture
X-Agent-Key: change-me-agent-key
Content-Type: application/json

{
  "display_name": "Oleg",
  "count": 15,
  "interval_seconds": 0.35,
  "strict_face_detection": true
}
```

Сохраняются:

```text
data/faces/oleg-uuid/original/*.jpg
data/faces/oleg-uuid/processed/*.jpg
```

### 2. Обучить модель

```http
POST /api/v1/recognition/train
X-Agent-Key: change-me-agent-key
```

### 3. Проверить модель

```http
GET /api/v1/recognition/status
X-Agent-Key: change-me-agent-key
```

После обучения фоновый цикл автоматически распознаёт лица и открывает дверь.

## Важное про LBPH confidence

Значение, которое возвращает LBPH, не является настоящим процентом вероятности. Это расстояние: чем оно меньше, тем ближе лицо к обученным изображениям.

```text
 distance < RECOGNITION_THRESHOLD  -> знакомый человек
 distance >= RECOGNITION_THRESHOLD -> неизвестный человек
```

Начальное значение `65` нужно откалибровать на реальных фотографиях. Для тестов можно проверять диапазон примерно от 45 до 80 и смотреть количество ложных допусков и отказов.

## Основные API

| Метод | Адрес | Назначение |
|---|---|---|
| GET | `/api/v1/health` | Состояние агента |
| GET | `/api/v1/telemetry` | CPU, RAM, диск, температура, камера |
| GET | `/api/v1/camera/snapshot` | Текущий JPEG-кадр |
| GET | `/api/v1/camera/stream` | MJPEG-поток |
| GET | `/api/v1/people` | Локальные люди и количество фото |
| POST | `/api/v1/people/{id}/capture` | Серия фото с камеры |
| POST | `/api/v1/people/{id}/photos` | Загрузка фото файлом |
| POST | `/api/v1/recognition/train` | Обучение LBPH |
| POST | `/api/v1/recognition/reload` | Перезагрузка модели |
| POST | `/api/v1/door/open` | Ручное открытие двери |
| GET | `/api/v1/events` | Локальные события |
| POST | `/api/v1/commands/execute` | Выполнение унифицированной команды |
| POST | `/api/v1/system/collect-logs` | Создание ZIP с диагностикой |
| POST | `/api/v1/system/restart-agent` | Перезапуск агента |
| POST | `/api/v1/system/reboot` | Перезагрузка устройства |
| WS | `/ws/events?api_key=...` | События в реальном времени |

## Команды

`POST /api/v1/commands/execute` принимает:

- `open_door`;
- `reload_faces`;
- `train_model`;
- `capture_photos`;
- `collect_logs`;
- `restart_agent`;
- `reboot_device`.

На Windows `restart_agent` и `reboot_device` только записываются как симуляция. Реальные команды запрещены, пока `SYSTEM_COMMANDS_ENABLED=false`.

## Запуск на Raspberry Pi

Рекомендуется Raspberry Pi OS 64-bit и Python 3.11+.

```bash
cd raspberry-agent
chmod +x scripts/run_linux.sh
./scripts/run_linux.sh
```

В `.env`:

```env
HARDWARE_MODE=raspberry_pi
SERVO_GPIO_PIN=17
SYSTEM_COMMANDS_ENABLED=false
```

Сначала проверь камеру и сервопривод при `SYSTEM_COMMANDS_ENABLED=false`. Затем установи systemd unit и правила sudo.

```bash
sudo mkdir -p /opt/faceguard
sudo cp -r raspberry-agent /opt/faceguard/
sudo cp infrastructure/faceguard-agent.service /etc/systemd/system/
sudo cp infrastructure/faceguard-agent-sudoers /etc/sudoers.d/faceguard-agent
sudo chmod 440 /etc/sudoers.d/faceguard-agent
sudo visudo -cf /etc/sudoers.d/faceguard-agent
sudo systemctl daemon-reload
sudo systemctl enable --now faceguard-agent
```

После проверки можно изменить:

```env
SYSTEM_COMMANDS_ENABLED=true
```

Для уменьшения дрожания сервопривода рекомендуется использовать `pigpio` pin factory. Настройка зависит от конкретного подключения и будет добавлена на этапе работы с реальным сервоприводом.

## Docker

Docker предназначен прежде всего для Linux/Raspberry Pi:

```bash
cp .env.example .env
docker compose up --build
```

На Windows агент лучше запускать нативно через `run_windows.ps1`, потому что Docker Desktop не предоставляет веб-камеру как стандартное Linux-устройство `/dev/video0`.

## Полностью офлайн-установка

### Подготовка на Windows с интернетом

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\download_wheels_windows.ps1
```

Скопируй на офлайн-компьютер всю папку проекта вместе с `wheelhouse/`.

### Установка на офлайн-Windows

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\install_offline_windows.ps1
.\.venv\Scripts\python.exe main.py
```

Для Raspberry Pi wheel-файлы нужно скачивать именно для его архитектуры и версии Python. Самый надёжный способ — создать `wheelhouse` на другом Raspberry Pi с такой же ОС и Python.

## Контракт с будущим центральным FastAPI

Когда будет задан `CENTRAL_SERVER_URL`, агент ожидает такие маршруты:

```text
POST /api/v1/devices/{device_id}/heartbeat
POST /api/v1/devices/{device_id}/events/batch
GET  /api/v1/devices/{device_id}/commands/next
POST /api/v1/devices/{device_id}/commands/{command_id}/result
```

Пока адрес пустой, агент ничего не отправляет наружу. Все события сохраняются в `data/agent.db` и продолжают работать офлайн.

## Тесты

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest -q
```

Тесты используют симулированную камеру и mock-сервопривод. Реальное распознавание необходимо дополнительно проверить на Windows-веб-камере и на Raspberry Pi.

## Что делать следующим этапом

- [ ] Запустить агент на Windows.
- [ ] Проверить `/docs`, snapshot и телеметрию.
- [ ] Зарегистрировать человека через `/capture`.
- [ ] Обучить LBPH.
- [ ] Проверить распознавание и подобрать threshold.
- [ ] Подключить реальный сервопривод на Raspberry Pi.
- [ ] Настроить systemd.
- [ ] Создать центральный FastAPI по указанному контракту.
- [ ] Подключить React к центральному FastAPI.
- [ ] Заменить тестовый MJPEG на WebRTC/MediaMTX для основной видеосистемы.

## Если появляется `module 'cv2' has no attribute 'face'`

В окружении одновременно установлены обычный OpenCV и contrib-вариант либо установлен только обычный пакет. Удали конфликтующие пакеты и установи зависимости проекта заново:

```powershell
.\.venv\Scripts\python.exe -m pip uninstall -y opencv-python opencv-python-headless opencv-contrib-python opencv-contrib-python-headless
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Проверка:

```powershell
.\.venv\Scripts\python.exe -c "import cv2; print(cv2.__version__); print(hasattr(cv2, 'face'))"
```

Последнее значение должно быть `True`.

Для проверки Docker без камеры:

```bash
docker compose -f docker-compose.simulation.yml up --build
```
