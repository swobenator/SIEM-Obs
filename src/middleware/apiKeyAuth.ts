import { NextFunction, Request, Response } from "express";

export function apiKeyAuth(expectedApiKey: string) {
    return (_req: Request, res: Response, next: NextFunction) => {
        const authorization = _req.header("authorization");

        if (!authorization) {
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
            return res.status(401).json({
                error: "Invalid API key",
            });
        }

        next();
    };
}