import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { Metrics } from "../metrics.js";
import { requestLogger } from "./requestLogger.js";

describe("requestLogger", () => {
    it("records a successful HTTP request", async () => {
        const testMetrics = new Metrics();

        const testApp = express();

        testApp.use(requestLogger(testMetrics));

        testApp.get("/test", (_req, res) => {
            res.status(200).json({ status: "ok" });
        });

        const response = await request(testApp).get("/test");

        expect(response.status).toBe(200);

        expect(testMetrics.getSnapshot()).toMatchObject({
            httpRequests: 1,
            http4xx: 0,
            http5xx: 0,
        });
    });

    it("records a client error", async () => {
        const testMetrics = new Metrics();

        const testApp = express();

        testApp.use(requestLogger(testMetrics));

        testApp.get("/test", (_req, res) => {
            res.status(400).json({
                error: "Bad request",
            });
        });

        const response = await request(testApp).get("/test");

        expect(response.status).toBe(400);

        expect(testMetrics.getSnapshot()).toMatchObject({
            httpRequests: 1,
            http4xx: 1,
            http5xx: 0,
        });
    });

    it("records a server error", async () => {
        const testMetrics = new Metrics();

        const testApp = express();

        testApp.use(requestLogger(testMetrics));

        testApp.get("/test", (_req, res) => {
            res.status(500).json({
                error: "Internal server error",
            });
        });

        const response = await request(testApp).get("/test");

        expect(response.status).toBe(500);

        expect(testMetrics.getSnapshot()).toMatchObject({
            httpRequests: 1,
            http4xx: 0,
            http5xx: 1,
        });
    });

    it("records request duration", async () => {
        const testMetrics = new Metrics();

        const testApp = express();

        testApp.use(requestLogger(testMetrics));

        testApp.get("/test", async (_req, res) => {
            await new Promise((resolve) => setTimeout(resolve, 10));

            res.status(200).json({
                status: "ok",
            });
        });

        const response = await request(testApp).get("/test");

        expect(response.status).toBe(200);

        expect(
            testMetrics.getSnapshot().httpRequestDurationMs
        ).toBeGreaterThanOrEqual(10);
    });
});