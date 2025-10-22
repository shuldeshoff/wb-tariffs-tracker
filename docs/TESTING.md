# 🧪 Тестирование

Документация по тестированию проекта WB Tariffs Service.

## 📋 Структура тестов

```
tests/
├── unit/                           # Модульные тесты
│   ├── wildberries.service.test.ts
│   ├── tariffs.repository.test.ts
│   ├── data-processing.service.test.ts
│   ├── google-sheets.service.test.ts
│   └── scheduler.test.ts
├── integration/                    # Интеграционные тесты (будущее)
└── mocks/                          # Моковые данные
    └── data.ts
```

## 🚀 Запуск тестов

### Все тесты

```bash
npm test
```

### Watch режим (автоматический перезапуск при изменениях)

```bash
npm run test:watch
```

### С покрытием кода

```bash
npm run test:coverage
```

Отчет о покрытии будет доступен в `coverage/index.html`.

## 📝 Описание тестов

### WildberriesService

**Файл:** `tests/unit/wildberries.service.test.ts`

Тестирует:
- Успешное получение данных от WB API
- Retry-логику при сбоях (3 попытки)
- Обработку клиентских ошибок (4xx) без повторных попыток
- Обработку некорректных ответов API
- Парсинг коэффициентов из строковых значений

### TariffsRepository

**Файл:** `tests/unit/tariffs.repository.test.ts`

Тестирует:
- UPSERT операции для обновления тарифов
- Получение тарифов по дате с сортировкой
- Получение последних тарифов
- Удаление старых записей
- Обработку ошибок БД

### DataProcessingService

**Файл:** `tests/unit/data-processing.service.test.ts`

Тестирует:
- Полный цикл получения и сохранения данных
- Трансформацию данных API в формат БД
- Обработку пустых ответов
- Обработку ошибок при сохранении
- Корректность установки текущей даты

### GoogleSheetsService

**Файл:** `tests/unit/google-sheets.service.test.ts`

Тестирует:
- Обновление множества Google Sheets
- Форматирование данных для таблиц
- Очистку и запись данных
- Тест подключения к таблице
- Обработку ошибок доступа

### SchedulerService

**Файл:** `tests/unit/scheduler.test.ts`

Тестирует:
- Запуск задач по расписанию
- Выполнение начальных задач при старте
- Остановку всех задач
- Статус задач (running/stopped)
- Обработку ошибок в задачах

## 🎭 Моки

### Mock Data

**Файл:** `tests/mocks/data.ts`

Содержит тестовые данные:
- `mockWBApiResponse` - пример ответа WB API с 3 складами
- `mockTariffRecords` - примеры записей БД

## 📊 Покрытие кода

Целевое покрытие:
- **Statements:** > 80%
- **Branches:** > 75%
- **Functions:** > 80%
- **Lines:** > 80%

## 🔧 Конфигурация

### Jest Config

**Файл:** `jest.config.js`

Настройки:
- Использование ts-jest для TypeScript
- Поддержка ES Modules
- Path mapping для алиасов (`#*`)
- Покрытие кода в директории `coverage/`

## 🧩 Зависимости для тестирования

```json
{
  "devDependencies": {
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.1.2",
    "@types/node": "^20.11.0"
  }
}
```

## ✅ Best Practices

1. **Изоляция тестов:** Каждый тест независим и не влияет на другие
2. **Моки:** Используются моки для внешних зависимостей (API, БД)
3. **Очистка:** `clearMocks`, `resetMocks`, `restoreMocks` после каждого теста
4. **Читаемость:** Описательные названия тестов на русском языке
5. **AAA Pattern:** Arrange, Act, Assert в каждом тесте

## 🐛 Отладка тестов

### Запуск конкретного файла

```bash
npm test -- wildberries.service.test.ts
```

### Запуск конкретного теста

```bash
npm test -- -t "должен успешно получить тарифы"
```

### Verbose режим

```bash
npm test -- --verbose
```

## 📈 Добавление новых тестов

1. Создайте файл `*.test.ts` в соответствующей директории
2. Импортируйте необходимые утилиты из `@jest/globals`
3. Создайте моки для внешних зависимостей
4. Напишите тесты следуя структуре:

```typescript
describe("ComponentName", () => {
    beforeEach(() => {
        // Setup
    });

    describe("methodName", () => {
        it("должен делать что-то", () => {
            // Arrange
            // Act
            // Assert
        });
    });
});
```

## 🔄 CI/CD Integration

Тесты можно интегрировать в CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
  
- name: Upload coverage
  run: npm run test:coverage
```

## 📚 Дополнительные ресурсы

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing TypeScript](https://jestjs.io/docs/getting-started#via-ts-jest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Последнее обновление:** 22 октября 2025

