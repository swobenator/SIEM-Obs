import { NextFunction, Request, Response } from "express";
import { hasValidSession } from "../authSession.js";

export function frontendAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const sessionId = req.cookies?.siem_session;

    if (!sessionId || !hasValidSession(sessionId)) {
        return res.status(401).json({
            error: "Authentication required",
        });
    }

    next();
}