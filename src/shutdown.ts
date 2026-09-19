import type { Server } from "node:http";
import type { Pool } from "pg";
import { logger } from "./logger.js";

export function createShutdownHandler(
    server: Server,
    pool: Pick<Pool, "end">
) {
    let isShuttingDown = false;

    return async function shutdown(signal: string) {
        if (isShuttingDown) {
            return;
        }

        isShuttingDown = true;

        logger.info("Shutdown requested", {
            signal,
        });

        await new Promise<void>((resolve) => {
            server.close(() => {
                resolve();
            });
        });

        await pool.end();

        logger.info("Database pool closed");
    };
}