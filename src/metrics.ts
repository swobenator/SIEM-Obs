export type MetricsSnapshot = {
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

export class Metrics {
    private eventsReceived = 0;
    private eventsProcessed = 0;
    private batchesProcessed = 0;
    private flushFailures = 0;
    private retries = 0;
    private httpRequests = 0;
    private http4xx = 0;
    private http5xx = 0;
    private httpRequestDurationMs = 0;

    recordEventsReceived(count: number) {
        this.eventsReceived += count;
    }

    recordEventsProcessed(count: number) {
        this.eventsProcessed += count;
    }

    recordBatchProcessed() {
        this.batchesProcessed += 1;
    }

    recordFlushFailure() {
        this.flushFailures += 1;
    }

    recordRetry() {
        this.retries += 1;
    }

    recordHttpRequest(statusCode: number, durationMs: number) {
        this.httpRequests += 1;
        this.httpRequestDurationMs += durationMs;

        if (statusCode >= 400 && statusCode < 500) {
            this.http4xx += 1;
        }

        if (statusCode >= 500) {
            this.http5xx += 1;
        }
    }

    getSnapshot(): MetricsSnapshot {
        return {
            eventsReceived: this.eventsReceived,
            eventsProcessed: this.eventsProcessed,
            batchesProcessed: this.batchesProcessed,
            flushFailures: this.flushFailures,
            retries: this.retries,
            httpRequests: this.httpRequests,
            http4xx: this.http4xx,
            http5xx: this.http5xx,
            httpRequestDurationMs: this.httpRequestDurationMs,
        };
    }
}

export const metrics = new Metrics();