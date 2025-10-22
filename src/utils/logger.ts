import { configure, getLogger } from "log4js";
import env from "#config/env/env.js";

configure({
    appenders: {
        console: {
            type: "console",
            layout: {
                type: "pattern",
                pattern: "%[[%d{yyyy-MM-dd hh:mm:ss}] [%p] %c%] - %m",
            },
        },
        file: {
            type: "file",
            filename: "logs/app.log",
            maxLogSize: 10485760,
            backups: 5,
            compress: true,
            layout: {
                type: "pattern",
                pattern: "[%d{yyyy-MM-dd hh:mm:ss}] [%p] %c - %m",
            },
        },
    },
    categories: {
        default: { appenders: ["console", "file"], level: env.LOG_LEVEL || "info" },
    },
});

export const logger = getLogger();

