import env from "#config/env/env.js";
import { logger } from "#utils/logger.js";
import { schedulerService } from "#scheduler/index.js";
import { httpServer } from "#services/http-server.service.js";

/** Main application entry point */
class Application {
    start(): void {
        try {
            logger.info("=".repeat(50));
            logger.info("Starting WB Tariffs Service");
            logger.info("=".repeat(50));

            // Log configuration
            this.logConfiguration();

            // Start HTTP server
            httpServer.start();

            // Start scheduler
            schedulerService.start();

            // Setup graceful shutdown
            this.setupGracefulShutdown();

            logger.info("Application started successfully");
            logger.info("=".repeat(50));
        } catch (error) {
            logger.error(`Failed to start application: ${error}`);
            process.exit(1);
        }
    }

    private logConfiguration(): void {
        logger.info("Configuration:");
        logger.info(`  - Database: ${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`);
        logger.info(`  - WB API URL: ${env.WB_API_URL || "Not configured"}`);
        logger.info(`  - Google Sheets: ${env.GOOGLE_SHEET_IDS?.length || 0} sheets configured`);
        logger.info(`  - Fetch Schedule: ${env.CRON_FETCH_WB_DATA}`);
        logger.info(`  - Update Schedule: ${env.CRON_UPDATE_SHEETS}`);
        logger.info(`  - Log Level: ${env.LOG_LEVEL}`);
    }

    private setupGracefulShutdown(): void {
        const shutdown = async (signal: string) => {
            logger.info(`\nReceived ${signal} signal. Shutting down gracefully...`);

            schedulerService.stop();
            await httpServer.stop();

            logger.info("Shutdown complete. Exiting.");
            process.exit(0);
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));

        // Handle uncaught errors
        process.on("uncaughtException", (error) => {
            logger.error(`Uncaught Exception: ${error.message}`);
            logger.error(error.stack || "");
            shutdown("uncaughtException");
        });

        process.on("unhandledRejection", (reason, promise) => {
            logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
            shutdown("unhandledRejection");
        });
    }
}

// Start application
const app = new Application();
app.start();
