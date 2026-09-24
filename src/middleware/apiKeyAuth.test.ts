import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { apiKeyAuth } from "./apiKeyAuth.js";
import { requestId } from "./requestId.js";

describe("apiKeyAuth", () => {
    function createApp() {
        const app = express();

        app.use(requestId);
        app.use(apiKeyAuth("test-api-key"));

        app.get("/test", (_req, res) => {
            res.status(200).json({
                status: "ok",
            });
        });

        return app;
    }

    it("rejects requests without an authorization header", async () => {
        const response = await request(createApp()).get("/test");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: "Authentication required",
        });
    });

    it("rejects requests with an invalid API key", async () => {
        const response = await request(createApp())
            .get("/test")
            .set("Authorization", "Bearer wrong-key");

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: "Invalid API key",
        });
    });

    it("rejects requests with an invalid authorization scheme", async () => {
        const response = await request(createApp())
            .get("/test")
            .set("Authorization", "Basic test-api-key");

        expect(response.status).toBe(401);
    });

    it("allows requests with the correct API key", async () => {
        const response = await request(createApp())
            .get("/test")
            .set("Authorization", "Bearer test-api-key");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            status: "ok",
        });
    });
    it("logs an authentication failure when authorization is missing", async () => {
        const consoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });

        const response = await request(createApp()).get("/test");

        expect(response.status).toBe(401);
        expect(consoleWarn).toHaveBeenCalledTimes(1);

        const output = consoleWarn.mock.calls[0][0];
        const record = JSON.parse(output);

        expect(record).toMatchObject({
            level: "WARN",
            message: "Authentication failed",
            event: "authentication_failure",
            reason: "missing_authorization_header",
        });

        expect(record.requestId).toBe(
            response.headers["x-request-id"]
        );

        expect(output).not.toContain("test-api-key");

        consoleWarn.mockRestore();
    });
    it("logs an authentication failure without exposing the API key", async () => {
        const consoleWarn = vi
            .spyOn(console, "warn")
            .mockImplementation(() => { });

        const response = await request(createApp())
            .get("/test")
            .set(
                "Authorization",
                "Bearer super-secret-api-key"
            );

        expect(response.status).toBe(401);
        expect(consoleWarn).toHaveBeenCalledTimes(1);

        const output = consoleWarn.mock.calls[0][0];
        const record = JSON.parse(output);

        expect(record).toMatchObject({
            level: "WARN",
            message: "Authentication failed",
            event: "authentication_failure",
            reason: "invalid_api_key",
        });

        expect(record.requestId).toBe(
            response.headers["x-request-id"]
        );

        expect(output).not.toContain(
            "super-secret-api-key"
        );

        consoleWarn.mockRestore();
    });
    it("logs a successful authentication", async () => {
        const consoleInfo = vi
            .spyOn(console, "log")
            .mockImplementation(() => { });

        const response = await request(createApp())
            .get("/test")
            .set(
                "Authorization",
                "Bearer test-api-key"
            );

        expect(response.status).toBe(200);
        expect(consoleInfo).toHaveBeenCalledTimes(1);

        const output = consoleInfo.mock.calls[0][0];
        const record = JSON.parse(output);

        expect(record).toMatchObject({
            level: "INFO",
            message: "Authentication succeeded",
            event: "authentication_success",
        });

        expect(record.requestId).toBe(
            response.headers["x-request-id"]
        );

        expect(output).not.toContain("test-api-key");

        consoleInfo.mockRestore();
    });
});