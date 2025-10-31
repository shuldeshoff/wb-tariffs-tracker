# WB Tariffs Tracker

Сервис для автоматического получения информации о тарифах Wildberries и синхронизации с Google Sheets.

## Описание

Приложение выполняет следующие задачи:
- Ежечасное получение данных о тарифах коробов через WB API
- Сохранение данных в PostgreSQL с накоплением истории по дням
- UPSERT логика - обновление данных в течение дня
- Регулярное обновление произвольного количества Google таблиц (лист `stocks_coefs`)
- Автоматическая сортировка данных по коэффициенту
- HTTP endpoints для health checks и метрик
- Prometheus метрики для мониторинга
- Unit тесты (38 passed, coverage 36%)
- Graceful shutdown
- Retry логика для API запросов
- Structured logging

## Быстрый старт

### Требования

- Docker & Docker Compose
- Node.js 20+ (для локальной разработки)

### Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone https://github.com/shuldeshoff/wb-tariffs-tracker.git
cd wb-tariffs-tracker
```

2. Создайте файл `.env` из примера:
```bash
cp .env.example .env
```

3. Настройте переменные окружения в `.env`:
```env
# Wildberries API
WB_API_TOKEN=your_token_from_hh

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour_Key_Here\n-----END PRIVATE KEY-----
GOOGLE_SHEET_IDS=sheet_id_1,sheet_id_2
```

4. Запустите приложение:
```bash
docker compose up --build
```

Приложение запустится и сразу начнет работу:
- Получит данные от WB API
- Сохранит в базу данных
- Обновит все указанные Google Sheets
- HTTP сервер будет доступен на порту 3000 (по умолчанию)

## API Endpoints

После запуска приложения доступны следующие endpoints:

| Endpoint | Описание | Метод |
|----------|----------|--------|
| `/health` | Комплексная проверка здоровья (БД + scheduler) | GET |
| `/ready` | Проверка готовности к работе | GET |
| `/live` | Проверка жизни приложения | GET |
| `/metrics` | Prometheus метрики | GET |
| `/status` | Статус сервиса и scheduler | GET |

### Примеры использования

```bash
# Проверка здоровья приложения
curl http://localhost:3000/health

# Получение метрик для Prometheus
curl http://localhost:3000/metrics

# Проверка статуса
curl http://localhost:3000/status
```

## Мониторинг и Метрики

### Prometheus Метрики

Приложение экспортирует следующие метрики:

**Counters (Счётчики):**
- `wb_api_requests_total{status}` - Всего запросов к WB API
- `wb_api_errors_total{error_type}` - Всего ошибок WB API
- `sheets_update_total{status}` - Всего обновлений Google Sheets
- `sheets_update_errors_total` - Всего ошибок обновления Sheets
- `tariffs_processed_total` - Всего обработанных тарифов

**Gauges (Гауджи):**
- `last_successful_fetch_timestamp` - Время последнего успешного получения данных
- `last_successful_sheets_update_timestamp` - Время последнего успешного обновления таблиц
- `active_tasks{task_type}` - Количество активных задач

**Histograms (Гистограммы):**
- `wb_api_duration_seconds` - Длительность запросов к WB API
- `sheets_update_duration_seconds` - Длительность обновления Google Sheets
- `db_operation_duration_seconds{operation}` - Длительность операций с БД

### Health Checks

**`/health` endpoint возвращает:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 5
    },
    "scheduler": {
      "status": "healthy",
      "tasks": {
        "fetchData": "running",
        "updateSheets": "running"
      }
    }
  }
}
```

## Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `POSTGRES_HOST` | Хост PostgreSQL | `localhost` |
| `POSTGRES_PORT` | Порт PostgreSQL | `5432` |
| `POSTGRES_DB` | Имя БД | `postgres` |
| `POSTGRES_USER` | Пользователь БД | `postgres` |
| `POSTGRES_PASSWORD` | Пароль БД | `postgres` |
| `APP_PORT` | Порт HTTP сервера | `3000` |
| `WB_API_URL` | URL WB API | `https://common-api.wildberries.ru/api/v1/tariffs/box` |
| `WB_API_TOKEN` | Токен WB API | *обязательно* |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email Service Account | *обязательно* |
| `GOOGLE_PRIVATE_KEY` | Приватный ключ | *обязательно* |
| `GOOGLE_SHEET_IDS` | ID таблиц через запятую | *обязательно* |
| `CRON_FETCH_WB_DATA` | Расписание получения данных | `0 * * * *` (каждый час) |
| `CRON_UPDATE_SHEETS` | Расписание обновления таблиц | `*/30 * * * *` (каждые 30 мин) |
| `LOG_LEVEL` | Уровень логирования | `info` |
| `NODE_ENV` | Окружение | `development` |

### Настройка Google Service Account

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google Sheets API
4. Создайте Service Account:
   - IAM & Admin → Service Accounts → Create Service Account
   - Скачайте JSON-ключ
5. Откройте свои Google Sheets и дайте доступ Service Account (Share):
   - Email: `your-service-account@project.iam.gserviceaccount.com`
   - Права: Editor
6. Скопируйте из JSON:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`

## Структура проекта

```
wb-tariffs-tracker/
├── src/
│   ├── config/            # Конфигурация
│   ├── postgres/          # Миграции и seeds
│   ├── repositories/      # Работа с БД
│   ├── services/          # Бизнес-логика
│   ├── scheduler/         # Планировщик задач
│   ├── types/            # TypeScript типы
│   ├── utils/            # Утилиты
│   └── index.ts          # Точка входа
├── tests/                # Тесты
├── logs/                 # Логи приложения
├── .env.example         # Пример переменных окружения
├── compose.yaml         # Docker Compose конфигурация
├── Dockerfile           # Docker образ
└── README.md           # Этот файл
```

## База данных

### Таблица tariffs

Хранит данные о тарифах с уникальным ключом `(date, warehouse_name, box_type)`.
При повторном получении данных в течение дня записи обновляются (UPSERT).

## Google Sheets

Данные в Google Sheets обновляются на листе `stocks_coefs` со следующими колонками:
- Склад
- Тип коробки
- Коэффициент
- Дата обновления
- Дата следующей коробки
- Дата до максимума

Данные автоматически сортируются по возрастанию коэффициента.

## Разработка

### Локальный запуск

```bash
# Установить зависимости
npm install

# Запустить PostgreSQL
docker compose up -d postgres

# Применить миграции
npm run knex:dev migrate latest

# Запустить в режиме разработки
npm run dev
```

### Тестирование

```bash
# Запустить все тесты
npm test

# Watch режим
npm run test:watch

# С покрытием кода
npm run test:coverage
```

### Линтинг и форматирование

```bash
# Проверить код с ESLint
npm run lint

# Автоматически исправить ошибки
npm run lint:fix

# Проверить с нулевой толерантностью к warnings (для CI)
npm run lint:check

# Проверить форматирование Prettier
npm run prettier

# Исправить форматирование
npm run prettier-format
```

### Миграции

```bash
# Создать новую миграцию
npm run knex:dev migrate make migration_name

# Применить миграции
npm run knex:dev migrate latest

# Откатить последнюю миграцию
npm run knex:dev migrate rollback
```

## Проверка работы

### 1. Проверка через API endpoints

После запуска приложение доступно на `http://localhost:3000`:

```bash
# Проверка здоровья приложения
curl http://localhost:3000/health
# Ожидается: {"status":"healthy", "checks":{"database":{"status":"healthy"},...}}

# Проверка статуса сервиса
curl http://localhost:3000/status
# Ожидается: {"service":"wb-tariffs-service","version":"1.0.0",...}

# Проверка метрик Prometheus
curl http://localhost:3000/metrics
# Ожидается: метрики в формате Prometheus

# Liveness probe (для Kubernetes)
curl http://localhost:3000/live

# Readiness probe (для Kubernetes)
curl http://localhost:3000/ready
```

### 2. Логи

```bash
# Логи приложения
docker compose logs -f app

# Логи базы данных
docker compose logs -f postgres

# Проверка что scheduler работает
docker compose logs app | grep "Scheduler started"

# Проверка что API запросы выполняются
docker compose logs app | grep "GET /"
```

### 3. База данных

```bash
# Подключиться к PostgreSQL
docker compose exec postgres psql -U postgres -d postgres

# Проверить данные
SELECT date, warehouse_name, box_type, coefficient 
FROM tariffs 
ORDER BY date DESC, coefficient ASC 
LIMIT 10;
```

## Docker

### Команды

```bash
# Запуск всех сервисов
docker compose up --build

# Запуск только БД
docker compose up -d postgres

# Остановка
docker compose down

# Полная очистка (с удалением volumes)
docker compose down --volumes --rmi local

# Перезапуск приложения
docker compose restart app
```

## Технологический стек

- **Backend:** Node.js 20, TypeScript (strict mode)
- **Database:** PostgreSQL 16, Knex.js
- **APIs:** Wildberries API, Google Sheets API v4
- **Infrastructure:** Docker, Docker Compose
- **Scheduler:** node-cron (ежечасно + каждые 30 мин)
- **Testing:** Jest, ts-jest (coverage 36%, 38 tests passed)
- **Logging:** log4js (console + file rotation)
- **HTTP Server:** Express (5 endpoints)
- **Metrics:** prom-client (26 Prometheus метрик)

## Соответствие требованиям

| Требование | Статус | Реализация |
|-----------|--------|-----------|
| PostgreSQL + Knex.js | Выполнено | PostgreSQL 16.1, Knex 3.0.1 |
| TypeScript описание типов | Выполнено | Strict mode, все типы описаны |
| WB API endpoint | Выполнено | `https://common-api.wildberries.ru/api/v1/tariffs/box` |
| Ежечасное получение данных | Выполнено | Cron: `0 * * * *` |
| Накопление данных по дням | Выполнено | UPSERT по ключу (date, warehouse, box_type) |
| Обновление данных за день | Выполнено | onConflict + merge в Knex |
| N Google таблиц | Выполнено | Через `GOOGLE_SHEET_IDS` (comma-separated) |
| Лист stocks_coefs | Выполнено | Реализовано |
| Сортировка по коэффициенту | Выполнено | ORDER BY coefficient ASC |
| Docker + compose | Выполнено | Multi-stage build, healthchecks |
| `docker compose up` | Выполнено | Запуск одной командой |
| README с инструкцией | Выполнено | Полная документация |
| .env.example | Выполнено | Без чувствительных данных |
| postgres/postgres/postgres | Выполнено | По умолчанию |

## Автор

Юрий Шульдешов  
Telegram: [@shuldeshoff](https://t.me/shuldeshoff)
