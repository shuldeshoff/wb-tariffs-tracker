import { Registry, Counter, Gauge, Histogram } from "prom-client";
import { logger } from "#utils/logger.js";

/**
 * Prometheus Metrics Service
 * Collects and exposes application metrics
 */
export class MetricsService {
    public registry: Registry;

    // Counters
    private wbApiRequestsTotal: Counter;
    private wbApiErrorsTotal: Counter;
    private sheetsUpdateTotal: Counter;
    private sheetsUpdateErrorsTotal: Counter;
    private tariffsProcessedTotal: Counter;

    // Gauges
    private lastSuccessfulFetchTimestamp: Gauge;
    private lastSuccessfulSheetsUpdateTimestamp: Gauge;
    private activeTasksGauge: Gauge;

    // Histograms
    private wbApiDuration: Histogram;
    private sheetsUpdateDuration: Histogram;
    private dbOperationDuration: Histogram;

    constructor() {
        this.registry = new Registry();

        // Initialize counters
        this.wbApiRequestsTotal = new Counter({
            name: "wb_api_requests_total",
            help: "Total number of requests to WB API",
            labelNames: ["status"],
            registers: [this.registry],
        });

        this.wbApiErrorsTotal = new Counter({
            name: "wb_api_errors_total",
            help: "Total number of errors from WB API",
            labelNames: ["error_type"],
            registers: [this.registry],
        });

        this.sheetsUpdateTotal = new Counter({
            name: "sheets_update_total",
            help: "Total number of Google Sheets updates",
            labelNames: ["status"],
            registers: [this.registry],
        });

        this.sheetsUpdateErrorsTotal = new Counter({
            name: "sheets_update_errors_total",
            help: "Total number of Google Sheets update errors",
            registers: [this.registry],
        });

        this.tariffsProcessedTotal = new Counter({
            name: "tariffs_processed_total",
            help: "Total number of tariffs processed",
            registers: [this.registry],
        });

        // Initialize gauges
        this.lastSuccessfulFetchTimestamp = new Gauge({
            name: "last_successful_fetch_timestamp",
            help: "Timestamp of last successful WB API fetch",
            registers: [this.registry],
        });

        this.lastSuccessfulSheetsUpdateTimestamp = new Gauge({
            name: "last_successful_sheets_update_timestamp",
            help: "Timestamp of last successful Google Sheets update",
            registers: [this.registry],
        });

        this.activeTasksGauge = new Gauge({
            name: "active_tasks",
            help: "Number of currently active tasks",
            labelNames: ["task_type"],
            registers: [this.registry],
        });

        // Initialize histograms
        this.wbApiDuration = new Histogram({
            name: "wb_api_duration_seconds",
            help: "Duration of WB API requests in seconds",
            buckets: [0.1, 0.5, 1, 2, 5, 10],
            registers: [this.registry],
        });

        this.sheetsUpdateDuration = new Histogram({
            name: "sheets_update_duration_seconds",
            help: "Duration of Google Sheets updates in seconds",
            buckets: [0.5, 1, 2, 5, 10, 30],
            registers: [this.registry],
        });

        this.dbOperationDuration = new Histogram({
            name: "db_operation_duration_seconds",
            help: "Duration of database operations in seconds",
            labelNames: ["operation"],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
            registers: [this.registry],
        });

        logger.info("Metrics service initialized");
    }

    /**
     * Record WB API request
     */
    recordWbApiRequest(status: "success" | "error"): void {
        this.wbApiRequestsTotal.labels(status).inc();
        if (status === "success") {
            this.lastSuccessfulFetchTimestamp.setToCurrentTime();
        }
    }

    /**
     * Record WB API error
     */
    recordWbApiError(errorType: string): void {
        this.wbApiErrorsTotal.labels(errorType).inc();
    }

    /**
     * Measure WB API request duration
     */
    measureWbApiDuration(): () => void {
        const end = this.wbApiDuration.startTimer();
        return () => end();
    }

    /**
     * Record Google Sheets update
     */
    recordSheetsUpdate(status: "success" | "error"): void {
        this.sheetsUpdateTotal.labels(status).inc();
        if (status === "success") {
            this.lastSuccessfulSheetsUpdateTimestamp.setToCurrentTime();
        }
    }

    /**
     * Record Google Sheets update error
     */
    recordSheetsUpdateError(): void {
        this.sheetsUpdateErrorsTotal.inc();
    }

    /**
     * Measure Google Sheets update duration
     */
    measureSheetsUpdateDuration(): () => void {
        const end = this.sheetsUpdateDuration.startTimer();
        return () => end();
    }

    /**
     * Record processed tariffs count
     */
    recordTariffsProcessed(count: number): void {
        this.tariffsProcessedTotal.inc(count);
    }

    /**
     * Set active tasks count
     */
    setActiveTasks(taskType: string, count: number): void {
        this.activeTasksGauge.labels(taskType).set(count);
    }

    /**
     * Measure database operation duration
     */
    measureDbOperation(operation: string): () => void {
        const end = this.dbOperationDuration.labels(operation).startTimer();
        return () => end();
    }

    /**
     * Get metrics in Prometheus format
     */
    async getMetrics(): Promise<string> {
        return await this.registry.metrics();
    }

    /**
     * Get metrics content type
     */
    getContentType(): string {
        return this.registry.contentType;
    }
}

// Export singleton instance
export const metricsService = new MetricsService();

