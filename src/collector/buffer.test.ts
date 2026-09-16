import { describe, expect, it, vi } from "vitest";
import { EventBuffer } from "./buffer.js";
import type { Event } from "../schemas/event.js";
import { Metrics } from "../metrics.js";

function createEvent(message: string): Event {
    return {
        timestamp: new Date("2026-08-18T10:00:00Z"),
        level: "INFO",
        source: "application",
        message,
        metadata: {},
    };
}

describe("EventBuffer", () => {
    it("flushes events when stopped", async () => {
        const onFlush = vi.fn().mockResolvedValue(undefined);

        const buffer = new EventBuffer(onFlush);

        const events = [
            createEvent("First event"),
            createEvent("Second event"),
        ];

        buffer.add(events);

        await buffer.stop();

        expect(onFlush).toHaveBeenCalledTimes(1);
        expect(onFlush).toHaveBeenCalledWith(events);
    });
    it("flushes automatically when the batch size is reached", async () => {
        const onFlush = vi.fn().mockResolvedValue(undefined);

        const buffer = new EventBuffer(onFlush);

        const events = Array.from(
            { length: 100 },
            (_, index) => createEvent(`Event ${index + 1}`)
        );

        buffer.add(events);

        // flush() is async and is triggered without being awaited by add(),
        // so give it a moment to complete.
        await vi.waitFor(() => {
            expect(onFlush).toHaveBeenCalledTimes(1);
        });

        expect(onFlush).toHaveBeenCalledWith(events);

        await buffer.stop();
    });
    it("records metrics when a batch is successfully flushed", async () => {
        const metrics = new Metrics();

        const buffer = new EventBuffer(
            async () => { },
            {
                onSuccess: (eventCount) => {
                    metrics.recordEventsProcessed(eventCount);
                    metrics.recordBatchProcessed();
                },
            }
        );

        const events = [
            createEvent("Event 1"),
        ];

        buffer.add(events);

        await buffer.stop();

        expect(metrics.getSnapshot()).toMatchObject({
            eventsProcessed: 1,
            batchesProcessed: 1,
        });
    });
    it("records a flush failure when flushing ultimately fails", async () => {
        const metrics = new Metrics();

        let attempts = 0;

        const buffer = new EventBuffer(
            async () => {
                attempts += 1;
                throw new Error("Flush failed");
            },
            {
                onFailure: () => {
                    metrics.recordFlushFailure();
                },
            },
            undefined,
            0
        );

        buffer.add([
            createEvent("Event 1"),
        ]);

        await buffer.stop();

        expect(attempts).toBe(1);

        expect(metrics.getSnapshot()).toMatchObject({
            flushFailures: 1,
        });
    }, 30000);
    it("records a retry when a flush is retried", async () => {
        const metrics = new Metrics();

        let attempts = 0;

        const buffer = new EventBuffer(
            async () => {
                attempts += 1;

                if (attempts === 1) {
                    throw new Error("Temporary failure");
                }
            },
            {
                onRetry: () => {
                    metrics.recordRetry();
                },
            }
        );

        buffer.add([
            createEvent("Event 1"),
        ]);

        await buffer.stop();

        expect(attempts).toBe(2);

        expect(metrics.getSnapshot()).toMatchObject({
            retries: 1,
            flushFailures: 0,
        });
    }, 15000);
});