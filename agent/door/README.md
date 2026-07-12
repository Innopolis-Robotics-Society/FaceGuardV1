# LED Indicator Quick Start

## Подключение (Raspberry Pi)

```
GPIO 17 → RED LED → 220Ω → GND
GPIO 27 → GREEN LED → 220Ω → GND  
GPIO 22 → BLUE LED → 220Ω → GND
```

## Индикация

- 🔴 **Красный**: Доступ отказан
- 🟢 **Зелёный**: Доступ разрешён (≥60%)
- 🔵 **Синий**: Распознан, но <60%

## Тестирование

```bash
cd agent
python scripts/test_leds.py
```

## Конфигурация (.env)

```bash
HARDWARE_MODE=raspberry_pi
LED_RED_PIN=17
LED_GREEN_PIN=27
LED_BLUE_PIN=22
LED_DURATION=2.0
```

Подробнее: [LED_SETUP.md](LED_SETUP.md)
