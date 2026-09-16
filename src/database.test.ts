import { afterAll, describe, expect, it } from "vitest";
import { pool } from "./database.js";

describe("database constraints", () => {
    afterAll(async () => {
        await pool.end();
    });

    it("rejects an invalid log level", async () => {
        await expect(
            pool.query(
                `
                    INSERT INTO events (source, level, message)
                    VALUES ($1, $2, $3)
                `,
                ["test", "INVALID", "test message"]
            )
        ).rejects.toThrow();
    });

    it("rejects an empty source", async () => {
        await expect(
            pool.query(
                `
                    INSERT INTO events (source, level, message)
                    VALUES ($1, $2, $3)
                `,
                ["", "INFO", "test message"]
            )
        ).rejects.toThrow();
    });

    it("rejects a source longer than 100 characters", async () => {
        await expect(
            pool.query(
                `
                    INSERT INTO events (source, level, message)
                    VALUES ($1, $2, $3)
                `,
                ["a".repeat(101), "INFO", "test message"]
            )
        ).rejects.toThrow();
    });

    it("rejects an empty message", async () => {
        await expect(
            pool.query(
                `
                    INSERT INTO events (source, level, message)
                    VALUES ($1, $2, $3)
                `,
                ["test", "INFO", ""]
            )
        ).rejects.toThrow();
    });

    it("rejects a message longer than 5000 characters", async () => {
        await expect(
            pool.query(
                `
                    INSERT INTO events (source, level, message)
                    VALUES ($1, $2, $3)
                `,
                ["test", "INFO", "a".repeat(5001)]
            )
        ).rejects.toThrow();
    });
});