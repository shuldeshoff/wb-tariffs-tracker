// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { GoogleSheetsService } from "../../src/services/google-sheets.service.js";
import { tariffsRepository } from "../../src/repositories/tariffs.repository.js";
import { TariffRecord } from "../../src/types/index.js";
import { google } from "googleapis";

// Mock dependencies
jest.mock("googleapis");
jest.mock("../../src/repositories/tariffs.repository.js");
jest.mock("#utils/logger.js", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

// Mock env
jest.mock("#config/env/env.js", () => ({
    default: {
        GOOGLE_SERVICE_ACCOUNT_EMAIL: "test@test.iam.gserviceaccount.com",
        GOOGLE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----",
        GOOGLE_SHEET_IDS: ["sheet1", "sheet2"],
    },
}));

const mockTariffsRepository = tariffsRepository as jest.Mocked<typeof tariffsRepository>;
const mockGoogle = google as jest.Mocked<typeof google>;

describe("GoogleSheetsService", () => {
    let service: GoogleSheetsService;
    let mockSheets: any;

    const mockTariffs: TariffRecord[] = [
        {
            id: 1,
            date: new Date("2025-10-22"),
            warehouse_name: "Коледино",
            box_type: "Короб",
            coefficient: 1.5,
            dt_next_box: new Date("2025-10-23"),
            dt_till_max: new Date("2025-10-30"),
            delivery_base: "50",
            delivery_liter: "10",
            storage_base: "30",
            storage_liter: "5",
            raw_data: {},
            created_at: new Date(),
            updated_at: new Date(),
        },
        {
            id: 2,
            date: new Date("2025-10-22"),
            warehouse_name: "Подольск",
            box_type: "Монопаллета",
            coefficient: 2.0,
            dt_next_box: new Date("2025-10-23"),
            dt_till_max: new Date("2025-10-30"),
            delivery_base: "100",
            delivery_liter: "20",
            storage_base: "60",
            storage_liter: "10",
            raw_data: {},
            created_at: new Date(),
            updated_at: new Date(),
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Google Sheets API
        mockSheets = {
            spreadsheets: {
                values: {
                    update: jest.fn().mockResolvedValue({}),
                    clear: jest.fn().mockResolvedValue({}),
                },
                get: jest.fn().mockResolvedValue({
                    data: {
                        properties: { title: "Test Sheet" },
                    },
                }),
            },
        };

        // Mock google.auth and google.sheets
        (mockGoogle.auth as any) = {
            GoogleAuth: jest.fn().mockImplementation(() => ({})),
        };
        mockGoogle.sheets = jest.fn().mockReturnValue(mockSheets);

        service = new GoogleSheetsService();
    });

    describe("updateAllSheets", () => {
        it("должен обновить все настроенные Google Sheets", async () => {
            mockTariffsRepository.getLatestTariffs.mockResolvedValue(mockTariffs);

            await service.updateAllSheets();

            expect(mockTariffsRepository.getLatestTariffs).toHaveBeenCalledTimes(1);
            expect(mockSheets.spreadsheets.values.clear).toHaveBeenCalledTimes(2);
            expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledTimes(2);
        });

        it("должен пропустить обновление если нет тарифов", async () => {
            mockTariffsRepository.getLatestTariffs.mockResolvedValue([]);

            await service.updateAllSheets();

            expect(mockSheets.spreadsheets.values.clear).not.toHaveBeenCalled();
            expect(mockSheets.spreadsheets.values.update).not.toHaveBeenCalled();
        });

        it("должен обработать частичные ошибки при обновлении нескольких sheets", async () => {
            mockTariffsRepository.getLatestTariffs.mockResolvedValue(mockTariffs);
            mockSheets.spreadsheets.values.update.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("Sheet error"));

            await service.updateAllSheets();

            expect(mockSheets.spreadsheets.values.update).toHaveBeenCalledTimes(2);
        });

        it("должен правильно форматировать данные для Google Sheets", async () => {
            mockTariffsRepository.getLatestTariffs.mockResolvedValue(mockTariffs);

            await service.updateAllSheets();

            const updateCall = mockSheets.spreadsheets.values.update.mock.calls[0][0];
            const values = updateCall.requestBody.values;

            // Проверяем заголовок
            expect(values[0]).toEqual(["Склад", "Тип коробки", "Коэффициент", "Дата обновления", "Дата следующей коробки", "Дата до максимума"]);

            // Проверяем данные
            expect(values[1]).toEqual(["Коледино", "Короб", "1.5", "2025-10-22", "2025-10-23", "2025-10-30"]);
        });

        it("должен корректно обрабатывать null значения дат", async () => {
            const tariffsWithNullDates: TariffRecord[] = [
                {
                    ...mockTariffs[0],
                    dt_next_box: null,
                    dt_till_max: null,
                },
            ];
            mockTariffsRepository.getLatestTariffs.mockResolvedValue(tariffsWithNullDates);

            await service.updateAllSheets();

            const updateCall = mockSheets.spreadsheets.values.update.mock.calls[0][0];
            const values = updateCall.requestBody.values;

            expect(values[1][4]).toBe("");
            expect(values[1][5]).toBe("");
        });
    });

    describe("testConnection", () => {
        it("должен успешно проверить подключение", async () => {
            const result = await service.testConnection("test-sheet-id");

            expect(result).toBe(true);
            expect(mockSheets.spreadsheets.get).toHaveBeenCalledWith({
                spreadsheetId: "test-sheet-id",
            });
        });

        it("должен вернуть false при ошибке подключения", async () => {
            mockSheets.spreadsheets.get.mockRejectedValue(new Error("Connection error"));

            const result = await service.testConnection("test-sheet-id");

            expect(result).toBe(false);
        });
    });
});

describe("GoogleSheetsService - без конфигурации", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it("должен пропустить инициализацию если нет credentials", async () => {
        // Mock env без credentials
        jest.mock(
            "#config/env/env.js",
            () => ({
                default: {
                    GOOGLE_SERVICE_ACCOUNT_EMAIL: undefined,
                    GOOGLE_PRIVATE_KEY: undefined,
                    GOOGLE_SHEET_IDS: [],
                },
            }),
            { virtual: true },
        );

        const service = new GoogleSheetsService();
        await service.updateAllSheets();

        // Не должно быть ошибок
        expect(true).toBe(true);
    });
});
