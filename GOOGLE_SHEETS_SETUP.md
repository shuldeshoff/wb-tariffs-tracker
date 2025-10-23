# Настройка автоматического обновления Google Sheets

## 📋 Что уже реализовано

✅ **Регулярное обновление Google Sheets уже работает!**

Система автоматически:
- Получает данные от WB API **каждый час** (`0 * * * *`)
- Обновляет Google Sheets **каждые 30 минут** (`*/30 * * * *`)
- Сортирует данные по коэффициенту (возрастание)
- Записывает на лист `stocks_coefs`
- Поддерживает **произвольное количество** таблиц (N)

## 🚀 Пошаговая настройка

### Шаг 1: Создайте Google Service Account

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)

2. Создайте новый проект или выберите существующий:
   - Нажмите на выпадающий список проектов вверху
   - "New Project" → укажите название (например, "WB Tariffs Tracker")

3. Включите Google Sheets API:
   ```
   Navigation Menu → APIs & Services → Enable APIs and Services
   → Найдите "Google Sheets API" → Enable
   ```

4. Создайте Service Account:
   ```
   Navigation Menu → IAM & Admin → Service Accounts
   → Create Service Account
   ```
   
   - **Service account name:** `wb-tariffs-service`
   - **Service account ID:** `wb-tariffs-service` (будет сгенерирован автоматически)
   - **Description:** "Service account for WB Tariffs Tracker"
   - Нажмите "Create and Continue"
   - **Role:** можно пропустить
   - Нажмите "Done"

5. Создайте JSON-ключ:
   ```
   Найдите созданный Service Account → три точки (Actions) → Manage Keys
   → Add Key → Create new key → JSON → Create
   ```
   
   Файл `*.json` скачается автоматически.

### Шаг 2: Создайте Google Sheets

1. Откройте [Google Sheets](https://sheets.google.com/)

2. Создайте новую таблицу:
   - "Blank" или используйте шаблон
   - Название: "WB Тарифы Коробов"

3. **ВАЖНО:** Создайте лист с названием `stocks_coefs`:
   - Внизу нажмите "+" для создания нового листа
   - ПКМ → Rename → `stocks_coefs`

4. Предоставьте доступ Service Account:
   - Нажмите "Share" (вверху справа)
   - Вставьте email из JSON-ключа (поле `client_email`)
   - Например: `wb-tariffs-service@project-123456.iam.gserviceaccount.com`
   - **Права:** Editor
   - **ВАЖНО:** Снимите галочку "Notify people"
   - Нажмите "Share"

5. Скопируйте ID таблицы:
   - URL выглядит так: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - Скопируйте `{SHEET_ID}` (длинная строка между `/d/` и `/edit`)

### Шаг 3: Настройте .env

Откройте файл `.env` и заполните:

```env
# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL=wb-tariffs-service@project-123456.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_IDS=1abc123def456ghi789jkl012mno345pqr,2xyz789abc456def123ghi456jkl789mno

# Расписание (опционально, если хотите изменить)
CRON_FETCH_TARIFFS=0 * * * *        # Каждый час
CRON_UPDATE_SHEETS=*/30 * * * *     # Каждые 30 минут
```

#### Где взять значения:

**GOOGLE_SERVICE_ACCOUNT_EMAIL:**
- Откройте скачанный JSON-файл
- Найдите поле `"client_email"`
- Скопируйте значение

**GOOGLE_PRIVATE_KEY:**
- Откройте скачанный JSON-файл
- Найдите поле `"private_key"`
- Скопируйте **всю** строку, включая `-----BEGIN PRIVATE KEY-----` и `-----END PRIVATE KEY-----`
- **ВАЖНО:** Оставьте символы `\n` как есть!

**GOOGLE_SHEET_IDS:**
- Если одна таблица: просто ID
- Если несколько: через запятую без пробелов
- Пример: `1abc123def,2xyz789abc,3def456ghi`

### Шаг 4: Запустите приложение

```bash
# Остановите текущие контейнеры (если запущены)
docker compose down

# Запустите с новыми настройками
docker compose up --build
```

### Шаг 5: Проверка

#### 1. Проверьте логи

```bash
docker compose logs app | grep "Google Sheets"
```

**Ожидаемый вывод:**
```
[INFO] Google Sheets API initialized successfully
[INFO] Updating 1 Google Sheets...
[INFO] Successfully updated sheet 1abc123def456 with 69 rows
[INFO] ✓ Google Sheets update task completed successfully
```

#### 2. Откройте вашу Google Таблицу

Вы должны увидеть:
- Лист `stocks_coefs` с данными
- Заголовки: Склад, Тип коробки, Коэффициент, Дата обновления, Дата следующей коробки, Дата до максимума
- 69 строк с данными
- Данные отсортированы по коэффициенту

#### 3. Проверьте автообновление

Подождите 30 минут и проверьте логи:
```bash
docker compose logs app --since 30m | grep "Google Sheets"
```

## 🎯 Как работает автоматическое обновление

### Расписание

| Задача | Частота | Cron | Описание |
|--------|---------|------|----------|
| **Получение данных WB** | Каждый час | `0 * * * *` | Запрос к WB API, сохранение в БД |
| **Обновление Google Sheets** | Каждые 30 минут | `*/30 * * * *` | Выгрузка из БД в Google Sheets |

### Процесс обновления

```
1. WB API → PostgreSQL (каждый час)
   ├─ Получение тарифов с WB API
   ├─ Парсинг и валидация данных
   └─ UPSERT в таблицу tariffs

2. PostgreSQL → Google Sheets (каждые 30 мин)
   ├─ Извлечение последних данных
   ├─ Сортировка по коэффициенту
   ├─ Очистка листа stocks_coefs
   └─ Запись новых данных
```

### Структура данных в Google Sheets

| Колонка | Пример | Описание |
|---------|--------|----------|
| Склад | Коледино | Название склада |
| Тип коробки | standard | Тип упаковки |
| Коэффициент | 0 | Коэффициент склада |
| Дата обновления | 2025-10-23 | Дата актуальности |
| Дата следующей коробки | 2025-10-24 | Дата следующего обновления |
| Дата до максимума | 2025-10-24 | Дата действия тарифов |

## 🔧 Настройка расписания

### Изменить частоту обновлений

В файле `.env`:

```env
# Примеры различных расписаний

# Каждые 15 минут
CRON_UPDATE_SHEETS=*/15 * * * *

# Каждый час в начале часа
CRON_UPDATE_SHEETS=0 * * * *

# Каждые 2 часа
CRON_UPDATE_SHEETS=0 */2 * * *

# Каждый день в 9:00 и 18:00
CRON_UPDATE_SHEETS=0 9,18 * * *

# Каждый понедельник в 9:00
CRON_UPDATE_SHEETS=0 9 * * 1
```

### Формат Cron

```
 ┌────────────── минута (0 - 59)
 │ ┌──────────── час (0 - 23)
 │ │ ┌────────── день месяца (1 - 31)
 │ │ │ ┌──────── месяц (1 - 12)
 │ │ │ │ ┌────── день недели (0 - 7, 0 и 7 = воскресенье)
 │ │ │ │ │
 * * * * *
```

## 📊 Множество таблиц (N Google Sheets)

Система поддерживает обновление **произвольного количества** таблиц одновременно.

### Настройка

В `.env`:
```env
# Одна таблица
GOOGLE_SHEET_IDS=1abc123def456

# Три таблицы (через запятую)
GOOGLE_SHEET_IDS=1abc123def456,2xyz789abc123,3def456ghi789

# Пять таблиц
GOOGLE_SHEET_IDS=1abc,2def,3ghi,4jkl,5mno
```

### Требования к каждой таблице

1. **Предоставить доступ** Service Account (как в Шаге 2)
2. **Создать лист** `stocks_coefs`
3. Все таблицы обновляются **параллельно**

### Проверка множественных таблиц

```bash
docker compose logs app | grep "Updating.*Google Sheets"
```

**Ожидаемый вывод:**
```
[INFO] Updating 3 Google Sheets...
[INFO] Successfully updated sheet 1abc123def456 with 69 rows
[INFO] Successfully updated sheet 2xyz789abc123 with 69 rows
[INFO] Successfully updated sheet 3def456ghi789 with 69 rows
[INFO] Google Sheets update completed: 3 successful, 0 failed
```

## 🔍 Мониторинг

### Проверка статуса

```bash
# Статус scheduler
curl http://localhost:3000/status

# Метрики обновлений Google Sheets
curl http://localhost:3000/metrics | grep sheets_update
```

**Метрики:**
- `sheets_update_total{status="success"}` - успешные обновления
- `sheets_update_errors_total` - ошибки обновления
- `sheets_update_duration_seconds` - длительность обновления
- `last_successful_sheets_update_timestamp` - время последнего успешного обновления

### Просмотр логов в реальном времени

```bash
docker compose logs -f app | grep "Google Sheets"
```

## ❌ Решение проблем

### Ошибка: "Google Sheets API not initialized"

**Причина:** Не заполнены `GOOGLE_SERVICE_ACCOUNT_EMAIL` или `GOOGLE_PRIVATE_KEY`

**Решение:**
1. Проверьте `.env` файл
2. Убедитесь, что скопировали весь приватный ключ
3. Перезапустите: `docker compose restart app`

### Ошибка: "Error updating sheet: The caller does not have permission"

**Причина:** Service Account не имеет доступа к таблице

**Решение:**
1. Откройте Google Sheet
2. Share → добавьте email Service Account
3. Права: Editor
4. Попробуйте снова

### Ошибка: "Unable to parse range: stocks_coefs"

**Причина:** Лист `stocks_coefs` не существует

**Решение:**
1. Откройте Google Sheet
2. Создайте новый лист (+ внизу)
3. Переименуйте в `stocks_coefs` (точное название!)

### Данные не обновляются

**Проверьте:**
1. Scheduler работает: `curl http://localhost:3000/status`
2. Есть данные в БД: `docker exec postgres psql -U postgres -d postgres -c "SELECT COUNT(*) FROM tariffs;"`
3. Логи: `docker compose logs app | tail -50`

### Приватный ключ не работает

**Проверьте формат:**
```env
# ✅ ПРАВИЛЬНО
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"

# ❌ НЕПРАВИЛЬНО (нет кавычек)
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n

# ❌ НЕПРАВИЛЬНО (удалены \n)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----MIIEvQIBADANBg...-----END PRIVATE KEY-----"
```

## 🎉 Готово!

Теперь ваши Google Sheets будут автоматически обновляться каждые 30 минут с актуальными данными от Wildberries!

### Что происходит автоматически:

✅ Каждый час - получение новых тарифов от WB  
✅ Каждые 30 минут - обновление всех Google Sheets  
✅ Автоматическая сортировка по коэффициенту  
✅ Обновление при запуске приложения  
✅ Метрики и мониторинг  
✅ Graceful shutdown  

### Полезные команды:

```bash
# Просмотр логов
docker compose logs -f app

# Проверка статуса
curl http://localhost:3000/health

# Проверка метрик
curl http://localhost:3000/metrics

# Перезапуск (после изменения .env)
docker compose restart app

# Полная пересборка
docker compose down && docker compose up --build
```

---

**Вопросы?** Проверьте основной [README.md](./README.md) или логи приложения.

