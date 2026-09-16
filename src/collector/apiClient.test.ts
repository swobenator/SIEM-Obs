import { describe, expect, it, vi } from "vitest";
import type { Event } from "../schemas/event.js";
import { sendEvents } from "./apiClient.js";

describe("sendEvents", () => {
    it("sends the configured API key", async () => {
        const fetchMock = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(
                new Response(
                    JSON.stringify({
                        inserted: 1,
                    }),
                    {
                        status: 201,
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                )
            );

        const events: Event[] = [
            {
                timestamp: new Date("2026-08-18T10:00:00Z"),
                level: "INFO",
                source: "application",
                message: "Test event",
                metadata: {},
            },
        ];

        await sendEvents(events);

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const [, options] = fetchMock.mock.calls[0];

        expect(options?.headers).toEqual({
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.API_KEY}`,
        });

        fetchMock.mockRestore();
    });
});