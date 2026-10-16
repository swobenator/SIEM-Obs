// Wires file watching, buffering, ingestion, metrics and collector lifecycle together.
import { startFileCollector } from "./fileCollector.js";
import { EventBuffer } from "./buffer.js";
import { sendEvents } from "./apiClient.js";
import { CollectorStats } from "./stats.js";
import { logger } from "../logger.js";
import { config } from "../config.js";
import { metrics } from "../metrics.js";


// Lets shutdown cancel retry waits rather than leaving the process stuck waiting.
const abortController = new AbortController();

const stats = new CollectorStats();

// Update collector totals and shared dashboard metrics only from flush callbacks.
const buffer = new EventBuffer(
    sendEvents,
    {
        onSuccess: (eventCount) => {
            stats.batchesSent += 1;
            stats.eventsSent += eventCount;

            metrics.recordEventsProcessed(eventCount);
            metrics.recordBatchProcessed();
        },

        onFailure: () => {
            stats.sendFailures += 1;

            metrics.recordFlushFailure();
        },

        onRetry: () => {
            stats.retries += 1;

            metrics.recordRetry();
        },
    },

    abortController.signal
);


const stopCollector = startFileCollector(
    config.logFilePath,
    (events) => {
        stats.eventsReceived += events.length;

        metrics.recordEventsReceived(events.length);
        buffer.add(events);
    }
);

logger.info("Log collector started");

// Handle Ctrl+C by stopping new reads, draining the buffer and logging final totals.
process.on("SIGINT", async () => {
    logger.info("Stopping log collector...");
    abortController.abort();

    clearInterval(statsTimer);

    stopCollector();

    await buffer.stop();

    stats.log();

    process.exit(0);
});

const statsTimer = setInterval(() => {
    stats.log();
}, 10000);