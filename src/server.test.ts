import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import request from "supertest";
import { app } from "./server.js";
import { pool } from "./database.js";

afterEach(() => {
    vi.restoreAllMocks();
});

describe("GET /", () => {
    it("returns the API status", async () => {
        const response = await request(app)
            .get("/");

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            status: "ok",
        });
    });
});

describe("GET /api/health", () => {
    it("returns a healthy status when the database is available", async () => {
        vi.spyOn(pool, "query").mockResolvedValueOnce({
            rows: [
                {
                    now: new Date("2026-08-21T12:00:00Z"),
                },
            ],
        } as any);

        const response = await request(app)
            .get("/api/health");

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            status: "ok",
            databaseTime: "2026-08-21T12:00:00.000Z",
        });
    });
});

it("returns 500 when the database query fails", async () => {
    vi.spyOn(pool, "query").mockRejectedValueOnce(
        new Error("Database unavailable")
    );

    const response = await request(app)
        .get("/api/health");

    expect(response.status).toBe(500);

    expect(response.body).toEqual({
        status: "error",
        message: "Database connection failed",
    });
});

describe("GET /api/events", () => {
    it("returns 400 for invalid query parameters", async () => {
        const response = await request(app)
            .get("/api/events?limit=invalid");

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            error: "Invalid query parameters",
        });
    });
    it("returns events from the database", async () => {
        vi.spyOn(pool, "query").mockResolvedValueOnce({
            rows: [
                {
                    id: "event-1",
                    timestamp: new Date("2026-08-21T12:00:00Z"),
                    level: "INFO",
                    source: "application",
                    message: "Application started",
                    metadata: {},
                },
                {
                    id: "event-2",
                    timestamp: new Date("2026-08-21T11:59:00Z"),
                    level: "ERROR",
                    source: "application",
                    message: "Database unavailable",
                    metadata: {},
                },
            ],
        } as any);

        const response = await request(app)
            .get("/api/events?limit=5");

        expect(response.status).toBe(200);

        expect(response.body.data).toHaveLength(2);

        expect(response.body.data[0]).toMatchObject({
            id: "event-1",
            level: "INFO",
            source: "application",
            message: "Application started",
        });

        expect(response.body.data[1]).toMatchObject({
            id: "event-2",
            level: "ERROR",
            source: "application",
            message: "Database unavailable",
        });

        expect(response.body.nextCursor).toBeNull();
    });
    it("returns a next cursor when more events are available", async () => {
        const events = [
            {
                id: "550e8400-e29b-41d4-a716-446655440001",
                timestamp: new Date("2026-08-21T12:00:00.000Z"),
                level: "INFO",
                source: "application",
                message: "Event 1",
                metadata: {},
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440002",
                timestamp: new Date("2026-08-21T11:59:00.000Z"),
                level: "INFO",
                source: "application",
                message: "Event 2",
                metadata: {},
            },
            {
                id: "550e8400-e29b-41d4-a716-446655440003",
                timestamp: new Date("2026-08-21T11:58:00.000Z"),
                level: "INFO",
                source: "application",
                message: "Event 3",
                metadata: {},
            },
        ];

        vi.spyOn(pool, "query")
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: "550e8400-e29b-41d4-a716-446655440001",
                        timestamp: new Date("2026-08-21T12:00:00.000Z"),
                        level: "INFO",
                        source: "application",
                        message: "Event 1",
                        metadata: {},
                    },
                    {
                        id: "550e8400-e29b-41d4-a716-446655440002",
                        timestamp: new Date("2026-08-21T11:59:00.000Z"),
                        level: "INFO",
                        source: "application",
                        message: "Event 2",
                        metadata: {},
                    },
                    {
                        id: "550e8400-e29b-41d4-a716-446655440003",
                        timestamp: new Date("2026-08-21T11:58:00.000Z"),
                        level: "INFO",
                        source: "application",
                        message: "Event 3",
                        metadata: {},
                    },
                ],
            } as any)
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: "550e8400-e29b-41d4-a716-446655440003",
                        timestamp: new Date("2026-08-21T11:58:00.000Z"),
                        level: "INFO",
                        source: "application",
                        message: "Event 3",
                        metadata: {},
                    },
                ],
            } as any);

        const response = await request(app)
            .get("/api/events?limit=2");

        expect(response.status).toBe(200);

        // Only the requested number of events should be returned.
        expect(response.body.data).toHaveLength(2);

        expect(response.body.data[0].id).toBe(
            "550e8400-e29b-41d4-a716-446655440001"
        );

        expect(response.body.data[1].id).toBe(
            "550e8400-e29b-41d4-a716-446655440002"
        );

        // A third event existed, so there should be another page.
        expect(response.body.nextCursor).toEqual(expect.any(String));
        expect(response.body.nextCursor.length).toBeGreaterThan(0);
    });
    it("uses the cursor to request the next page", async () => {
        const query = vi.spyOn(pool, "query");

        query
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: "550e8400-e29b-41d4-a716-446655440001",
                        timestamp: new Date("2026-08-21T12:00:00Z"),
                        level: "INFO",
                        source: "application",
                        message: "Event 1",
                        metadata: {},
                    },
                    {
                        id: "550e8400-e29b-41d4-a716-446655440002",
                        timestamp: new Date("2026-08-21T11:59:00Z"),
                        level: "INFO",
                        source: "application",
                        message: "Event 2",
                        metadata: {},
                    },
                    {
                        id: "event-3",
                        timestamp: new Date("2026-08-21T11:58:00Z"),
                        level: "INFO",
                        source: "application",
                        message: "Event 3",
                        metadata: {},
                    },
                ],
            } as any)
            .mockResolvedValueOnce({
                rows: [
                    {
                        id: "550e8400-e29b-41d4-a716-446655440003",
                        timestamp: new Date("2026-08-21T11:58:00Z"),
                        level: "INFO",
                        source: "application",
                        message: "Event 3",
                        metadata: {},
                    },
                ],
            } as any);

        // First page
        const firstResponse = await request(app)
            .get("/api/events?limit=2");

        expect(firstResponse.status).toBe(200);

        const cursor = firstResponse.body.nextCursor;

        console.log("Generated cursor:", cursor);

        expect(cursor).toEqual(expect.any(String));

        // Second page using the cursor
        const secondResponse = await request(app)
            .get(`/api/events?limit=2&before=${encodeURIComponent(cursor)}`);

        console.log("Second response:", secondResponse.status, secondResponse.body);
        expect(secondResponse.status).toBe(200);

        expect(secondResponse.body.data).toHaveLength(1);

        expect(secondResponse.body.data[0]).toMatchObject({
            id: "550e8400-e29b-41d4-a716-446655440003",
            message: "Event 3",
        });

        expect(secondResponse.body.nextCursor).toBeNull();

        expect(query).toHaveBeenCalledTimes(2);
    });
    it("returns metrics", async () => {
        const response = await request(app)
            .get("/api/metrics");

        expect(response.status).toBe(200);

        expect(response.body).toMatchObject({
            eventsReceived: expect.any(Number),
            eventsProcessed: expect.any(Number),
            batchesProcessed: expect.any(Number),
            flushFailures: expect.any(Number),
            retries: expect.any(Number),
        });
    });
    it("filters events by level", async () => {
        const query = vi.spyOn(pool, "query").mockResolvedValueOnce({
            rows: [],
        } as any);

        const response = await request(app)
            .get("/api/events?level=ERROR");

        expect(response.status).toBe(200);

        expect(query).toHaveBeenCalledWith(
            expect.stringContaining("level = $1"),
            expect.arrayContaining(["ERROR", 51])
        );
    });
    it("filters events by source", async () => {
        const query = vi.spyOn(pool, "query").mockResolvedValueOnce({
            rows: [],
        } as any);

        const response = await request(app)
            .get("/api/events?source=application");

        expect(response.status).toBe(200);

        expect(query).toHaveBeenCalledWith(
            expect.stringContaining("source = $1"),
            expect.arrayContaining(["application", 51])
        );
    });
    it("filters events by date range", async () => {
        const query = vi.spyOn(pool, "query").mockResolvedValueOnce({
            rows: [],
        } as any);

        const from = "2026-08-21T10:00:00Z";
        const to = "2026-08-21T12:00:00Z";

        const response = await request(app)
            .get(`/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

        expect(response.status).toBe(200);

        expect(query).toHaveBeenCalledWith(
            expect.stringContaining("timestamp >= $1"),
            expect.arrayContaining([from, to, 51])
        );

        expect(query.mock.calls[0][0]).toContain("timestamp <= $2");
    });
    it("returns 400 for invalid date filters", async () => {
        const response = await request(app)
            .get("/api/events?from=not-a-date");

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            error: "Invalid query parameters",
        });
    });
    it("returns 400 for an invalid cursor", async () => {
        const response = await request(app)
            .get("/api/events?before=not-a-valid-cursor");

        expect(response.status).toBe(400);

        expect(response.body).toEqual({
            error: "Invalid cursor",
        });
    });
    it("returns 500 when retrieving events fails", async () => {
        vi.spyOn(pool, "query").mockRejectedValueOnce(
            new Error("Database unavailable")
        );

        const response = await request(app)
            .get("/api/events");

        expect(response.status).toBe(500);

        expect(response.body).toEqual({
            error: "Failed to retrieve events",
        });
    });
});