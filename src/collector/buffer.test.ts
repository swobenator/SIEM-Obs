import { describe, expect, it, vi } from "vitest";
import { EventBuffer } from "./buffer.js";
import type { Event } from "../schemas/event.js";

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
});