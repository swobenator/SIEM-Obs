import { describe, expect, it } from "vitest";
import { eventSchema } from "./event.js";

describe("eventSchema", () => {
    it("accepts a valid event", () => {
        const result = eventSchema.safeParse({
            timestamp: "2026-08-21T10:00:00Z",
            level: "INFO",
            source: "application",
            message: "Application started",
            metadata: {
                service: "api",
                environment: "production",
            },
        });

        expect(result.success).toBe(true);
    });

    it("coerces a valid timestamp into a Date", () => {
        const result = eventSchema.safeParse({
            timestamp: "2026-08-21T10:00:00Z",
            level: "INFO",
            source: "application",
            message: "Application started",
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.timestamp).toBeInstanceOf(Date);
        }
    });

    it("defaults metadata to an empty object", () => {
        const result = eventSchema.safeParse({
            timestamp: "2026-08-21T10:00:00Z",
            level: "INFO",
            source: "application",
            message: "Application started",
        });

        expect(result.success).toBe(true);

        if (result.success) {
            expect(result.data.metadata).toEqual({});
        }
    });

    it("rejects an invalid log level", () => {
        const result = eventSchema.safeParse({
            timestamp: "2026-08-21T10:00:00Z",
            level: "INVALID",
            source: "application",
            message: "Application started",
        });

        expect(result.success).toBe(false);
    });

    it("rejects an empty source", () => {
        const result = eventSchema.safeParse({
            timestamp: "2026-08-21T10:00:00Z",
            level: "INFO",
            source: "",
            message: "Application started",
        });

        expect(result.success).toBe(false);
    });

    it("rejects a source longer than 100 characters", () => {
        const result = eventSchema.safeParse({
            timestamp: "2026-08-21T10:00:00Z",
            level: "INFO",
            source: "a".repeat(101),
            message: "Application started",
        });

        expect(result.success).toBe(false);
    });

    it("rejects an empty message", () => {
        const result = eventSchema.safeParse({
            timestamp: "2026-08-21T10:00:00Z",
            level: "INFO",
            source: "application",
            message: "",
        });

        expect(result.success).toBe(false);
    });

    it("rejects a message longer than 5000 characters", () => {
        const result = eventSchema.safeParse({
            timestamp: "2026-08-21T10:00:00Z",
            level: "INFO",
            source: "application",
            message: "a".repeat(5001),
        });

        expect(result.success).toBe(false);
    });

    it("rejects an invalid timestamp", () => {
        const result = eventSchema.safeParse({
            timestamp: "not-a-date",
            level: "INFO",
            source: "application",
            message: "Application started",
        });

        expect(result.success).toBe(false);
    });
});