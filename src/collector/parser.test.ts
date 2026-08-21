import { describe, expect, it } from "vitest";
import { parseLogLine } from "./parser.js";

describe("parseLogLine", () => {
    it("parses a valid log line", () => {
        const result = parseLogLine(
            "2026-08-18T10:00:00Z INFO application User logged in"
        );

        expect(result).not.toBeNull();

        expect(result).toMatchObject({
            level: "INFO",
            source: "application",
            message: "User logged in",
            metadata: {},
        });

        expect(result?.timestamp).toEqual(
            new Date("2026-08-18T10:00:00Z")
        );
    });

    it("returns null for an invalid log line", () => {
        const result = parseLogLine("this is not a valid log line");

        expect(result).toBeNull();
    });

    it("removes a trailing carriage return", () => {
        const result = parseLogLine(
            "2026-08-18T10:00:00Z INFO application User logged in\r"
        );

        expect(result?.message).toBe("User logged in");
    });

    it("parses all supported log levels", () => {
        const levels = [
            "DEBUG",
            "INFO",
            "WARN",
            "ERROR",
            "CRITICAL",
        ] as const;

        for (const level of levels) {
            const result = parseLogLine(
                `2026-08-18T10:00:00Z ${level} application Test message`
            );

            expect(result).not.toBeNull();
            expect(result?.level).toBe(level);
        }
    });
    it("preserves messages containing spaces", () => {
        const result = parseLogLine(
            "2026-08-18T10:00:00Z ERROR application Database connection failed unexpectedly"
        );

        expect(result?.message).toBe(
            "Database connection failed unexpectedly"
        );
    });
});