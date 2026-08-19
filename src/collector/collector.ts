import { startFileCollector } from "./fileCollector.js";
import { EventBuffer } from "./buffer.js";
import { sendEvents } from "./apiClient.js";
import { CollectorStats } from "./stats.js";

const abortController = new AbortController();

const buffer = new EventBuffer(
    sendEvents,
    {
        onSuccess: (eventCount) => {
            stats.batchesSent += 1;
            stats.eventsSent += eventCount;
        },

        onFailure: () => {
            stats.sendFailures += 1;
        },

        onRetry: () => {
            stats.retries += 1;
        },
    },
    abortController.signal
);

const stats = new CollectorStats();

const stopCollector = startFileCollector(
    "logs/application.log",
    (events) => {
        stats.eventsReceived += events.length;

        buffer.add(events);
    }
);
console.log("Log collector started");

process.on("SIGINT", async () => {
    console.log("Stopping log collector...");
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