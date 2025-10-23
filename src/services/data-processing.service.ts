import { wildberriesService } from "#services/wildberries.service.js";
import { tariffsRepository } from "#repositories/tariffs.repository.js";
import { WBTariffResponse, TariffRecord } from "#types/index.js";
import { logger } from "#utils/logger.js";
import { metricsService } from "#services/metrics.service.js";

/**
 * Main data processing service
 * Fetches data from WB API and saves to database
 */
export class DataProcessingService {
    /**
     * Fetch tariffs from WB and save to database
     */
    async fetchAndSaveTariffs(): Promise<boolean> {
        try {
            logger.info("Starting tariff data fetch and save process...");
            metricsService.setActiveTasks("fetch_tariffs", 1);

            // Fetch data from WB API
            const data = await wildberriesService.fetchTariffs();

            if (!data) {
                logger.error("Failed to fetch tariffs from WB API");
                metricsService.setActiveTasks("fetch_tariffs", 0);
                return false;
            }

            // Transform API response to database records
            const tariffs = this.transformApiResponse(data);

            if (tariffs.length === 0) {
                logger.warn("No tariff data to save");
                metricsService.setActiveTasks("fetch_tariffs", 0);
                return false;
            }

            // Save to database
            const endTimer = metricsService.measureDbOperation("upsert_tariffs");
            await tariffsRepository.upsertTariffs(tariffs);
            endTimer();

            metricsService.recordTariffsProcessed(tariffs.length);
            metricsService.setActiveTasks("fetch_tariffs", 0);
            
            logger.info(`Successfully processed and saved ${tariffs.length} tariff records`);
            return true;
        } catch (error) {
            logger.error(`Error in fetchAndSaveTariffs: ${error}`);
            metricsService.setActiveTasks("fetch_tariffs", 0);
            return false;
        }
    }

    /**
     * Transform WB API response to database records
     */
    private transformApiResponse(data: WBTariffResponse): Omit<TariffRecord, "id" | "created_at" | "updated_at">[] {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Set to start of day

        const response = data.response?.data;
        if (!response || !response.warehouseList) {
            logger.error("Invalid response structure");
            return [];
        }

        const dtNextBox = response.dtNextBox ? new Date(response.dtNextBox) : null;
        const dtTillMax = response.dtTillMax ? new Date(response.dtTillMax) : null;

        const tariffs: Omit<TariffRecord, "id" | "created_at" | "updated_at">[] = response.warehouseList.map((warehouse) => {
            // Calculate coefficient from delivery and storage expressions
            // Using delivery coefficient as the main coefficient (as it's usually higher and more significant)
            const deliveryCoef = wildberriesService.parseCoefficient(warehouse.boxDeliveryCoefExpr);
            const storageCoef = wildberriesService.parseCoefficient(warehouse.boxStorageCoefExpr);
            const coefficient = Math.max(deliveryCoef, storageCoef);

            return {
                date: currentDate,
                warehouse_name: warehouse.warehouseName,
                box_type: warehouse.boxTypeName || 'standard',
                coefficient,
                dt_next_box: dtNextBox,
                dt_till_max: dtTillMax,
                delivery_base: this.parseNumber(warehouse.boxDeliveryBase),
                delivery_liter: this.parseNumber(warehouse.boxDeliveryLiter),
                storage_base: this.parseNumber(warehouse.boxStorageBase),
                storage_liter: this.parseNumber(warehouse.boxStorageLiter),
                raw_data: warehouse,
            };
        });

        logger.info(`Transformed ${tariffs.length} warehouse records`);
        return tariffs;
    }

    /**
     * Parse number from string (handles both comma and dot as decimal separator)
     */
    private parseNumber(value: string | null | undefined): string {
        if (!value || value === '-' || value.trim() === '') return "0";
        // Replace comma with dot for PostgreSQL compatibility
        // Remove any spaces
        return value.replace(/,/g, '.').trim();
    }
}

// Export singleton instance
export const dataProcessingService = new DataProcessingService();

