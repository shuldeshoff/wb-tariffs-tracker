import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
    POSTGRES_HOST: z.string().optional().default("localhost"),
    POSTGRES_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value))
        .default("5432"),
    POSTGRES_DB: z.string().default("postgres"),
    POSTGRES_USER: z.string().default("postgres"),
    POSTGRES_PASSWORD: z.string().default("postgres"),
    APP_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value))
        .optional()
        .default("3000"),
    // Wildberries API
    WB_API_URL: z.string().url().optional(),
    WB_API_TOKEN: z.string().optional(),
    // Google Sheets
    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email().optional(),
    GOOGLE_PRIVATE_KEY: z.string().optional(),
    GOOGLE_SHEET_IDS: z.string().transform((val) => val.split(",")).optional(),
    // Cron schedules
    CRON_FETCH_WB_DATA: z.string().default("0 * * * *"),
    CRON_UPDATE_SHEETS: z.string().default("*/30 * * * *"),
    // Logging
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const env = envSchema.parse({
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
    APP_PORT: process.env.APP_PORT,
    WB_API_URL: process.env.WB_API_URL,
    WB_API_TOKEN: process.env.WB_API_TOKEN,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_SHEET_IDS: process.env.GOOGLE_SHEET_IDS,
    CRON_FETCH_WB_DATA: process.env.CRON_FETCH_WB_DATA,
    CRON_UPDATE_SHEETS: process.env.CRON_UPDATE_SHEETS,
    LOG_LEVEL: process.env.LOG_LEVEL,
});

export default env;
