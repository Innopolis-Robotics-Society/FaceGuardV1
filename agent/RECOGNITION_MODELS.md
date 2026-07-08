# Face Recognition Models Guide

## Overview

FaceGuard поддерживает две модели распознавания лиц:

1. **LBPH (Local Binary Patterns Histograms)** - быстрая, работает оффлайн
2. **DeepFace** - более точная, поддерживает несколько моделей глубокого обучения

## Переключение между моделями

### Использование LBPH (по умолчанию)

В файле `.env`:
```env
RECOGNITION_MODEL=lbph
RECOGNITION_THRESHOLD=70
```

**Характеристики:**
- ✅ Быстрая работа
- ✅ Работает на слабых устройствах (Raspberry Pi)
- ✅ Не требует интернет
- ❌ Средняя точность
- 📊 Порог: 50-100 (меньше = строже)

### Использование DeepFace

В файле `.env`:
```env
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=Facenet
DEEPFACE_DISTANCE_METRIC=cosine
```

**Доступные модели DeepFace:**

| Модель | Точность | Скорость | Рекомендация |
|--------|----------|----------|--------------|
| **Facenet** | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | **Лучший баланс** |
| Facenet512 | ⭐⭐⭐⭐⭐ | ⚡⚡ | Максимальная точность |
| ArcFace | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | Отлично для продакшена |
| VGG-Face | ⭐⭐⭐⭐ | ⚡⚡ | Классика |
| Dlib | ⭐⭐⭐⭐ | ⚡⚡⚡ | Хорошая скорость |
| OpenFace | ⭐⭐⭐ | ⚡⚡⚡⚡ | Самая быстрая |
| DeepFace | ⭐⭐⭐ | ⚡⚡ | Facebook модель |
| DeepID | ⭐⭐⭐ | ⚡⚡ | Старая модель |

**Метрики расстояния:**
- `cosine` - косинусное расстояние (рекомендуется)
- `euclidean` - евклидово расстояние
- `euclidean_l2` - нормализованное евклидово

## Установка

### Для LBPH
```bash
pip install opencv-contrib-python numpy
```

### Для DeepFace
```bash
pip install -r requirements.txt
```

При первом запуске DeepFace автоматически скачает выбранную модель (~100-500MB).

## Использование

### 1. Выбор модели

Отредактируй `agent/.env`:

```env
# Для LBPH
RECOGNITION_MODEL=lbph
RECOGNITION_THRESHOLD=70

# Для DeepFace
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=Facenet
DEEPFACE_DISTANCE_METRIC=cosine
```

### 2. Обучение модели

После изменения модели нужно переобучить:

```bash
# Через API
POST /api/v1/commands
{
  "type": "rebuild_model"
}
```

Или через backend интерфейс.

### 3. Проверка статуса

```bash
# Посмотри логи при старте агента
cd agent
python main.py
```

В логах увидишь:
```
INFO - Initializing recognition service with model: deepface
INFO - DeepFace loaded with model: Facenet
```

## Сравнение производительности

### LBPH
- Обучение: ~1-5 секунд на 10 человек
- Распознавание: ~30-50ms на кадр
- Память: ~10MB

### DeepFace (Facenet)
- Обучение: ~30-60 секунд на 10 человек
- Распознавание: ~200-500ms на кадр
- Память: ~200MB

## Рекомендации

### Для Raspberry Pi 3/4
```env
RECOGNITION_MODEL=lbph
```
или
```env
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=OpenFace  # самая быстрая
```

### Для мощного ПК / сервера
```env
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=Facenet512  # максимальная точность
DEEPFACE_DISTANCE_METRIC=cosine
```

### Для максимальной точности
```env
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=ArcFace
DEEPFACE_DISTANCE_METRIC=cosine
```

## Troubleshooting

### DeepFace не устанавливается
```bash
# Установи TensorFlow отдельно
pip install tensorflow==2.16.1
pip install deepface
```

### Модель не распознаёт лица
1. Проверь пороги в `.env`
2. Убедись, что модель обучена (`rebuild_model`)
3. Добавь больше фотографий для каждого человека (минимум 5-10)

### Слишком медленно
1. Используй `LBPH` вместо DeepFace
2. Или используй `OpenFace` модель DeepFace
3. Уменьши разрешение камеры

## Файлы моделей

### LBPH
- `data/models/face_model.yml` - обученная модель
- `data/models/labels.json` - соответствие меток и ID людей

### DeepFace
- `data/models/deepface_embeddings_facenet.json` - embeddings для Facenet
- `data/models/deepface_embeddings_arcface.json` - embeddings для ArcFace
- И т.д. для каждой модели отдельно

## API изменения

Все существующие API endpoints продолжают работать без изменений.
В ответах добавлено поле `"model"`:

```json
{
  "recognized": true,
  "person_id": "uuid-here",
  "confidence": 0.35,
  "model": "DeepFace-Facenet",
  "face_bbox": {...}
}
```

## Миграция с LBPH на DeepFace

1. Остановить агент
2. Изменить `RECOGNITION_MODEL=deepface` в `.env`
3. Запустить агент
4. Вызвать `rebuild_model` команду
5. Готово! Все фотографии будут переобработаны

Старые модели LBPH остаются на диске и можно вернуться обратно в любой момент.
