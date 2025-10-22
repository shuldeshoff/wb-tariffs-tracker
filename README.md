# WB Tariffs Tracker

Сервис для автоматического получения информации о тарифах Wildberries и синхронизации с Google Sheets.

## 📋 Описание

Приложение выполняет следующие задачи:
- Ежечасное получение данных о тарифах коробов через [WB API](https://common-api.wildberries.ru/api/v1/tariffs/box)
- Сохранение данных в PostgreSQL с накоплением истории по дням
- Регулярное обновление данных в Google Sheets (лист `stocks_coefs`)
- Автоматическая сортировка данных по коэффициенту

## 🚀 Быстрый старт

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

## ⚙️ Конфигурация

### Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `POSTGRES_HOST` | Хост PostgreSQL | `postgres` |
| `POSTGRES_PORT` | Порт PostgreSQL | `5432` |
| `POSTGRES_DB` | Имя БД | `postgres` |
| `POSTGRES_USER` | Пользователь БД | `postgres` |
| `POSTGRES_PASSWORD` | Пароль БД | `postgres` |
| `WB_API_URL` | URL WB API | `https://common-api.wildberries.ru/api/v1/tariffs/box` |
| `WB_API_TOKEN` | Токен WB API | *required* |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email Service Account | *required* |
| `GOOGLE_PRIVATE_KEY` | Приватный ключ | *required* |
| `GOOGLE_SHEET_IDS` | ID таблиц через запятую | *required* |
| `CRON_FETCH_WB_DATA` | Расписание получения данных | `0 * * * *` (каждый час) |
| `CRON_UPDATE_SHEETS` | Расписание обновления таблиц | `*/30 * * * *` (каждые 30 мин) |

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

## 📁 Структура проекта

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
├── docs/                 # Документация
├── logs/                 # Логи приложения
├── .env.example         # Пример переменных окружения
├── compose.yaml         # Docker Compose конфигурация
├── Dockerfile           # Docker образ
└── README.md           # Этот файл
```

## 🗄️ База данных

### Таблица `tariffs`

Хранит данные о тарифах с уникальным ключом `(date, warehouse_name, box_type)`.
При повторном получении данных в течение дня записи обновляются (UPSERT).

## 📊 Google Sheets

Данные в Google Sheets обновляются на листе `stocks_coefs` со следующими колонками:
- Склад
- Тип коробки
- Коэффициент
- Дата обновления
- Дата следующей коробки
- Дата до максимума

Данные автоматически сортируются по возрастанию коэффициента.

## 🔧 Разработка

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

### Миграции

```bash
# Создать новую миграцию
npm run knex:dev migrate make migration_name

# Применить миграции
npm run knex:dev migrate latest

# Откатить последнюю миграцию
npm run knex:dev migrate rollback
```

## 🔍 Проверка работы

### Логи

```bash
# Логи приложения
docker compose logs -f app

# Логи базы данных
docker compose logs -f postgres
```

### База данных

```bash
# Подключиться к PostgreSQL
docker compose exec postgres psql -U postgres -d postgres

# Проверить данные
SELECT date, warehouse_name, box_type, coefficient 
FROM tariffs 
ORDER BY date DESC, coefficient ASC 
LIMIT 10;
```

## 🐳 Docker

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

## 📝 Технологический стек

- **Backend:** Node.js 20, TypeScript
- **Database:** PostgreSQL 16, Knex.js
- **APIs:** Wildberries API, Google Sheets API v4
- **Infrastructure:** Docker, Docker Compose
- **Scheduler:** node-cron
- **Testing:** Jest, ts-jest
- **Logging:** log4js

## 📄 Лицензия

ISC

## 👤 Автор

Выполнено как тестовое задание

---

**Дата создания:** Октябрь 2025
