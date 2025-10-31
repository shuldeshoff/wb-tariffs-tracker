import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import axios from "axios";
import { WildberriesService } from "../../src/services/wildberries.service.js";
import { mockWBApiResponse } from "../mocks/data.js";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock env
jest.mock("#config/env/env.js", () => ({
    default: {
        WB_API_URL: "https://test-api.wildberries.ru",
        WB_API_TOKEN: "test-token",
        LOG_LEVEL: "info",
    },
}));

// Mock logger
jest.mock("#utils/logger.js", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

describe("WildberriesService", () => {
    let service: WildberriesService;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup axios mock
        mockedAxios.create = jest.fn().mockReturnValue({
            get: jest.fn(),
            defaults: {
                headers: {
                    common: {},
                },
            },
            interceptors: {
                response: {
                    use: jest.fn(),
                },
            },
        }) as any;

        service = new WildberriesService();
    });

    describe("fetchTariffs", () => {
        it("должен успешно получить тарифы", async () => {
            const mockClient: any = (mockedAxios.create as jest.Mock).mock.results[0].value;
            mockClient.get.mockResolvedValueOnce({ data: mockWBApiResponse });

            const result = await service.fetchTariffs();

            expect(result).toEqual(mockWBApiResponse);
            expect(mockClient.get).toHaveBeenCalledWith("");
        });

        it("должен вернуть null при ошибке после всех попыток", async () => {
            const mockClient: any = (mockedAxios.create as jest.Mock).mock.results[0].value;
            mockClient.get.mockRejectedValue(new Error("Network error"));

            const result = await service.fetchTariffs();

            expect(result).toBeNull();
            expect(mockClient.get).toHaveBeenCalledTimes(3); // 3 retry attempts
        });

        it("должен вернуть null при некорректной структуре ответа", async () => {
            const mockClient: any = (mockedAxios.create as jest.Mock).mock.results[0].value;
            mockClient.get.mockResolvedValueOnce({ data: {} });

            const result = await service.fetchTariffs();

            expect(result).toBeNull();
        });

        it("не должен повторять запрос при клиентских ошибках (4xx)", async () => {
            const mockClient: any = (mockedAxios.create as jest.Mock).mock.results[0].value;
            const error: any = new Error("Bad Request");
            error.isAxiosError = true;
            error.response = { status: 400 };
            mockClient.get.mockRejectedValue(error);

            const result = await service.fetchTariffs();

            expect(result).toBeNull();
            expect(mockClient.get).toHaveBeenCalledTimes(1); // No retries for 4xx
        });
    });

    describe("parseCoefficient", () => {
        it("должен корректно парсить числовые значения", () => {
            expect(service.parseCoefficient("1.5")).toBe(1.5);
            expect(service.parseCoefficient("2")).toBe(2);
            expect(service.parseCoefficient("0.5")).toBe(0.5);
        });

        it("должен вернуть 0 для некорректных значений", () => {
            expect(service.parseCoefficient("invalid")).toBe(0);
            expect(service.parseCoefficient("")).toBe(0);
        });
    });
});
