import { NextFunction, Request, Response } from "express";
import { logger } from "../logger.js";
import { hasValidSession } from "../authSession.js";

export function apiKeyAuth(expectedApiKey: string) {
    return (req: Request, res: Response, next: NextFunction) => {

        const sessionId = req.cookies?.siem_session;

        if (sessionId && hasValidSession(sessionId)) {
            next();
            return;
        }

        const authorization = req.header("authorization");

        if (!authorization) {
            logger.warn("Authentication failed", {
                event: "authentication_failure",
                reason: "missing_authorization_header",
                requestId: req.requestId,
                method: req.method,
                path: req.baseUrl + req.path,
            });

            return res.status(401).json({
                error: "Authentication required",
            });
        }

        const [scheme, token] = authorization.split(" ");

        if (
            scheme !== "Bearer" ||
            !token ||
            token !== expectedApiKey
        ) {
            logger.warn("Authentication failed", {
                event: "authentication_failure",
                reason: "invalid_api_key",
                requestId: req.requestId,
                method: req.method,
                path: req.baseUrl + req.path,
            });

            return res.status(401).json({
                error: "Invalid API key",
            });
        }

        logger.info("Authentication succeeded", {
            event: "authentication_success",
            requestId: req.requestId,
            method: req.method,
            path: req.baseUrl + req.path,
        });

        next();
    };
}