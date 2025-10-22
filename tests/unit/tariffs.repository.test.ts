// @ts-nocheck
import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { Knex } from "knex";
import { TariffsRepository } from "../../src/repositories/tariffs.repository.js";
import { TariffRecord } from "../../src/types/index.js";

// Mock logger
jest.mock("#utils/logger.js", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe("TariffsRepository", () => {
    let repository: TariffsRepository;
    let mockDb: any;
    let queryBuilder: any;

    beforeEach(() => {
        // Create mock query builder
        queryBuilder = {
            insert: jest.fn().mockReturnThis(),
            onConflict: jest.fn().mockReturnThis(),
            merge: jest.fn().mockResolvedValue(undefined),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue([]),
            max: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
            distinct: jest.fn().mockReturnThis(),
            del: jest.fn().mockResolvedValue(0),
        };

        // Create mock database
        mockDb = jest.fn().mockReturnValue(queryBuilder);
        mockDb.fn = {
            now: jest.fn().mockReturnValue("NOW()"),
        };

        repository = new TariffsRepository(mockDb as unknown as Knex);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("upsertTariffs", () => {
        it("должен вставить тарифы в БД", async () => {
            const tariffs: Omit<TariffRecord, "id" | "created_at" | "updated_at">[] = [
                {
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
                },
            ];

            await repository.upsertTariffs(tariffs);

            expect(mockDb).toHaveBeenCalledWith("tariffs");
            expect(queryBuilder.insert).toHaveBeenCalledWith(tariffs[0]);
            expect(queryBuilder.onConflict).toHaveBeenCalledWith(["date", "warehouse_name", "box_type"]);
            expect(queryBuilder.merge).toHaveBeenCalled();
        });

        it("должен обработать несколько тарифов", async () => {
            const tariffs: Omit<TariffRecord, "id" | "created_at" | "updated_at">[] = [
                {
                    date: new Date("2025-10-22"),
                    warehouse_name: "Коледино",
                    box_type: "Короб",
                    coefficient: 1.5,
                    dt_next_box: null,
                    dt_till_max: null,
                    delivery_base: "50",
                    delivery_liter: "10",
                    storage_base: "30",
                    storage_liter: "5",
                    raw_data: {},
                },
                {
                    date: new Date("2025-10-22"),
                    warehouse_name: "Подольск",
                    box_type: "Монопаллета",
                    coefficient: 2.0,
                    dt_next_box: null,
                    dt_till_max: null,
                    delivery_base: "100",
                    delivery_liter: "20",
                    storage_base: "60",
                    storage_liter: "10",
                    raw_data: {},
                },
            ];

            await repository.upsertTariffs(tariffs);

            expect(queryBuilder.insert).toHaveBeenCalledTimes(2);
        });

        it("должен пробросить ошибку при сбое БД", async () => {
            const tariffs: Omit<TariffRecord, "id" | "created_at" | "updated_at">[] = [
                {
                    date: new Date("2025-10-22"),
                    warehouse_name: "Коледино",
                    box_type: "Короб",
                    coefficient: 1.5,
                    dt_next_box: null,
                    dt_till_max: null,
                    delivery_base: "50",
                    delivery_liter: "10",
                    storage_base: "30",
                    storage_liter: "5",
                    raw_data: {},
                },
            ];

            queryBuilder.merge.mockRejectedValue(new Error("Database error"));

            await expect(repository.upsertTariffs(tariffs)).rejects.toThrow("Database error");
        });
    });

    describe("getTariffsByDate", () => {
        it("должен получить тарифы за определенную дату", async () => {
            const date = new Date("2025-10-22");
            const mockTariffs: TariffRecord[] = [
                {
                    id: 1,
                    date,
                    warehouse_name: "Коледино",
                    box_type: "Короб",
                    coefficient: 1.5,
                    dt_next_box: null,
                    dt_till_max: null,
                    delivery_base: "50",
                    delivery_liter: "10",
                    storage_base: "30",
                    storage_liter: "5",
                    raw_data: {},
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            queryBuilder.select.mockResolvedValue(mockTariffs);

            const result = await repository.getTariffsByDate(date);

            expect(mockDb).toHaveBeenCalledWith("tariffs");
            expect(queryBuilder.where).toHaveBeenCalledWith("date", date);
            expect(queryBuilder.orderBy).toHaveBeenCalledWith("coefficient", "asc");
            expect(result).toEqual(mockTariffs);
        });

        it("должен вернуть пустой массив если нет данных", async () => {
            queryBuilder.select.mockResolvedValue([]);

            const result = await repository.getTariffsByDate(new Date("2025-10-22"));

            expect(result).toEqual([]);
        });
    });

    describe("getLatestTariffs", () => {
        it("должен получить последние тарифы", async () => {
            const maxDate = new Date("2025-10-22");
            const mockTariffs: TariffRecord[] = [
                {
                    id: 1,
                    date: maxDate,
                    warehouse_name: "Коледино",
                    box_type: "Короб",
                    coefficient: 1.5,
                    dt_next_box: null,
                    dt_till_max: null,
                    delivery_base: "50",
                    delivery_liter: "10",
                    storage_base: "30",
                    storage_liter: "5",
                    raw_data: {},
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            // Mock для получения максимальной даты
            const maxQueryBuilder = {
                max: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue({ max_date: maxDate }),
            };

            // Mock для получения тарифов
            const tariffsQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                select: jest.fn().mockResolvedValue(mockTariffs),
            };

            mockDb.mockReturnValueOnce(maxQueryBuilder).mockReturnValueOnce(tariffsQueryBuilder);

            const result = await repository.getLatestTariffs();

            expect(result).toEqual(mockTariffs);
        });

        it("должен вернуть пустой массив если нет тарифов в БД", async () => {
            const maxQueryBuilder = {
                max: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(null),
            };

            mockDb.mockReturnValueOnce(maxQueryBuilder);

            const result = await repository.getLatestTariffs();

            expect(result).toEqual([]);
        });

        it("должен вернуть пустой массив если max_date = null", async () => {
            const maxQueryBuilder = {
                max: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue({ max_date: null }),
            };

            mockDb.mockReturnValueOnce(maxQueryBuilder);

            const result = await repository.getLatestTariffs();

            expect(result).toEqual([]);
        });
    });

    describe("getAllDates", () => {
        it("должен получить все даты с тарифами", async () => {
            const dates = [
                { date: "2025-10-22" },
                { date: "2025-10-21" },
                { date: "2025-10-20" },
            ];

            queryBuilder.select.mockResolvedValue(dates);

            const result = await repository.getAllDates();

            expect(mockDb).toHaveBeenCalledWith("tariffs");
            expect(queryBuilder.distinct).toHaveBeenCalledWith("date");
            expect(queryBuilder.orderBy).toHaveBeenCalledWith("date", "desc");
            expect(result).toHaveLength(3);
            expect(result[0]).toBeInstanceOf(Date);
        });

        it("должен вернуть пустой массив если нет дат", async () => {
            queryBuilder.select.mockResolvedValue([]);

            const result = await repository.getAllDates();

            expect(result).toEqual([]);
        });
    });

    describe("deleteOldTariffs", () => {
        it("должен удалить старые тарифы (по умолчанию 30 дней)", async () => {
            queryBuilder.del.mockResolvedValue(15);

            const result = await repository.deleteOldTariffs();

            expect(mockDb).toHaveBeenCalledWith("tariffs");
            expect(queryBuilder.where).toHaveBeenCalledWith("date", "<", expect.any(Date));
            expect(queryBuilder.del).toHaveBeenCalled();
            expect(result).toBe(15);
        });

        it("должен удалить старые тарифы с заданным количеством дней", async () => {
            queryBuilder.del.mockResolvedValue(10);

            const result = await repository.deleteOldTariffs(7);

            expect(result).toBe(10);
        });

        it("должен вернуть 0 если нет записей для удаления", async () => {
            queryBuilder.del.mockResolvedValue(0);

            const result = await repository.deleteOldTariffs(30);

            expect(result).toBe(0);
        });
    });
});

