// @ts-nocheck
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import cron from "node-cron";
import { SchedulerService } from "../../src/scheduler/index.js";
import { dataProcessingService } from "../../src/services/data-processing.service.js";
import { googleSheetsService } from "../../src/services/google-sheets.service.js";

// Mock dependencies
jest.mock("node-cron");
jest.mock("../../src/services/data-processing.service.js");
jest.mock("../../src/services/google-sheets.service.js");
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
        CRON_FETCH_WB_DATA: "0 * * * *",
        CRON_UPDATE_SHEETS: "*/30 * * * *",
    },
}));

const mockCron = cron as jest.Mocked<typeof cron>;
const mockDataProcessingService = dataProcessingService as jest.Mocked<typeof dataProcessingService>;
const mockGoogleSheetsService = googleSheetsService as jest.Mocked<typeof googleSheetsService>;

describe("SchedulerService", () => {
    let service: SchedulerService;
    let mockTask: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockTask = {
            stop: jest.fn(),
        };

        mockCron.schedule = jest.fn().mockReturnValue(mockTask);
        mockDataProcessingService.fetchAndSaveTariffs = jest.fn().mockResolvedValue(true);
        mockGoogleSheetsService.updateAllSheets = jest.fn().mockResolvedValue(undefined);

        service = new SchedulerService();
    });

    describe("start", () => {
        it("должен запустить планировщик с двумя задачами", () => {
            service.start();

            expect(mockCron.schedule).toHaveBeenCalledTimes(2);
            expect(mockCron.schedule).toHaveBeenCalledWith("0 * * * *", expect.any(Function));
            expect(mockCron.schedule).toHaveBeenCalledWith("*/30 * * * *", expect.any(Function));
        });

        it("должен выполнить начальные задачи при старте", async () => {
            // Чтобы дождаться выполнения async задач
            await new Promise(resolve => {
                service.start();
                setTimeout(resolve, 100);
            });

            expect(mockDataProcessingService.fetchAndSaveTariffs).toHaveBeenCalled();
            expect(mockGoogleSheetsService.updateAllSheets).toHaveBeenCalled();
        });

        it("должен выполнить fetchWBData при срабатывании cron", async () => {
            let cronCallback: Function | undefined;
            mockCron.schedule.mockImplementation((schedule, callback) => {
                if (schedule === "0 * * * *") {
                    cronCallback = callback;
                }
                return mockTask;
            });

            service.start();

            // Ждем выполнения начальных задач
            await new Promise(resolve => setTimeout(resolve, 100));

            // Очищаем моки после начальных вызовов
            jest.clearAllMocks();

            // Вызываем cron callback вручную
            if (cronCallback) {
                await cronCallback();
            }

            expect(mockDataProcessingService.fetchAndSaveTariffs).toHaveBeenCalledTimes(1);
        });

        it("должен выполнить updateGoogleSheets при срабатывании cron", async () => {
            let cronCallback: Function | undefined;
            mockCron.schedule.mockImplementation((schedule, callback) => {
                if (schedule === "*/30 * * * *") {
                    cronCallback = callback;
                }
                return mockTask;
            });

            service.start();

            // Ждем выполнения начальных задач
            await new Promise(resolve => setTimeout(resolve, 100));

            // Очищаем моки после начальных вызовов
            jest.clearAllMocks();

            // Вызываем cron callback вручную
            if (cronCallback) {
                await cronCallback();
            }

            expect(mockGoogleSheetsService.updateAllSheets).toHaveBeenCalledTimes(1);
        });

        it("должен обработать ошибку при выполнении fetchWBData", async () => {
            mockDataProcessingService.fetchAndSaveTariffs.mockResolvedValue(false);

            let cronCallback: Function | undefined;
            mockCron.schedule.mockImplementation((schedule, callback) => {
                if (schedule === "0 * * * *") {
                    cronCallback = callback;
                }
                return mockTask;
            });

            service.start();

            // Ждем выполнения начальных задач
            await new Promise(resolve => setTimeout(resolve, 100));

            // Вызываем cron callback вручную
            if (cronCallback) {
                await cronCallback();
            }

            // Не должно быть необработанных исключений
            expect(true).toBe(true);
        });

        it("должен обработать ошибку при выполнении updateGoogleSheets", async () => {
            mockGoogleSheetsService.updateAllSheets.mockRejectedValue(new Error("Sheets error"));

            let cronCallback: Function | undefined;
            mockCron.schedule.mockImplementation((schedule, callback) => {
                if (schedule === "*/30 * * * *") {
                    cronCallback = callback;
                }
                return mockTask;
            });

            service.start();

            // Ждем выполнения начальных задач
            await new Promise(resolve => setTimeout(resolve, 100));

            // Вызываем cron callback вручную
            if (cronCallback) {
                await cronCallback();
            }

            // Не должно быть необработанных исключений
            expect(true).toBe(true);
        });
    });

    describe("stop", () => {
        it("должен остановить все задачи", () => {
            service.start();
            service.stop();

            expect(mockTask.stop).toHaveBeenCalledTimes(2);
        });

        it("должен корректно работать если задачи не запущены", () => {
            service.stop();

            expect(mockTask.stop).not.toHaveBeenCalled();
        });
    });

    describe("getStatus", () => {
        it("должен вернуть stopped когда задачи не запущены", () => {
            const status = service.getStatus();

            expect(status).toEqual({
                fetchData: "stopped",
                updateSheets: "stopped",
            });
        });

        it("должен вернуть running когда задачи запущены", () => {
            service.start();
            const status = service.getStatus();

            expect(status).toEqual({
                fetchData: "running",
                updateSheets: "running",
            });
        });

        it("должен вернуть stopped после остановки", () => {
            service.start();
            service.stop();
            const status = service.getStatus();

            expect(status).toEqual({
                fetchData: "stopped",
                updateSheets: "stopped",
            });
        });
    });
});

