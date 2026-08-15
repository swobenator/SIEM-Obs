import express from "express";
import { pool } from "./database.js"
import { eventSchema } from "./schemas/event.js"
import { querySchema } from "./schemas/query.js"
import { decodeCursor } from "./schemas/cursor.js"
import { encodeCursor } from "./schemas/cursor.js"

const app = express();
const PORT = 3000;

interface LogEvent {
    id: string,
    timestamp: Date,
    level: "INFO" | "ERROR" | "ALERT",
    message: string;
}

let event: LogEvent = {
    id: "123",
    timestamp: new Date(),
    level: "ERROR",
    message: "Database connection failed"
};


app.use(express.json());

app.get("/", (_req, res) => {
    res.json({ status: event.message });
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

    const { level, source, limit, before } = parsedQuery.data;

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
            error: "Failed to retreive events"
        });
    }
})

app.post("/api/events", async (req, res) => {
    const result = eventSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: "Invalid event",
            details: result.error.flatten()
        });
    }

    const { source, level, message, metadata } = result.data;

    try {
        const dbResult = await pool.query(
            `
            insert into events (source, level, message, metadata)
            values($1, $2, $3, $4)
            returning *
            `,
            [source, level, message, metadata]
        );

        return res.status(201).json(dbResult.rows[0]);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Failed to store event"
        });
    }
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})