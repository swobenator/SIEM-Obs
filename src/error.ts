// Centralises application errors and keeps unexpected internal details out of API responses.
import express from "express";
import { logger } from "./logger.js";

export class AppError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}

export function errorHandler(
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
) {
    logger.error("Unhandled application error", {
        requestId: _req.requestId,
        error:
            error instanceof Error
                ? error.message
                : String(error),
    });
    // Expected application errors may expose their chosen status and safe message.
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            error: error.message,
        });
    }

    // Keep unexpected exception details in server logs, not in the client response.
    return res.status(500).json({
        error: "Internal server error",
    });
}