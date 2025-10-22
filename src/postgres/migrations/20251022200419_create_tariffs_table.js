/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async (knex) => {
    await knex.schema.createTable("tariffs", (table) => {
        table.increments("id").primary();
        table.date("date").notNullable().comment("Date of tariff data");
        table.string("warehouse_name", 255).notNullable().comment("Warehouse name");
        table.string("box_type", 100).notNullable().comment("Box type name");
        table.decimal("coefficient", 10, 2).notNullable().comment("Tariff coefficient");
        table.timestamp("dt_next_box").nullable().comment("Date of next box");
        table.timestamp("dt_till_max").nullable().comment("Date till max");
        table.string("delivery_base").notNullable().comment("Base delivery tariff");
        table.string("delivery_liter").notNullable().comment("Liter delivery tariff");
        table.string("storage_base").notNullable().comment("Base storage tariff");
        table.string("storage_liter").notNullable().comment("Liter storage tariff");
        table.jsonb("raw_data").notNullable().comment("Raw API response");
        table.timestamps(true, true);
        
        // Unique constraint для предотвращения дубликатов за один день
        table.unique(["date", "warehouse_name", "box_type"]);
        
        // Indexes для оптимизации запросов
        table.index("date");
        table.index("coefficient");
        table.index(["date", "coefficient"]);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async (knex) => {
    await knex.schema.dropTableIfExists("tariffs");
};
