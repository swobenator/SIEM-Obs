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