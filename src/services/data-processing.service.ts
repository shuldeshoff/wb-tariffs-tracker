import { wildberriesService } from "#services/wildberries.service.js";
import { tariffsRepository } from "#repositories/tariffs.repository.js";
import { WBTariffResponse, TariffRecord } from "#types/index.js";
import { logger } from "#utils/logger.js";

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

            // Fetch data from WB API
            const data = await wildberriesService.fetchTariffs();

            if (!data) {
                logger.error("Failed to fetch tariffs from WB API");
                return false;
            }

            // Transform API response to database records
            const tariffs = this.transformApiResponse(data);

            if (tariffs.length === 0) {
                logger.warn("No tariff data to save");
                return false;
            }

            // Save to database
            await tariffsRepository.upsertTariffs(tariffs);

            logger.info(`Successfully processed and saved ${tariffs.length} tariff records`);
            return true;
        } catch (error) {
            logger.error(`Error in fetchAndSaveTariffs: ${error}`);
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
            const coefficient = wildberriesService.parseCoefficient(warehouse.boxDeliveryAndStorageExpr);

            return {
                date: currentDate,
                warehouse_name: warehouse.warehouseName,
                box_type: warehouse.boxTypeName,
                coefficient,
                dt_next_box: dtNextBox,
                dt_till_max: dtTillMax,
                delivery_base: warehouse.boxDeliveryBase || "0",
                delivery_liter: warehouse.boxDeliveryLiter || "0",
                storage_base: warehouse.boxStorageBase || "0",
                storage_liter: warehouse.boxStorageLiter || "0",
                raw_data: warehouse,
            };
        });

        logger.info(`Transformed ${tariffs.length} warehouse records`);
        return tariffs;
    }
}

// Export singleton instance
export const dataProcessingService = new DataProcessingService();

