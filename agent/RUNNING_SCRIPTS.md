# Запуск тестовых скриптов на Raspberry Pi

Если при запуске скриптов вы получаете ошибку `ModuleNotFoundError: No module named 'door'` или подобные, используйте один из методов ниже.

## Метод 1: Запуск через Python модуль (рекомендуется)

```bash
cd /path/to/FaceGuardV1/agent

# Тест светодиодов
python3 -m scripts.test_leds

# Скачивание моделей
python3 -m scripts.download_models
```

## Метод 2: Использование shell wrapper

```bash
cd /path/to/FaceGuardV1/agent

# Сделать скрипт исполняемым (один раз)
chmod +x test_led.sh

# Запуск
./test_led.sh
```

## Метод 3: Установка PYTHONPATH вручную

```bash
cd /path/to/FaceGuardV1/agent

# Временно установить PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Запуск скрипта
python3 scripts/test_leds.py
```

## Запуск в Docker контейнере

Если agent уже запущен в Docker:

```bash
# Войти в контейнер
docker exec -it faceguard-agent bash

# Запустить тест
python -m scripts.test_leds
```

## Объяснение проблемы

Скрипты в `scripts/` импортируют модули из `door/` и `core/`. Python должен знать, что эти модули находятся в родительской директории. Когда вы запускаете скрипт напрямую (`python scripts/test_leds.py`), Python не видит эти модули.

Запуск через `-m` (module) или установка `PYTHONPATH` решает эту проблему.
