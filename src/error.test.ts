import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { AppError, errorHandler } from "./error.js";

describe("error handling", () => {
    it("returns the status code and message for an AppError", async () => {
        const testApp = express();

        testApp.get("/test", () => {
            throw new AppError(400, "Something went wrong");
        });

        testApp.use(errorHandler);

        const response = await request(testApp).get("/test");

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: "Something went wrong",
        });
    });

    it("returns a generic 500 response for unexpected errors", async () => {
        const testApp = express();

        testApp.get("/test", () => {
            throw new Error("Database password leaked");
        });

        testApp.use(errorHandler);

        const response = await request(testApp).get("/test");

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            error: "Internal server error",
        });
    });
});