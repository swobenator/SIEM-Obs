export type MetricsSnapshot = {
    eventsReceived: number;
    eventsProcessed: number;
    batchesProcessed: number;
    flushFailures: number;
    retries: number;
};

export class Metrics {
    private eventsReceived = 0;
    private eventsProcessed = 0;
    private batchesProcessed = 0;
    private flushFailures = 0;
    private retries = 0;

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

    getSnapshot(): MetricsSnapshot {
        return {
            eventsReceived: this.eventsReceived,
            eventsProcessed: this.eventsProcessed,
            batchesProcessed: this.batchesProcessed,
            flushFailures: this.flushFailures,
            retries: this.retries,
        };
    }
}

export const metrics = new Metrics();