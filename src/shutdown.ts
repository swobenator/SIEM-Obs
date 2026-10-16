// Coordinates graceful shutdown so active HTTP work can finish before PostgreSQL closes.
import type { Server } from "node:http";
import type { Pool } from "pg";
import { logger } from "./logger.js";

export function createShutdownHandler(
    server: Server,
    pool: Pick<Pool, "end">
) {
    let isShuttingDown = false;

    return async function shutdown(signal: string) {
        // Signals can overlap; only run the shutdown sequence once.
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

        // Close database connections only after the HTTP server has stopped accepting work.
        await pool.end();

        logger.info("Database pool closed");
    };
}