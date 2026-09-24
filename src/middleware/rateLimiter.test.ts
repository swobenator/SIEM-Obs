import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { rateLimiter } from "./rateLimiter.js";
import { requestId } from "./requestId.js";

describe("rateLimiter", () => {
    it("allows requests until the limit is reached", async () => {
        const app = express();

        app.use(
            rateLimiter({
                max: 2,
                windowMs: 60_000,
            })
        );

        app.get("/test", (_req, res) => {
            res.status(200).json({
                status: "ok",
            });
        });

        const first = await request(app).get("/test");
        const second = await request(app).get("/test");

        expect(first.status).toBe(200);
        expect(second.status).toBe(200);

        expect(second.headers["x-ratelimit-limit"]).toBe("2");
        expect(second.headers["x-ratelimit-remaining"]).toBe("0");
    });

    it("returns 429 after the limit is exceeded", async () => {
        const app = express();

        const consoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });

        app.use(requestId);

        app.use(
            rateLimiter({
                max: 2,
                windowMs: 60_000,
            })
        );

        app.get("/test", (_req, res) => {
            res.status(200).json({
                status: "ok",
            });
        });

        await request(app).get("/test");
        await request(app).get("/test");

        const response = await request(app).get("/test");

        expect(response.status).toBe(429);

        expect(consoleWarn).toHaveBeenCalledTimes(1);

        const output = consoleWarn.mock.calls[0][0];
        const record = JSON.parse(output);

        expect(record).toMatchObject({
            level: "WARN",
            message: "Rate limit exceeded",
            event: "rate_limit_exceeded",
        });

        expect(record.requestId).toBe(
            response.headers["x-request-id"]
        );

        consoleWarn.mockRestore();
    });

    it("resets after the time window expires", async () => {
        const app = express();

        app.use(
            rateLimiter({
                max: 1,
                windowMs: 50,
            })
        );

        app.get("/test", (_req, res) => {
            res.status(200).json({
                status: "ok",
            });
        });

        const first = await request(app).get("/test");
        expect(first.status).toBe(200);

        const blocked = await request(app).get("/test");
        expect(blocked.status).toBe(429);

        await new Promise((resolve) => setTimeout(resolve, 150));

        const allowedAgain = await request(app).get("/test");
        expect(allowedAgain.status).toBe(200);
    });

    // it("tracks different client IPs separately", async () => {
    //     const app = express();

    //     app.use(
    //         rateLimiter({
    //             max: 1,
    //             windowMs: 60_000,
    //         })
    //     );

    //     app.get("/test", (_req, res) => {
    //         res.status(200).json({
    //             status: "ok",
    //         });
    //     });

    //     const first = await request(app)
    //         .get("/test")
    //         .set("X-Forwarded-For", "10.0.0.1");

    //     const second = await request(app)
    //         .get("/test")
    //         .set("X-Forwarded-For", "10.0.0.2");

    //     expect(first.status).toBe(200);
    //     expect(second.status).toBe(200);
    // });
});