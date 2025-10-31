import express, { Express, Request, Response } from "express";
import env from "#config/env/env.js";
import { logger } from "#utils/logger.js";
import { metricsService } from "#services/metrics.service.js";
import knex from "#postgres/knex.js";
import { schedulerService } from "#scheduler/index.js";

import { Server } from "http";

interface HealthCheck {
    status: string;
    latency?: number;
    error?: string;
}

interface HealthStatus {
    status: string;
    timestamp: string;
    uptime: number;
    checks: {
        database: HealthCheck;
        scheduler: {
            status: string;
            tasks: Record<string, string>;
        };
    };
}

/** HTTP Server for Health Checks and Metrics */
export class HttpServer {
    private app: Express;
    private port: number;
    private server: Server | null = null;

    constructor() {
        this.app = express();
        this.port = env.APP_PORT || 3000;
        this.setupMiddleware();
        this.setupRoutes();
    }

    /** Setup middleware */
    private setupMiddleware(): void {
        this.app.use(express.json());

        // Request logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`);
            next();
        });
    }

    /** Setup routes */
    private setupRoutes(): void {
        // Health check endpoint
        this.app.get("/health", async (req: Request, res: Response) => {
            try {
                const health = await this.getHealthStatus();
                const statusCode = health.status === "healthy" ? 200 : 503;
                res.status(statusCode).json(health);
            } catch (error) {
                logger.error(`Health check error: ${error}`);
                res.status(503).json({
                    status: "unhealthy",
                    error: "Health check failed",
                });
            }
        });

        // Readiness check
        this.app.get("/ready", async (req: Request, res: Response) => {
            try {
                // Check database connection
                await knex.raw("SELECT 1");

                res.status(200).json({
                    status: "ready",
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                logger.error(`Readiness check error: ${error}`);
                res.status(503).json({
                    status: "not_ready",
                    error: "Service not ready",
                });
            }
        });

        // Liveness check
        this.app.get("/live", (req: Request, res: Response) => {
            res.status(200).json({
                status: "alive",
                timestamp: new Date().toISOString(),
            });
        });

        // Metrics endpoint
        this.app.get("/metrics", async (req: Request, res: Response) => {
            try {
                const metrics = await metricsService.getMetrics();
                res.set("Content-Type", metricsService.getContentType());
                res.send(metrics);
            } catch (error) {
                logger.error(`Metrics error: ${error}`);
                res.status(500).send("Error generating metrics");
            }
        });

        // Status endpoint
        this.app.get("/status", (req: Request, res: Response) => {
            const schedulerStatus = schedulerService.getStatus();
            res.json({
                service: "wb-tariffs-service",
                version: "1.0.0",
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                scheduler: schedulerStatus,
                env: env.NODE_ENV || "development",
            });
        });
    }

    /** Get comprehensive health status */
    private async getHealthStatus(): Promise<HealthStatus> {
        const database = await this.checkDatabase();
        const scheduler = this.checkScheduler();

        const checks = {
            database,
            scheduler,
        };

        const allHealthy = database.status === "healthy" && scheduler.status === "healthy";

        return {
            status: allHealthy ? "healthy" : "unhealthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            checks,
        };
    }

    /** Check database health */
    private async checkDatabase(): Promise<HealthCheck> {
        try {
            const start = Date.now();
            await knex.raw("SELECT 1");
            const latency = Date.now() - start;

            return {
                status: "healthy",
                latency,
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Unknown error";
            return {
                status: "unhealthy",
                error: message,
            };
        }
    }

    /** Check scheduler health */
    private checkScheduler(): { status: string; tasks: Record<string, string> } {
        const tasks = schedulerService.getStatus();
        const allRunning = Object.values(tasks).every((status) => status === "running");

        return {
            status: allRunning ? "healthy" : "unhealthy",
            tasks,
        };
    }

    /** Start HTTP server */
    start(): void {
        this.server = this.app.listen(this.port, () => {
            logger.info(`HTTP server started on port ${this.port}`);
            logger.info(`Health check: http://localhost:${this.port}/health`);
            logger.info(`Metrics: http://localhost:${this.port}/metrics`);
            logger.info(`Status: http://localhost:${this.port}/status`);
        });
    }

    /** Stop HTTP server */
    stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.server) {
                resolve();
                return;
            }

            this.server.close((err: Error | undefined) => {
                if (err) {
                    logger.error(`Error stopping HTTP server: ${err}`);
                    reject(err);
                } else {
                    logger.info("HTTP server stopped");
                    resolve();
                }
            });
        });
    }
}

// Export singleton instance
export const httpServer = new HttpServer();
