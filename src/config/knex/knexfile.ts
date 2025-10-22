import env from "#config/env/env.js";
import { Knex } from "knex";
import { z } from "zod";

const connectionSchema = z.object({
    host: z.string(),
    port: z.number(),
    database: z.string(),
    user: z.string(),
    password: z.string(),
});

const NODE_ENV = env.NODE_ENV ?? "development";

const knegConfigs: Record<typeof NODE_ENV, Knex.Config> = {
    development: {
        client: "pg",
        connection: () =>
            connectionSchema.parse({
                host: env.POSTGRES_HOST ?? "localhost",
                port: env.POSTGRES_PORT ?? 5432,
                database: env.POSTGRES_DB ?? "postgres",
                user: env.POSTGRES_USER ?? "postgres",
                password: env.POSTGRES_PASSWORD ?? "postgres",
            }),
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            stub: 'src/config/knex/migration.stub.js',
            directory: "./src/postgres/migrations",
            tableName: "migrations",
            extension: "ts",
        },
        seeds: {
            stub: 'src/config/knex/seed.stub.js',
            directory: "./src/postgres/seeds",
            extension: "js",
        },
    },
    production: {
        client: "pg",
        connection: () =>
            connectionSchema.parse({
                host: env.POSTGRES_HOST,
                port: env.POSTGRES_PORT,
                database: env.POSTGRES_DB,
                user: env.POSTGRES_USER,
                password: env.POSTGRES_PASSWORD,
            }),
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            stub: 'dist/config/knex/migration.stub.js',
            directory: "./dist/postgres/migrations",
            tableName: "migrations",
            extension: "js",
        },
        seeds: {
            stub: 'src/config/knex/seed.stub.js',
            directory: "./dist/postgres/seeds",
            extension: "js",
        },
    },
};

export default knegConfigs[NODE_ENV];
