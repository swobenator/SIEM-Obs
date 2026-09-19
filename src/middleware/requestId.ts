import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";

export function requestId(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const id = randomUUID();

    req.requestId = id;
    res.setHeader("X-Request-ID", id);

    next();
}