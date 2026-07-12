# LED Indicator Setup Guide

## Overview

FaceGuard использует RGB LED индикатор для визуальной обратной связи о статусе распознавания:

- 🔴 **Красный (RED)**: Доступ отказан (неизвестный человек)
- 🟢 **Зелёный (GREEN)**: Доступ разрешён (уверенность ≥ 60%)
- 🔵 **Синий (BLUE)**: Человек распознан, но низкая уверенность (< 60%)

## Схема подключения

### Для Raspberry Pi

Подключите RGB LED (с общим катодом) к следующим GPIO пинам:

```
GPIO 17 (Pin 11) → RED LED → 220Ω резистор → GND
GPIO 27 (Pin 13) → GREEN LED → 220Ω резистор → GND
GPIO 22 (Pin 15) → BLUE LED → 220Ω резистор → GND
```

### Принципиальная схема

```
         Raspberry Pi GPIO
              
GPIO 17 ─────[220Ω]─────┤>├───┐
                        RED    │
GPIO 27 ─────[220Ω]─────┤>├───┤  (Common Cathode RGB LED)
                       GREEN   │
GPIO 22 ─────[220Ω]─────┤>├───┤
                       BLUE    │
                               │
GND ───────────────────────────┘
```

### Альтернативные пины

Вы можете использовать другие GPIO пины, изменив конфигурацию в `.env`:

```bash
LED_RED_PIN=17
LED_GREEN_PIN=27
LED_BLUE_PIN=22
```

## Требования

### Аппаратные компоненты

1. **RGB LED с общим катодом** (Common Cathode) или 3 отдельных LED
2. **3x резисторы 220Ω** (для ограничения тока)
3. **Соединительные провода** (female-to-male для Raspberry Pi)
4. **Breadboard** (опционально, для удобства)

### Программные зависимости

```bash
# Уже включены в requirements.txt
gpiozero>=2.0
RPi.GPIO>=0.7.1
```

## Конфигурация

### 1. Настройка .env файла

Скопируйте и отредактируйте `.env.example`:

```bash
cp .env.example .env
```

Убедитесь, что настроены следующие параметры:

```bash
# Hardware mode
HARDWARE_MODE=raspberry_pi

# LED indicator
LED_RED_PIN=17
LED_GREEN_PIN=27
LED_BLUE_PIN=22
LED_DURATION=2.0  # Длительность свечения (секунды)
```

### 2. Проверка GPIO доступа

Убедитесь, что пользователь имеет доступ к GPIO:

```bash
# Добавить пользователя в группу gpio
sudo usermod -a -G gpio $USER

# Перелогиниться или перезагрузить
```

## Тестирование

### Запуск тестового скрипта

```bash
cd agent
python scripts/test_leds.py
```

Этот скрипт проверит:
- Инициализацию LED
- Все три цвета (красный, зелёный, синий)
- Мигание LED
- Реальные сценарии использования

### Ожидаемый вывод

```
============================================================
FaceGuard LED Indicator Test
============================================================

=== Testing LED Status ===

LED Type: gpio
Available: True
Red Pin: 17
Green Pin: 27
Blue Pin: 22

=== Testing Basic LED Colors ===

Testing RED LED (Access Denied)...
Testing GREEN LED (Access Granted)...
Testing BLUE LED (Low Confidence)...
Turning OFF...

=== Testing LED Blinking ===

Blinking RED...
Blinking GREEN...
Blinking BLUE...

=== Testing Real-World Scenarios ===

Scenario 1: Unknown person detected
  → Showing RED LED (access denied)
Scenario 2: Known person recognized (75% confidence)
  → Showing GREEN LED (access granted)
Scenario 3: Known person recognized (45% confidence)
  → Showing BLUE LED (low confidence)

============================================================
All tests completed successfully!
============================================================
```

## Логика работы

### Расчёт уверенности

FaceGuard использует LBPH (Local Binary Patterns Histograms) для распознавания лиц:

- **Дистанция LBPH**: Чем меньше, тем лучше совпадение
- **Преобразование**: `confidence_percent = max(0, 100 - distance)`

### Правила индикации

```python
if person_unknown:
    LED → RED (доступ отказан)
elif confidence >= 60%:
    LED → GREEN (доступ разрешён, дверь открывается)
else:  # person recognized but confidence < 60%
    LED → BLUE (распознан, но низкая уверенность)
```

## Использование в Docker

### Docker Compose уже настроен

Файл `docker-compose.yml` содержит необходимые настройки:

```yaml
devices:
  - /dev/gpiomem:/dev/gpiomem  # GPIO memory access

environment:
  - HARDWARE_MODE=raspberry_pi
```

### Запуск в Docker

```bash
cd agent
docker-compose up --build
```

## Troubleshooting

### LED не включаются

1. **Проверьте подключение проводов**
   ```bash
   # Проверить доступ к GPIO
   ls -l /dev/gpiomem
   ```

2. **Проверьте права доступа**
   ```bash
   groups  # Должна быть группа 'gpio'
   ```

3. **Проверьте конфигурацию пинов**
   ```bash
   # В agent/.env
   cat .env | grep LED
   ```

### LED включаются, но неправильные цвета

- Проверьте тип LED (Common Cathode vs Common Anode)
- Убедитесь, что резисторы подключены правильно
- Проверьте полярность LED

### Ошибка "No module named 'gpiozero'"

```bash
pip install gpiozero RPi.GPIO
```

### В режиме разработки (не Raspberry Pi)

LED будут работать в режиме mock:

```
[MOCK LED] RED for 2.0s
[MOCK LED] GREEN for 2.0s
[MOCK LED] BLUE for 2.0s
```

## API Reference

### LEDIndicator класс

```python
from door.led_indicator import LEDIndicator, LEDStatus

led = LEDIndicator()

# Показать статус доступа
led.show_access_granted(duration=2.0)   # Зелёный
led.show_access_denied(duration=2.0)    # Красный
led.show_low_confidence(duration=2.0)   # Синий

# Мигание
led.blink(LEDStatus.ACCESS_GRANTED, times=3, interval=0.3)

# Выключить все LED
led.turn_off()

# Получить статус
status = led.get_status()

# Освободить ресурсы
led.release()
```

### Интеграция в EventHandler

LED автоматически управляются через `EventHandler`:

```python
# В main.py
self.led = LEDIndicator()
self.event_handler = EventHandler(self.door, self.sync_manager, self.led)

# EventHandler автоматически включает LED при событиях
```

## Расширенные настройки

### Изменение длительности свечения

```bash
# В .env
LED_DURATION=3.0  # 3 секунды вместо 2
```

### Использование других пинов

```bash
# Пример для других GPIO пинов
LED_RED_PIN=23
LED_GREEN_PIN=24
LED_BLUE_PIN=25
```

### Отключение LED

Если LED не нужны, система будет работать без них. EventHandler проверяет наличие LED перед использованием:

```python
if self.led:
    await asyncio.to_thread(self.led.show_access_granted)
```

## Схема работы системы

```
┌─────────────────────┐
│   Recognition Loop  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Event Handler     │
├─────────────────────┤
│ • Calculate         │
│   confidence %      │
│ • Determine action  │
└──────┬──────────────┘
       │
       ├─────────────────────┐
       ▼                     ▼
┌──────────────┐      ┌─────────────┐
│ Door Control │      │ LED Control │
├──────────────┤      ├─────────────┤
│ if conf>=60% │      │ • RED       │
│ → open door  │      │ • GREEN     │
└──────────────┘      │ • BLUE      │
                      └─────────────┘
```

## Дополнительные ресурсы

- [gpiozero документация](https://gpiozero.readthedocs.io/)
- [Raspberry Pi GPIO Pinout](https://pinout.xyz/)
- [FaceGuard Architecture](ARCHITECTURE.md)

## Безопасность

⚠️ **Важно**: 
- Всегда используйте резисторы для ограничения тока через LED
- Не подключайте LED напрямую к GPIO (риск повреждения)
- Максимальный ток GPIO на Raspberry Pi: **16mA**
- С резистором 220Ω ток составит ~10-12mA (безопасно)
