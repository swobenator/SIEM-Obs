import { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
    max: number;
    windowMs: number;
};

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

export function rateLimiter({ max, windowMs }: RateLimitOptions) {
    const requests = new Map<string, RateLimitEntry>();

    return (req: Request, res: Response, next: NextFunction) => {
        const now = Date.now();
        const key = req.ip ?? "unknown";

        let entry = requests.get(key);

        if (!entry || entry.resetAt <= now) {
            entry = {
                count: 0,
                resetAt: now + windowMs,
            };

            requests.set(key, entry);
        }

        entry.count += 1;

        const remaining = Math.max(0, max - entry.count);
        const resetSeconds = Math.ceil(entry.resetAt / 1000);

        res.setHeader("X-RateLimit-Limit", max);
        res.setHeader("X-RateLimit-Remaining", remaining);
        res.setHeader("X-RateLimit-Reset", resetSeconds);

        if (entry.count > max) {
            const retryAfter = Math.max(
                1,
                Math.ceil((entry.resetAt - now) / 1000)
            );

            res.setHeader("Retry-After", retryAfter);

            return res.status(429).json({
                error: "Rate limit exceeded",
            });
        }

        next();
    };
}