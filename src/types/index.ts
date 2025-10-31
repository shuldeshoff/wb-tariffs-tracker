/** Wildberries Tariffs API Response Types */

export interface WBTariff {
    dtNextBox: string;
    dtTillMax: string;
    warehouseName: string;
    boxTypeName: string;
    boxDeliveryAndStorageExpr: string;
    boxDeliveryBase: string;
    boxDeliveryLiter: string;
    boxStorageBase: string;
    boxStorageLiter: string;
}

export interface WBTariffResponse {
    response: {
        data: {
            dtNextBox: string;
            dtTillMax: string;
            warehouseList: Array<{
                warehouseName: string;
                boxDeliveryCoefExpr: string;
                boxStorageCoefExpr: string;
                boxDeliveryBase: string;
                boxDeliveryLiter: string;
                boxStorageBase: string;
                boxStorageLiter: string;
                boxTypeName?: string;
                geoName?: string;
            }>;
        };
    };
}

/** Database Types */

export interface TariffRecord {
    id?: number;
    date: Date;
    warehouse_name: string;
    box_type: string;
    coefficient: number;
    dt_next_box: Date | null;
    dt_till_max: Date | null;
    delivery_base: string;
    delivery_liter: string;
    storage_base: string;
    storage_liter: string;
    raw_data: Record<string, unknown>;
    created_at?: Date;
    updated_at?: Date;
}

/** Google Sheets Types */

export interface SheetRow {
    warehouse_name: string;
    box_type: string;
    coefficient: number;
    date: string;
    dt_next_box: string;
    dt_till_max: string;
}
