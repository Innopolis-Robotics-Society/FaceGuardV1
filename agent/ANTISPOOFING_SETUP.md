# MiniFASNet Anti-Spoofing Setup Guide

## Обзор

FaceGuard использует **MiniFASNet** из проекта [Silent-Face-Anti-Spoofing](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing) для продвинутой защиты от подмены лица.

MiniFASNet детектирует:
- 📄 **Printed photos** (фото на бумаге)
- 📱 **Digital photos** (фото на экране телефона)
- 🎥 **Video replay attacks** (видео на экране)
- 🎭 **3D masks** (базовая защита)

## Автоматическая установка (рекомендуется)

Модель **загружается автоматически** при запуске:

### Вариант 1: Docker Compose
```bash
# Модель скачается автоматически при сборке образа
docker-compose up --build
```

### Вариант 2: Локальный запуск через Python
```bash
# Модель скачается автоматически при первом запуске
python main.py
```

Agent автоматически проверит наличие модели и скачает её при необходимости.

## Ручная установка (если автоматическая не сработала)

### Способ 1: Через скрипт загрузки

```bash
cd agent

# Скачать все модели
python scripts/download_models.py

# Скачать с перезаписью существующих
python scripts/download_models.py --force

# Пропустить опциональные модели
python scripts/download_models.py --skip-optional
```

### Способ 2: Вручную через wget/curl

```bash
cd agent

# Создать директорию
mkdir -p data/models/antispoofing

# Скачать через wget
wget https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/raw/master/resources/anti_spoof_models/2.7_80x80_MiniFASNetV2.pth \
  -O data/models/antispoofing/minifasnet_v2.pth

# ИЛИ через curl
curl -L https://github.com/minivision-ai/Silent-Face-Anti-Spoofing/raw/master/resources/anti_spoof_models/2.7_80x80_MiniFASNetV2.pth \
  -o data/models/antispoofing/minifasnet_v2.pth
```

### Способ 3: Скачать через браузер

1. Откройте https://github.com/minivision-ai/Silent-Face-Anti-Spoofing
2. Перейдите в `resources/anti_spoof_models/`
3. Скачайте файл `2.7_80x80_MiniFASNetV2.pth`
4. Положите в `agent/data/models/antispoofing/minifasnet_v2.pth`

## Проверка установки

```bash
# Проверить наличие файла
ls -lh agent/data/models/antispoofing/minifasnet_v2.pth

# Должен быть примерно 2-3 MB
# Пример вывода:
# -rw-r--r-- 1 user user 2.5M Jul 10 16:00 minifasnet_v2.pth
```

## Конфигурация

### Включение anti-spoofing

Отредактируйте `.env`:

```env
# MiniFASNet Anti-Spoofing (advanced CNN-based detection)
ANTISPOOFING_ENABLED=true
ANTISPOOFING_THRESHOLD=0.5
ANTISPOOFING_MODEL_PATH=data/models/antispoofing/minifasnet_v2.pth
ANTISPOOFING_DEVICE=cpu
```

### Параметры

| Параметр | Описание | Значение по умолчанию |
|----------|----------|----------------------|
| `ANTISPOOFING_ENABLED` | Включить/выключить MiniFASNet | `false` |
| `ANTISPOOFING_THRESHOLD` | Порог уверенности (0-1, выше = строже) | `0.5` |
| `ANTISPOOFING_MODEL_PATH` | Путь к файлу модели | `data/models/antispoofing/minifasnet_v2.pth` |
| `ANTISPOOFING_DEVICE` | Устройство для вычислений | `cpu` (или `cuda` если есть GPU) |

### Рекомендуемые настройки

**Высокая безопасность (строго):**
```env
ANTISPOOFING_ENABLED=true
ANTISPOOFING_THRESHOLD=0.7
```

**Сбалансированная (рекомендуется):**
```env
ANTISPOOFING_ENABLED=true
ANTISPOOFING_THRESHOLD=0.5
```

**Мягкая (меньше ложных отказов):**
```env
ANTISPOOFING_ENABLED=true
ANTISPOOFING_THRESHOLD=0.3
```

## Проверка работы

### 1. Запустите agent

```bash
docker-compose up
```

### 2. Проверьте логи

Должны появиться строки:

```
INFO - MiniFASNet model loaded successfully from data/models/antispoofing/minifasnet_v2.pth
INFO - MiniFASNet anti-spoofing enabled (threshold: 0.5)
```

### 3. Тестирование

Попробуйте показать камере:

**Реальное лицо:**
```
INFO - Anti-spoofing check passed: real face detected (confidence: 0.92)
INFO - Person recognized: {person_id} (confidence: 45.2)
```

**Фото на экране телефона:**
```
WARNING - Anti-spoofing check failed: fake (confidence: 0.85) scores: {'real': 0.15, 'fake_print': 0.12, 'fake_replay': 0.73}
```

## Troubleshooting

### Модель не загружается

**Проблема:**
```
WARNING - MiniFASNet model not found: data/models/antispoofing/minifasnet_v2.pth
WARNING - MiniFASNet enabled but model not loaded - download model weights first
```

**Решение:**
1. Проверьте интернет-соединение
2. Скачайте модель вручную (см. выше)
3. Проверьте права доступа к директории `data/models/antispoofing/`

### Модель загружена, но ошибка при загрузке

**Проблема:**
```
ERROR - Error loading MiniFASNet model: ...
```

**Решение:**
1. Проверьте размер файла (должен быть ~2.5 MB):
   ```bash
   ls -lh data/models/antispoofing/minifasnet_v2.pth
   ```

2. Если размер не совпадает, удалите и скачайте заново:
   ```bash
   rm data/models/antispoofing/minifasnet_v2.pth
   python scripts/download_models.py --force
   ```

3. Проверьте версию PyTorch:
   ```bash
   python -c "import torch; print(torch.__version__)"
   # Должна быть >= 2.0.0
   ```

### Anti-spoofing слишком строгий (отказывает реальным лицам)

**Решение:**
```env
# Понизить порог
ANTISPOOFING_THRESHOLD=0.3
```

### Anti-spoofing слишком мягкий (пропускает фото)

**Решение:**
```env
# Повысить порог
ANTISPOOFING_THRESHOLD=0.7
```

### Низкая производительность на Raspberry Pi

**Решение:**
1. Используйте CPU (по умолчанию):
   ```env
   ANTISPOOFING_DEVICE=cpu
   ```

2. Если слишком медленно, используйте только базовый Liveness Detector:
   ```env
   ANTISPOOFING_ENABLED=false
   LIVENESS_ENABLED=true
   ```

## Комбинирование с Liveness Detection

Для максимальной безопасности используйте оба метода:

```env
# Базовая проверка (blink, motion, texture)
LIVENESS_ENABLED=true
LIVENESS_BLINK_REQUIRED=false
LIVENESS_MOTION_REQUIRED=false

# Продвинутая CNN-based проверка
ANTISPOOFING_ENABLED=true
ANTISPOOFING_THRESHOLD=0.5
```

**Порядок проверок:**
1. Face Detection (Haar Cascade)
2. **Liveness Detection** (текстура, моргание, движение)
3. **MiniFASNet Anti-Spoofing** (CNN детекция подмены)
4. Face Recognition (LBPH/DeepFace)

Если любая из проверок провалена → доступ запрещён.

## Архитектура MiniFASNet

```
Input: 80x80x3 RGB face crop
↓
Conv1 (3→64) + BN + ReLU + MaxPool
↓
Conv2 (64→128) + BN + ReLU + MaxPool
↓
Conv3 (128→196) + BN + ReLU + MaxPool
↓
Conv4 (196→128) + BN + ReLU
↓
Conv5 (128→128) + BN + ReLU
↓
Conv6 (128→128, 5x5) + BN + ReLU
↓
Fully Connected (128→3)
↓
Output: [real, fake_print, fake_replay]
```

**Параметры модели:** ~350K  
**Inference time:** ~15-30ms (CPU), ~2-5ms (GPU)

## Дополнительные ресурсы

- [Silent-Face-Anti-Spoofing GitHub](https://github.com/minivision-ai/Silent-Face-Anti-Spoofing)
- [MiniFASNet Paper](https://arxiv.org/abs/1901.00488)
- [FaceGuard Architecture](./ARCHITECTURE.md)
- [Recognition Models Guide](./RECOGNITION_MODELS.md)

## Примечания

- MiniFASNet обучена на датасетах CASIA-FASD, Replay-Attack, OULU-NPU
- Модель работает лучше при хорошем освещении
- Рекомендуется держать лицо на расстоянии 30-100 см от камеры
- Для продакшена рекомендуется GPU (Raspberry Pi 4 с Google Coral USB Accelerator)
