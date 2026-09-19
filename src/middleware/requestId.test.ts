import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requestId } from "./requestId.js";

describe("requestId", () => {
    it("generates a request ID and attaches it to the request", () => {
        const req = {} as Request;

        const setHeader = vi.fn();

        const res = {
            setHeader,
        } as unknown as Response;

        const next = vi.fn();

        requestId(req, res, next);

        expect(req.requestId).toEqual(expect.any(String));
        expect(req.requestId).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
        );
        expect(setHeader).toHaveBeenCalledWith(
            "X-Request-ID",
            req.requestId
        );
        expect(next).toHaveBeenCalledTimes(1);
    });

    it("generates a different ID for each request", () => {
        const createRequest = () => {
            const req = {} as Request;
            const res = {
                setHeader: vi.fn(),
            } as unknown as Response;
            const next = vi.fn();

            requestId(req, res, next);

            return req.requestId;
        };

        const firstId = createRequest();
        const secondId = createRequest();

        expect(firstId).not.toBe(secondId);
    });
});