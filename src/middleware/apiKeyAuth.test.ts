import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { apiKeyAuth } from "./apiKeyAuth.js";

describe("apiKeyAuth", () => {
    function createApp() {
        const app = express();

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
});