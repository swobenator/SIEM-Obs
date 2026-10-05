export type DashboardMetrics = {
    eventsReceived: number;
    eventsProcessed: number;
    batchesProcessed: number;
    flushFailures: number;
    retries: number;
    httpRequests: number;
    http4xx: number;
    http5xx: number;
    httpRequestDurationMs: number;
};

export type EventRecord = {
    id: string;
    timestamp: string;
    source: string;
    level: "INFO" | "WARN" | "ERROR";
    message: string;
    metadata: Record<string, unknown>;
};