# Запуск FaceGuard Agent на Raspberry Pi 5

## Исправленные проблемы

### 1. CUDA/NVIDIA зависимости
**Проблема:** PyTorch по умолчанию устанавливает версию с CUDA, что не нужно для Raspberry Pi.

**Решение:** В `requirements.txt` добавлены условные зависимости для ARM64:
```
torch==2.0.0+cpu; platform_machine == 'aarch64'
torchvision==0.15.1+cpu; platform_machine == 'aarch64'
```

### 2. Пакет libcamera-apps
**Проблема:** `libcamera-apps` недоступен в стандартных репозиториях Debian Bookworm.

**Решение:** Убран из Dockerfile. Для работы с камерой достаточно:
- `libcamera-dev` (библиотека разработчика)
- `picamera2` (Python библиотека, устанавливается через pip)

### 3. Anti-spoofing на CPU
Убедитесь что в `.env` или `.env.raspberry` установлено:
```
ANTISPOOFING_DEVICE=cpu
```

## Установка на Raspberry Pi 5

1. Клонируйте репозиторий:
```bash
cd /home/pi
git clone <ваш-репозиторий>
cd FaceGuardV1/agent
```

2. Скопируйте конфигурацию:
```bash
cp .env.raspberry .env
```

3. Отредактируйте `.env`:
```bash
nano .env
```
Укажите:
- `BACKEND_URL` - адрес вашего backend сервера
- `DEVICE_ID` - получите после регистрации устройства
- `DEVICE_CODE` - уникальный код устройства

4. Запустите Docker Compose:
```bash
docker compose up -d
```

## Проверка работы

```bash
# Проверить статус контейнера
docker compose ps

# Посмотреть логи
docker compose logs -f agent

# Остановить
docker compose down
```

## Доступ к камере

Контейнер автоматически получает доступ к:
- `/dev/video0` - USB камера
- `/dev/vchiq` - Raspberry Pi Camera Module
- `/dev/gpiomem` - GPIO для управления

Если камера не работает, попробуйте:
```bash
# В docker-compose.yml раскомментируйте:
privileged: true
```

## Тестирование светодиодов

```bash
# Метод 1: Через Python модуль (рекомендуется)
cd /home/pi/FaceGuardV1/agent
python3 -m scripts.test_leds

# Метод 2: Через shell wrapper
cd /home/pi/FaceGuardV1/agent/scripts
chmod +x test_led.sh
./test_led.sh
```

Подробнее см. `RUNNING_SCRIPTS.md`.

## Troubleshooting

### Ошибка "Unable to locate package libcamera-apps"
Это исправлено - пакет убран из зависимостей.

### PyTorch пытается загрузить CUDA
Убедитесь что используете обновленный `requirements.txt` с CPU-only версиями для ARM64.

### Камера не определяется
```bash
# Проверьте доступность камеры на хосте
ls -l /dev/video*
libcamera-hello --list-cameras

# Перезапустите с privileged режимом
docker compose down
# Отредактируйте docker-compose.yml: privileged: true
docker compose up -d
```
