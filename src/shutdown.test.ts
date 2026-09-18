import { describe, expect, it, vi } from "vitest";
import { createShutdownHandler } from "./shutdown.js";

describe("createShutdownHandler", () => {
    it("closes the HTTP server and database pool", async () => {
        const server = {
            close: vi.fn((callback: () => void) => {
                callback();
                return server;
            }),
        };

        const pool = {
            end: vi.fn().mockResolvedValue(undefined),
        };

        const shutdown = createShutdownHandler(
            server as any,
            pool
        );

        await shutdown("SIGTERM");

        expect(server.close).toHaveBeenCalledTimes(1);
        expect(pool.end).toHaveBeenCalledTimes(1);
    });

    it("only shuts down once", async () => {
        const server = {
            close: vi.fn((callback: () => void) => {
                callback();
                return server;
            }),
        };

        const pool = {
            end: vi.fn().mockResolvedValue(undefined),
        };

        const shutdown = createShutdownHandler(
            server as any,
            pool
        );

        await shutdown("SIGTERM");
        await shutdown("SIGINT");

        expect(server.close).toHaveBeenCalledTimes(1);
        expect(pool.end).toHaveBeenCalledTimes(1);
    });
});