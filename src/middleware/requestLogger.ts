import { NextFunction, Request, Response } from "express";
import { Metrics } from "../metrics.js";
import { logger } from "../logger.js";

export function requestLogger(metrics: Metrics) {
    return (req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();

        res.on("finish", () => {
            const durationMs = Date.now() - start;

            metrics.recordHttpRequest(
                res.statusCode,
                durationMs
            );

            logger.info("HTTP request completed", {
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                durationMs,
            });
        });

        next();
    };
}