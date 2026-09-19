import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger.js";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("logger", () => {
    it("writes structured JSON for info logs", () => {
        const consoleLog = vi
            .spyOn(console, "log")
            .mockImplementation(() => {});

        logger.info("Application started", {
            port: 3000,
        });

        expect(consoleLog).toHaveBeenCalledTimes(1);

        const output = consoleLog.mock.calls[0][0];

        const record = JSON.parse(output);

        expect(record).toMatchObject({
            level: "INFO",
            message: "Application started",
            port: 3000,
        });

        expect(record.timestamp).toEqual(expect.any(String));
    });

    it("writes warnings to console.warn", () => {
        const consoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});

        logger.warn("Retrying request", {
            attempt: 2,
        });

        expect(consoleWarn).toHaveBeenCalledTimes(1);

        const record = JSON.parse(
            consoleWarn.mock.calls[0][0]
        );

        expect(record).toMatchObject({
            level: "WARN",
            message: "Retrying request",
            attempt: 2,
        });
    });

    it("writes errors to console.error", () => {
        const consoleError = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

        logger.error("Database failure", {
            operation: "query",
        });

        expect(consoleError).toHaveBeenCalledTimes(1);

        const record = JSON.parse(
            consoleError.mock.calls[0][0]
        );

        expect(record).toMatchObject({
            level: "ERROR",
            message: "Database failure",
            operation: "query",
        });
    });
});