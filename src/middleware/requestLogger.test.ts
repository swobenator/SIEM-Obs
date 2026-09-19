import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { Metrics } from "../metrics.js";
import { requestLogger } from "./requestLogger.js";
import { requestId } from "./requestId.js";

describe("requestLogger", () => {
    it("records a successful HTTP request", async () => {
        const testMetrics = new Metrics();

        const testApp = express();

        testApp.use(requestId);
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

        testApp.use(requestId);
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

        testApp.use(requestId);
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

        testApp.use(requestId);
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
    it("writes a structured HTTP log without the authorization header", async () => {
        const testMetrics = new Metrics();

        const consoleLog = vi
            .spyOn(console, "log")
            .mockImplementation(() => { });

        const testApp = express();

        testApp.use(requestLogger(testMetrics));

        testApp.get("/test", (_req, res) => {
            res.status(200).json({
                status: "ok",
            });
        });

        const response = await request(testApp)
            .get("/test?token=secret")
            .set(
                "Authorization",
                "Bearer super-secret-api-key"
            );

        expect(response.status).toBe(200);

        expect(consoleLog).toHaveBeenCalledTimes(1);

        const output = consoleLog.mock.calls[0][0];
        const record = JSON.parse(output);

        expect(record).toMatchObject({
            level: "INFO",
            message: "HTTP request completed",
            method: "GET",
            path: "/test",
            statusCode: 200,
        });
        expect(record.requestId).toEqual(
            response.headers["x-request-id"]
        );
        expect(record.path).not.toContain("token");
        expect(output).not.toContain("super-secret-api-key");
    });
});