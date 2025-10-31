import axios, { AxiosInstance, AxiosError } from "axios";
import env from "#config/env/env.js";
import { logger } from "#utils/logger.js";
import { WBTariffResponse } from "#types/index.js";
import { metricsService } from "#services/metrics.service.js";

/** Wildberries API Service Handles fetching tariff data from WB API */
export class WildberriesService {
    private client: AxiosInstance;
    private maxRetries: number = 3;
    private retryDelay: number = 2000;

    constructor() {
        this.client = axios.create({
            baseURL: env.WB_API_URL,
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Add Authorization header if token is provided
        if (env.WB_API_TOKEN) {
            this.client.defaults.headers.common["Authorization"] = `Bearer ${env.WB_API_TOKEN}`;
        }

        // Response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                logger.info(`WB API request successful: ${response.config.url}`);
                return response;
            },
            (error) => {
                logger.error(`WB API request failed: ${error.message}`);
                return Promise.reject(error);
            },
        );
    }

    /** Fetch tariffs data from WB API with retry logic */
    async fetchTariffs(): Promise<WBTariffResponse | null> {
        let lastError: Error | null = null;
        const endTimer = metricsService.measureWbApiDuration();

        // Get current date in YYYY-MM-DD format (required by WB API)
        const date = new Date().toISOString().split("T")[0];

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                logger.info(`Fetching WB tariffs (attempt ${attempt}/${this.maxRetries}) for date: ${date}...`);

                const response = await this.client.get<WBTariffResponse>("/api/v1/tariffs/box", {
                    params: { date },
                });

                if (!response.data || !response.data.response) {
                    throw new Error("Invalid API response structure");
                }

                logger.info(`Successfully fetched WB tariffs. Data: ${JSON.stringify(response.data).substring(0, 200)}...`);

                metricsService.recordWbApiRequest("success");
                endTimer();

                return response.data;
            } catch (error) {
                lastError = error as Error;

                if (this.isAxiosError(error)) {
                    const errorType = error.response?.status ? `http_${error.response.status}` : "network";
                    metricsService.recordWbApiError(errorType);

                    logger.error(`WB API error (attempt ${attempt}/${this.maxRetries}): ` + `Status: ${error.response?.status}, Message: ${error.message}`);
                } else {
                    metricsService.recordWbApiError("unknown");
                    logger.error(`Error fetching WB tariffs (attempt ${attempt}/${this.maxRetries}): ${error}`);
                }

                // Don't retry on client errors (4xx)
                if (this.isAxiosError(error) && error.response?.status && error.response.status >= 400 && error.response.status < 500) {
                    logger.error("Client error detected, not retrying");
                    break;
                }

                // Wait before retry (except on last attempt)
                if (attempt < this.maxRetries) {
                    logger.info(`Retrying in ${this.retryDelay}ms...`);
                    await this.delay(this.retryDelay);
                }
            }
        }

        logger.error(`Failed to fetch WB tariffs after ${this.maxRetries} attempts: ${lastError?.message}`);
        metricsService.recordWbApiRequest("error");
        endTimer();

        return null;
    }

    /** Type guard for AxiosError */
    private isAxiosError(error: unknown): error is AxiosError {
        return typeof error === "object" && error !== null && "isAxiosError" in error && error.isAxiosError === true;
    }

    /** Delay helper for retry logic */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /** Parse coefficient from expression string Example: "2.5" or "3" */
    parseCoefficient(expr: string): number {
        try {
            const num = parseFloat(expr);
            return isNaN(num) ? 0 : num;
        } catch {
            return 0;
        }
    }
}

// Export singleton instance
export const wildberriesService = new WildberriesService();
