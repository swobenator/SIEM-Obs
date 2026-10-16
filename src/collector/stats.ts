// Tracks collector-specific totals and periodically writes a compact summary to the logger.
import { logger } from "../logger.js";

export class CollectorStats {
    // These counters are process-local diagnostics, not persisted historical metrics.
    eventsReceived = 0;
    batchesSent = 0;
    eventsSent = 0;
    sendFailures = 0;
    retries = 0;

        log() {
            logger.info(
                `stats eventsReceived=${this.eventsReceived} ` +
                `batchesSent=${this.batchesSent} ` +
                `eventsSent=${this.eventsSent} ` +
                `sendFailures=${this.sendFailures} ` +
                `retries=${this.retries}`
            );
        }
    }

