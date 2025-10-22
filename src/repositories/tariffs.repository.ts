import { Knex } from "knex";
import knex from "#postgres/knex.js";
import { TariffRecord } from "#types/index.js";
import { logger } from "#utils/logger.js";

/**
 * Tariffs Repository
 * Handles database operations for tariffs table
 */
export class TariffsRepository {
    private db: Knex;

    constructor(database: Knex = knex) {
        this.db = database;
    }

    /**
     * Upsert tariffs for a specific date
     * Updates existing records or inserts new ones
     */
    async upsertTariffs(tariffs: Omit<TariffRecord, "id" | "created_at" | "updated_at">[]): Promise<void> {
        try {
            logger.info(`Upserting ${tariffs.length} tariff records...`);

            for (const tariff of tariffs) {
                await this.db("tariffs")
                    .insert(tariff)
                    .onConflict(["date", "warehouse_name", "box_type"])
                    .merge({
                        coefficient: tariff.coefficient,
                        dt_next_box: tariff.dt_next_box,
                        dt_till_max: tariff.dt_till_max,
                        delivery_base: tariff.delivery_base,
                        delivery_liter: tariff.delivery_liter,
                        storage_base: tariff.storage_base,
                        storage_liter: tariff.storage_liter,
                        raw_data: tariff.raw_data,
                        updated_at: this.db.fn.now(),
                    });
            }

            logger.info(`Successfully upserted ${tariffs.length} tariff records`);
        } catch (error) {
            logger.error(`Error upserting tariffs: ${error}`);
            throw error;
        }
    }

    /**
     * Get tariffs for a specific date, sorted by coefficient (ascending)
     */
    async getTariffsByDate(date: Date): Promise<TariffRecord[]> {
        try {
            const tariffs = await this.db<TariffRecord>("tariffs")
                .where("date", date)
                .orderBy("coefficient", "asc")
                .select("*");

            logger.info(`Retrieved ${tariffs.length} tariffs for date ${date.toISOString()}`);
            return tariffs;
        } catch (error) {
            logger.error(`Error retrieving tariffs by date: ${error}`);
            throw error;
        }
    }

    /**
     * Get latest tariffs (most recent date), sorted by coefficient (ascending)
     */
    async getLatestTariffs(): Promise<TariffRecord[]> {
        try {
            const latestDate = await this.db("tariffs").max("date as max_date").first();

            if (!latestDate || !latestDate.max_date) {
                logger.info("No tariffs found in database");
                return [];
            }

            const tariffs = await this.db<TariffRecord>("tariffs")
                .where("date", latestDate.max_date)
                .orderBy("coefficient", "asc")
                .select("*");

            logger.info(`Retrieved ${tariffs.length} latest tariffs for date ${latestDate.max_date}`);
            return tariffs;
        } catch (error) {
            logger.error(`Error retrieving latest tariffs: ${error}`);
            throw error;
        }
    }

    /**
     * Get all dates with tariff data
     */
    async getAllDates(): Promise<Date[]> {
        try {
            const dates = await this.db("tariffs").distinct("date").orderBy("date", "desc");

            return dates.map((row) => new Date(row.date));
        } catch (error) {
            logger.error(`Error retrieving all dates: ${error}`);
            throw error;
        }
    }

    /**
     * Delete tariffs older than specified days
     */
    async deleteOldTariffs(daysToKeep: number = 30): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const deleted = await this.db("tariffs").where("date", "<", cutoffDate).del();

            logger.info(`Deleted ${deleted} old tariff records (older than ${daysToKeep} days)`);
            return deleted;
        } catch (error) {
            logger.error(`Error deleting old tariffs: ${error}`);
            throw error;
        }
    }
}

// Export singleton instance
export const tariffsRepository = new TariffsRepository();

