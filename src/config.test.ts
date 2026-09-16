import { describe, expect, it } from "vitest";
import { config } from "./config.js";

describe("config", () => {
    it("loads configuration from environment variables", () => {
        expect(config.apiUrl).toBe(process.env.API_URL);
        expect(config.logFilePath).toBe(process.env.LOG_FILE_PATH);
        expect(config.batchSize).toBe(Number(process.env.BATCH_SIZE));
        expect(config.flushIntervalMs).toBe(
            Number(process.env.FLUSH_INTERVAL_MS)
        );
        expect(config.maxRetries).toBe(Number(process.env.MAX_RETRIES));

        expect(config.port).toBe(Number(process.env.PORT));
        expect(config.dbHost).toBe(process.env.DB_HOST);
        expect(config.dbPort).toBe(Number(process.env.DB_PORT));
        expect(config.dbUser).toBe(process.env.DB_USER);
        expect(config.dbPassword).toBe(process.env.DB_PASSWORD);
        expect(config.dbName).toBe(process.env.DB_NAME);
    });
});