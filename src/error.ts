import express from "express";

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
    console.error(error);

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            error: error.message,
        });
    }

    return res.status(500).json({
        error: "Internal server error",
    });
}