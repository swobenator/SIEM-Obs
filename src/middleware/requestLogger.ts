import { Request, Response, NextFunction } from "express";
import { Metrics } from "../metrics.js";

export function requestLogger(metrics: Metrics) {
    return (req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();

        res.on("finish", () => {
            const durationMs = Date.now() - start;

            metrics.recordHttpRequest(res.statusCode, durationMs);

            console.log(
                `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`
            );
        });

        next();
    };
}