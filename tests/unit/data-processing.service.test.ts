// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { DataProcessingService } from "../../src/services/data-processing.service.js";
import { WBTariffResponse } from "../../src/types/index.js";

// Mock dependencies
const mockFetchTariffs = jest.fn();
const mockParseCoefficient = jest.fn();
const mockUpsertTariffs = jest.fn();

jest.mock("../../src/services/wildberries.service.js", () => ({
    wildberriesService: {
        fetchTariffs: mockFetchTariffs,
        parseCoefficient: mockParseCoefficient,
    },
}));

jest.mock("../../src/repositories/tariffs.repository.js", () => ({
    tariffsRepository: {
        upsertTariffs: mockUpsertTariffs,
    },
}));

jest.mock("#utils/logger.js", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe("DataProcessingService", () => {
    let service: DataProcessingService;

    const mockApiResponse: WBTariffResponse = {
        response: {
            data: {
                dtNextBox: "2025-10-23T10:00:00Z",
                dtTillMax: "2025-10-30T10:00:00Z",
                warehouseList: [
                    {
                        warehouseName: "Коледино",
                        boxTypeName: "Короб",
                        boxDeliveryAndStorageExpr: "1.5",
                        boxDeliveryBase: "50",
                        boxDeliveryLiter: "10",
                        boxStorageBase: "30",
                        boxStorageLiter: "5",
                    },
                    {
                        warehouseName: "Подольск",
                        boxTypeName: "Монопаллета",
                        boxDeliveryAndStorageExpr: "2.0",
                        boxDeliveryBase: "100",
                        boxDeliveryLiter: "20",
                        boxStorageBase: "60",
                        boxStorageLiter: "10",
                    },
                ],
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockFetchTariffs.mockReset();
        mockParseCoefficient.mockReset();
        mockUpsertTariffs.mockReset();
        service = new DataProcessingService();
    });

    describe("fetchAndSaveTariffs", () => {
        it("должен успешно получить и сохранить тарифы", async () => {
            mockFetchTariffs.mockResolvedValue(mockApiResponse);
            mockParseCoefficient.mockReturnValue(1.5);
            mockUpsertTariffs.mockResolvedValue(undefined);

            const result = await service.fetchAndSaveTariffs();

            expect(result).toBe(true);
            expect(mockFetchTariffs).toHaveBeenCalledTimes(1);
            expect(mockUpsertTariffs).toHaveBeenCalledTimes(1);
        });

        it("должен вернуть false если API вернул null", async () => {
            mockFetchTariffs.mockResolvedValue(null);

            const result = await service.fetchAndSaveTariffs();

            expect(result).toBe(false);
            expect(mockUpsertTariffs).not.toHaveBeenCalled();
        });

        it("должен вернуть false если нет данных warehouseList", async () => {
            const invalidResponse: any = {
                response: {
                    data: {},
                },
            };
            mockFetchTariffs.mockResolvedValue(invalidResponse);

            const result = await service.fetchAndSaveTariffs();

            expect(result).toBe(false);
            expect(mockUpsertTariffs).not.toHaveBeenCalled();
        });

        it("должен обработать ошибку при сохранении в БД", async () => {
            mockFetchTariffs.mockResolvedValue(mockApiResponse);
            mockParseCoefficient.mockReturnValue(1.5);
            mockUpsertTariffs.mockRejectedValue(new Error("Database error"));

            const result = await service.fetchAndSaveTariffs();

            expect(result).toBe(false);
        });

        it("должен вызвать parseCoefficient для каждого склада", async () => {
            mockFetchTariffs.mockResolvedValue(mockApiResponse);
            mockParseCoefficient.mockReturnValue(1.5);
            mockUpsertTariffs.mockResolvedValue(undefined);

            await service.fetchAndSaveTariffs();

            expect(mockParseCoefficient).toHaveBeenCalledTimes(2);
        });

        it("должен вернуть false если warehouseList пуст", async () => {
            const emptyResponse: any = {
                response: {
                    data: {
                        dtNextBox: "2025-10-23T10:00:00Z",
                        dtTillMax: "2025-10-30T10:00:00Z",
                        warehouseList: [],
                    },
                },
            };
            mockFetchTariffs.mockResolvedValue(emptyResponse);

            const result = await service.fetchAndSaveTariffs();

            expect(result).toBe(false);
        });
    });
});
