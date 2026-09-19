import { app } from "./server.js";
import { config } from "./config.js";
import { pool } from "./database.js";
import { createShutdownHandler } from "./shutdown.js";
import type { Server } from "node:http";
import { logger } from "./logger.js";

const server: Server = app.listen(config.port, () => {
    logger.info("Server started", {
        port: config.port,
    });
});

const shutdown = createShutdownHandler(server, pool);

process.on("SIGINT", () => {
    void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
});