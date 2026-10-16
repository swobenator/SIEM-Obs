// Assigns each HTTP request a unique ID for correlating logs and error reports.
import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";

export function requestId(
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Return the same ID in a response header so a request can be traced from the client.
    const id = randomUUID();

    req.requestId = id;
    res.setHeader("X-Request-ID", id);

    next();
}