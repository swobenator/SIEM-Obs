import type { Server } from "node:http";
import type { Pool } from "pg";

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

        console.log(`Received ${signal}. Shutting down...`);

        await new Promise<void>((resolve) => {
            server.close(() => {
                resolve();
            });
        });

        await pool.end();

        console.log("Database pool closed.");
    };
}