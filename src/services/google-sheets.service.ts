import { google, sheets_v4 } from "googleapis";
import env from "#config/env/env.js";
import { logger } from "#utils/logger.js";
import { tariffsRepository } from "#repositories/tariffs.repository.js";
import { TariffRecord } from "#types/index.js";

/**
 * Google Sheets Service
 * Handles authentication and data synchronization with Google Sheets
 */
export class GoogleSheetsService {
    private sheets: sheets_v4.Sheets | null = null;
    private readonly sheetName = "stocks_coefs";

    constructor() {
        this.initializeAuth();
    }

    /**
     * Initialize Google Sheets API with Service Account authentication
     */
    private initializeAuth(): void {
        try {
            if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
                logger.warn("Google Sheets credentials not configured. Skipping initialization.");
                return;
            }

            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
                },
                scopes: ["https://www.googleapis.com/auth/spreadsheets"],
            });

            this.sheets = google.sheets({ version: "v4", auth });
            logger.info("Google Sheets API initialized successfully");
        } catch (error) {
            logger.error(`Error initializing Google Sheets API: ${error}`);
        }
    }

    /**
     * Update all configured Google Sheets with latest tariff data
     */
    async updateAllSheets(): Promise<void> {
        if (!this.sheets) {
            logger.warn("Google Sheets API not initialized. Skipping update.");
            return;
        }

        if (!env.GOOGLE_SHEET_IDS || env.GOOGLE_SHEET_IDS.length === 0) {
            logger.warn("No Google Sheet IDs configured. Skipping update.");
            return;
        }

        logger.info(`Updating ${env.GOOGLE_SHEET_IDS.length} Google Sheets...`);

        const tariffs = await tariffsRepository.getLatestTariffs();

        if (tariffs.length === 0) {
            logger.warn("No tariff data available to update sheets");
            return;
        }

        const updatePromises = env.GOOGLE_SHEET_IDS.map((sheetId) => this.updateSheet(sheetId.trim(), tariffs));

        const results = await Promise.allSettled(updatePromises);

        const successful = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        logger.info(`Google Sheets update completed: ${successful} successful, ${failed} failed`);
    }

    /**
     * Update a single Google Sheet with tariff data
     */
    private async updateSheet(spreadsheetId: string, tariffs: TariffRecord[]): Promise<void> {
        if (!this.sheets) {
            throw new Error("Google Sheets API not initialized");
        }

        try {
            logger.info(`Updating sheet ${spreadsheetId}...`);

            // Prepare data for Google Sheets
            const values = this.prepareSheetData(tariffs);

            // Clear existing data
            await this.clearSheet(spreadsheetId);

            // Write new data
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${this.sheetName}!A1`,
                valueInputOption: "RAW",
                requestBody: {
                    values,
                },
            });

            logger.info(`Successfully updated sheet ${spreadsheetId} with ${tariffs.length} rows`);
        } catch (error: any) {
            logger.error(`Error updating sheet ${spreadsheetId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Prepare tariff data for Google Sheets format
     * Sort by coefficient (ascending) and format as 2D array
     */
    private prepareSheetData(tariffs: TariffRecord[]): string[][] {
        // Header row
        const header = ["Склад", "Тип коробки", "Коэффициент", "Дата обновления", "Дата следующей коробки", "Дата до максимума"];

        // Data rows (already sorted by coefficient in repository)
        const rows = tariffs.map((tariff) => [
            tariff.warehouse_name,
            tariff.box_type,
            tariff.coefficient.toString(),
            tariff.date.toISOString().split("T")[0],
            tariff.dt_next_box ? tariff.dt_next_box.toISOString().split("T")[0] : "",
            tariff.dt_till_max ? tariff.dt_till_max.toISOString().split("T")[0] : "",
        ]);

        return [header, ...rows];
    }

    /**
     * Clear existing data in the sheet
     */
    private async clearSheet(spreadsheetId: string): Promise<void> {
        if (!this.sheets) {
            throw new Error("Google Sheets API not initialized");
        }

        try {
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: `${this.sheetName}!A:Z`,
            });

            logger.info(`Cleared sheet ${spreadsheetId}`);
        } catch (error: any) {
            logger.error(`Error clearing sheet ${spreadsheetId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check if Google Sheets is configured and working
     */
    async testConnection(spreadsheetId: string): Promise<boolean> {
        if (!this.sheets) {
            logger.error("Google Sheets API not initialized");
            return false;
        }

        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId,
            });

            logger.info(`Successfully connected to spreadsheet: ${response.data.properties?.title}`);
            return true;
        } catch (error: any) {
            logger.error(`Error testing connection to spreadsheet ${spreadsheetId}: ${error.message}`);
            return false;
        }
    }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();

