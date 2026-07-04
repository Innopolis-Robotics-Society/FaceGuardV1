# 🚀 Быстрый старт: Улучшение распознавания лиц

## 📋 Пошаговая инструкция

### Шаг 1: Выбор модели распознавания

Откройте файл `agent/.env` и измените настройки:

#### Вариант A: LBPH (быстрая, для слабого железа)
```env
RECOGNITION_MODEL=lbph
RECOGNITION_THRESHOLD=60
```

#### Вариант B: DeepFace (точная, требует ресурсов) ⭐ Рекомендуется
```env
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=Facenet512
DEEPFACE_DISTANCE_METRIC=cosine
```

### Шаг 2: Перезапустите агент

```bash
# Остановите текущий агент (Ctrl+C)

# Запустите заново
cd agent
python main.py
```

### Шаг 3: Добавьте качественные фотографии

1. Откройте веб-интерфейс: http://localhost:5173
2. Перейдите в раздел **"People"**
3. Выберите человека или создайте нового
4. Нажмите **"Upload Photos"**
5. Загрузите **8-15 качественных фотографий**:
   - ✅ Разные ракурсы (фронт, профиль, 3/4)
   - ✅ Разное освещение
   - ✅ С очками и без (если носит)
   - ✅ Хорошее качество (не размытые)

### Шаг 4: Переобучите модель через веб-интерфейс

#### Способ 1: Через System (рекомендуется)
1. Перейдите в раздел **"System"**
2. Найдите кнопку **"Restart Recognition Service"**
3. Нажмите и подтвердите
4. Модель автоматически переобучится при перезапуске

#### Способ 2: Через API (для продвинутых)
```bash
# Получите device_id вашего устройства
curl http://localhost:8000/api/v1/devices

# Отправьте команду на переобучение
curl -X POST "http://localhost:8000/api/v1/commands/devices/{DEVICE_ID}/rebuild-model" \
  -H "Content-Type: application/json"
```

#### Способ 3: Вручную на устройстве
```bash
# Зайдите в консоль агента
cd agent

# Запустите скрипт переобучения
python -c "from recognition.recognizer import RecognitionService; r = RecognitionService(); print(r.train_model())"
```

### Шаг 5: Проверьте работу

1. Перейдите в раздел **"Live Camera"**
2. Проверьте, что камера работает
3. Подойдите к камере и проверьте распознавание
4. Обратите внимание на **confidence** (уверенность):
   - 🟢 > 70% — отлично
   - 🟡 50-70% — средне (нужно больше фото)
   - 🔴 < 50% — плохо (переобучите с большим количеством фото)

---

## ⚡ Быстрое сравнение моделей

| Модель | Скорость | Точность | Железо | Команда |
|--------|----------|----------|--------|---------|
| **LBPH** | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | Любое | `RECOGNITION_MODEL=lbph` |
| **DeepFace (OpenFace)** | ⚡⚡⚡ | ⭐⭐⭐⭐ | Среднее | `DEEPFACE_MODEL=OpenFace` |
| **DeepFace (Facenet512)** | ⚡⚡ | ⭐⭐⭐⭐⭐ | Хорошее | `DEEPFACE_MODEL=Facenet512` ⭐ |
| **DeepFace (ArcFace)** | ⚡ | ⭐⭐⭐⭐⭐ | Мощное | `DEEPFACE_MODEL=ArcFace` |

---

## 🎯 Рекомендованная конфигурация для начала

Создайте или измените `agent/.env`:

```env
# Backend connection
BACKEND_URL=http://localhost:8000
DEVICE_ID=932d50cf-f57b-42fb-bd9b-259f82c634ce
DEVICE_CODE=rpi-main-002

# Hardware mode
HARDWARE_MODE=development

# Camera settings
CAMERA_INDEX=0
CAMERA_WIDTH=1280
CAMERA_HEIGHT=720
CAMERA_FPS=30

# Recognition - ОПТИМИЗИРОВАННАЯ НАСТРОЙКА ⭐
RECOGNITION_MODEL=deepface
DEEPFACE_MODEL=Facenet512
DEEPFACE_DISTANCE_METRIC=cosine

# Если DeepFace слишком медленный, используйте:
# RECOGNITION_MODEL=lbph
# RECOGNITION_THRESHOLD=60

# Face detection - улучшенные параметры
MIN_FACE_SIZE=100
FACE_SCALE_FACTOR=1.1
FACE_MIN_NEIGHBORS=6

# Door control
SERVO_GPIO_PIN=17
DOOR_OPEN_DURATION=5
ACTION_COOLDOWN_SECONDS=5

# Sync settings
HEARTBEAT_INTERVAL=10
TELEMETRY_INTERVAL=30
SYNC_INTERVAL=60
COMMAND_POLL_INTERVAL=5

# Stream server
STREAM_PORT=8001

# Logging
LOG_LEVEL=INFO
```

---

## 🔧 Тонкая настройка порога распознавания

### Для LBPH:
```env
RECOGNITION_THRESHOLD=50   # Очень строго (меньше ложных срабатываний)
RECOGNITION_THRESHOLD=60   # Сбалансировано ⭐ Рекомендуется
RECOGNITION_THRESHOLD=70   # По умолчанию
RECOGNITION_THRESHOLD=80   # Мягко (больше распознает, но больше ошибок)
```

### Для DeepFace:
Порог настраивается автоматически внутри модели. Если нужно изменить:
- Отредактируйте `agent/recognition/deepface_recognizer.py`
- Найдите строку с `threshold` или `distance_metric`

---

## 📊 Как понять, что модель работает хорошо?

### Признаки хорошей модели:
- ✅ Распознает людей с уверенностью > 70%
- ✅ Не распознает незнакомых людей
- ✅ Работает при разном освещении
- ✅ Работает с очками и без

### Признаки плохой модели:
- ❌ Уверенность < 50%
- ❌ Распознает незнакомых как знакомых
- ❌ Не распознает знакомых людей
- ❌ Работает только при идеальном освещении

### Что делать если плохо работает:
1. **Добавьте больше фотографий** (8-15 на человека)
2. **Переобучите модель**
3. **Попробуйте DeepFace** вместо LBPH
4. **Улучшите освещение** в месте установки камеры
5. **Проверьте настройки камеры** (разрешение, FPS)

---

## 🆘 Решение проблем

### Проблема: Агент не запускается после смены модели
**Решение:**
```bash
# Проверьте логи
cd agent
python main.py

# Если ошибка про отсутствие библиотек:
pip install deepface tf-keras

# Для LBPH библиотеки не нужны
```

### Проблема: DeepFace скачивает модели очень долго
**Ответ:** Это нормально при первом запуске! DeepFace скачивает предобученные модели (~100-200MB).
Подождите 2-5 минут. Файлы сохранятся и следующий запуск будет быстрым.

### Проблема: Модель не переобучается
**Решение:**
1. Проверьте, что фотографии действительно загрузились (зайдите в профиль человека)
2. Перезапустите Recognition Service через System
3. Проверьте логи агента: `agent/data/logs/`

### Проблема: После переобучения стало хуже
**Решение:**
1. Удалите плохие/размытые фотографии
2. Добавьте больше качественных фотографий
3. Попробуйте другую модель (DeepFace вместо LBPH или наоборот)

### Проблема: Команда rebuild-model не выполняется
**Проверьте:**
```bash
# 1. Агент запущен?
cd agent
python main.py

# 2. Device зарегистрирован?
curl http://localhost:8000/api/v1/devices

# 3. Проверьте команды в базе
curl "http://localhost:8000/api/v1/commands?device_id=YOUR_DEVICE_ID"
```

---

## 📖 Дополнительные ресурсы

- **Полное руководство**: `agent/RECOGNITION_OPTIMIZATION_GUIDE.md`
- **Описание моделей**: `agent/RECOGNITION_MODELS.md`
- **Логи агента**: `agent/data/logs/`
- **Модели**: `agent/data/models/`

---

## 💡 Совет от разработчика

**Начните с простого:**
1. Используйте LBPH для тестирования
2. Загрузите 8-15 качественных фото на каждого человека
3. Переобучите модель
4. Протестируйте
5. Если нужна большая точность → переключитесь на DeepFace (Facenet512)
6. Снова переобучите

**Не пытайтесь настроить всё сразу!** Меняйте по одному параметру за раз.

Удачи! 🚀
