import express from "express";
import { pool } from "./database.js"
import { eventSchema } from "./schemas/event.js"
import { querySchema } from "./schemas/query.js"
import { decodeCursor, encodeCursor } from "./schemas/cursor.js"
import { eventBatchSchema } from "./schemas/batch.js"
import { metrics } from "./metrics.js";
import { errorHandler } from "./error.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { config } from "./config.js";
import { apiKeyAuth } from "./middleware/apiKeyAuth.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

export const app = express();

app.use(express.json({ limit: "1mb" }));

app.use(requestLogger(metrics));

const apiRateLimiter = rateLimiter({
    max: config.rateLimitMax,
    windowMs: config.rateLimitWindowMs,
});

app.use(
    "/api/events",
    apiRateLimiter,
    apiKeyAuth(config.apiKey)
);

app.use(
    "/api/metrics",
    apiRateLimiter,
    apiKeyAuth(config.apiKey)
);

app.use(requestLogger(metrics));


app.get("/", (_req, res) => {
    res.json({ status: "ok" });
});

app.get("/api/metrics", (_req, res) => {
    res.json(metrics.getSnapshot());
});

app.get("/api/health", async (_req, res) => {
    try {
        const result = await pool.query("SELECT NOW()")

        res.json({
            status: "ok",
            databaseTime: result.rows[0].now,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            status: "error",
            message: "Database connection failed",
        });
    }
});

app.get("/api/events", async (req, res) => {
    const parsedQuery = querySchema.safeParse(req.query);

    if (!parsedQuery.success) {
        return res.status(400).json({
            error: "Invalid query parameters",
        })
    }

    const { level, source, from, to, limit, before } = parsedQuery.data;

    let cursor;

    if (before) {
        try {
            cursor = decodeCursor(before);
        } catch {
            return res.status(400).json({
                error: "Invalid cursor"
            })
        }
    }

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (typeof level === "string") {
        conditions.push(`level = $${values.length + 1}`)
        values.push(level);
    }

    if (typeof source === "string") {
        conditions.push(`source = $${values.length + 1}`)
        values.push(source);
    }

    if (typeof from === "string") {
        conditions.push(`timestamp >= $${values.length + 1}`);
        values.push(from);
    }

    if (typeof to === "string") {
        conditions.push(`timestamp <= $${values.length + 1}`);
        values.push(to);
    }

    if (cursor) {
        conditions.push(
            `(timestamp < $${values.length + 1} OR (timestamp = $${values.length + 1} AND id < $${values.length + 2}))`
        );

        values.push(cursor.timestamp, cursor.id);
    }

    values.push(limit + 1);

    let query = `
        select * 
        from events
    `;

    if (conditions.length > 0) {
        query += ` where ${conditions.join(" and ")}`;
    }

    query += `
        ORDER BY timestamp DESC, id DESC
        LIMIT $${values.length}
    `;

    try {
        const result = await pool.query(query, values);

        const hasMore = result.rows.length > limit;

        const events = result.rows.slice(0, limit);

        let nextCursor: string | null = null;

        if (hasMore) {
            const lastEvent = events[events.length - 1];

            nextCursor = encodeCursor(
                lastEvent.timestamp,
                lastEvent.id
            );
        }

        return res.status(200).json({
            data: events,
            nextCursor,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Failed to retrieve events"
        });
    }
})

app.post("/api/events", async (req, res) => {
    const parsedEvent = eventSchema.safeParse(req.body);

    if (!parsedEvent.success) {
        return res.status(400).json({
            error: "Invalid event",
        });
    }

    const {
        timestamp,
        level,
        source,
        message,
        metadata,
    } = parsedEvent.data;

    try {
        const result = await pool.query(
            `
                INSERT INTO events (
                    timestamp,
                    level,
                    source,
                    message,
                    metadata
                )
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `,
            [
                timestamp,
                level,
                source,
                message,
                metadata,
            ]
        );

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Failed to create event",
        });
    }
});

app.post("/api/events/batch", async (req, res) => {
    const parsedBatch = eventBatchSchema.safeParse(req.body);

    if (!parsedBatch.success) {
        return res.status(400).json({
            error: "Invalid event batch",
        });
    }

    const { events } = parsedBatch.data;

    let client;

    try {
        client = await pool.connect();

        await client.query("BEGIN");

        const values: unknown[] = [];

        const placeholders = events.map((event, index) => {
            const offset = index * 5;

            values.push(
                event.timestamp,
                event.level,
                event.source,
                event.message,
                event.metadata
            );

            return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
        });

        await client.query(
            `
        INSERT INTO events (
            timestamp,
            level,
            source,
            message,
            metadata
        )
        VALUES ${placeholders.join(", ")}
            `, values
        );

        await client.query("COMMIT");

        return res.status(201).json({
            inserted: events.length,
        });
    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError);
            }
        }

        console.error(error);

        return res.status(500).json({
            error: "Failed to ingest events",
        });
    } finally {
        if (client) {
            client.release();
        }
    }
});

app.use(errorHandler);