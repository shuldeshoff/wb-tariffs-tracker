import cron from "node-cron";
import env from "#config/env/env.js";
import { logger } from "#utils/logger.js";
import { dataProcessingService } from "#services/data-processing.service.js";
import { googleSheetsService } from "#services/google-sheets.service.js";

/**
 * Scheduler Service
 * Manages cron jobs for periodic tasks
 */
export class SchedulerService {
    private fetchDataTask: cron.ScheduledTask | null = null;
    private updateSheetsTask: cron.ScheduledTask | null = null;

    /**
     * Start all scheduled tasks
     */
    start(): void {
        logger.info("Starting scheduler...");

        // Task 1: Fetch WB data and save to database (every hour by default)
        const fetchCron = env.CRON_FETCH_WB_DATA || "0 * * * *";
        this.fetchDataTask = cron.schedule(fetchCron, async () => {
            logger.info("=== Running scheduled task: Fetch WB Data ===");
            await this.fetchWBData();
        });

        // Task 2: Update Google Sheets (every 30 minutes by default)
        const updateSheetsCron = env.CRON_UPDATE_SHEETS || "*/30 * * * *";
        this.updateSheetsTask = cron.schedule(updateSheetsCron, async () => {
            logger.info("=== Running scheduled task: Update Google Sheets ===");
            await this.updateGoogleSheets();
        });

        logger.info(`Scheduler started with following schedules:`);
        logger.info(`  - Fetch WB Data: ${fetchCron}`);
        logger.info(`  - Update Google Sheets: ${updateSheetsCron}`);

        // Run tasks immediately on startup
        logger.info("Running initial tasks...");
        this.runInitialTasks();
    }

    /**
     * Stop all scheduled tasks
     */
    stop(): void {
        logger.info("Stopping scheduler...");

        if (this.fetchDataTask) {
            this.fetchDataTask.stop();
            this.fetchDataTask = null;
        }

        if (this.updateSheetsTask) {
            this.updateSheetsTask.stop();
            this.updateSheetsTask = null;
        }

        logger.info("Scheduler stopped");
    }

    /**
     * Run initial tasks on application startup
     */
    private async runInitialTasks(): Promise<void> {
        // Fetch WB data first
        await this.fetchWBData();

        // Then update Google Sheets
        await this.updateGoogleSheets();

        logger.info("Initial tasks completed");
    }

    /**
     * Fetch WB data and save to database
     */
    private async fetchWBData(): Promise<void> {
        try {
            const success = await dataProcessingService.fetchAndSaveTariffs();

            if (success) {
                logger.info("✓ WB data fetch task completed successfully");
            } else {
                logger.error("✗ WB data fetch task failed");
            }
        } catch (error) {
            logger.error(`✗ Error in WB data fetch task: ${error}`);
        }
    }

    /**
     * Update Google Sheets with latest data
     */
    private async updateGoogleSheets(): Promise<void> {
        try {
            await googleSheetsService.updateAllSheets();
            logger.info("✓ Google Sheets update task completed successfully");
        } catch (error) {
            logger.error(`✗ Error in Google Sheets update task: ${error}`);
        }
    }

    /**
     * Get status of scheduled tasks
     */
    getStatus(): { fetchData: string; updateSheets: string } {
        return {
            fetchData: this.fetchDataTask ? "running" : "stopped",
            updateSheets: this.updateSheetsTask ? "running" : "stopped",
        };
    }
}

// Export singleton instance
export const schedulerService = new SchedulerService();

