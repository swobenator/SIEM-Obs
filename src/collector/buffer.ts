// Buffers events into batches and retries failed sends before returning them to the queue.
import type { Event } from "../schemas/event.js";
import { retryWithBackoff } from "./retry.js";
import { logger } from "../logger.js";
import { config } from "../config.js";

const MAX_BATCH_SIZE = config.batchSize;
const FLUSH_INTERVAL = config.flushIntervalMs;

type FlushStats = {
    onSuccess?: (eventCount: number) => void;
    onFailure?: () => void;
    onRetry?: () => void;
};

export class EventBuffer {
    private events: Event[] = [];
    private timer: NodeJS.Timeout;
    private inFlightFlush: Promise<void> | null = null;

    constructor(
        private onFlush: (events: Event[]) => Promise<unknown>,
        private stats?: FlushStats,
        private signal?: AbortSignal,
        private maxRetries = config.maxRetries
    ) {
        this.timer = setInterval(() => {
            this.flush().catch((error) => {
                logger.error("Background flush failed", {
                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                });
            });
        }, FLUSH_INTERVAL);
    }

    add(events: Event[]) {
        this.events.push(...events);

        if (this.events.length >= MAX_BATCH_SIZE) {
            this.flush().catch((error) => {
                logger.error("Background flush failed", {
                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                });
            });
        }
    }

    private async flush(): Promise<void> {
        // Never start another flush while one is already running.
        if (this.inFlightFlush) {
            await this.inFlightFlush;
            return;
        }

        if (this.events.length === 0) {
            return;
        }

        // Detach this batch so new arrivals stay in the queue.
        const events = this.events;
        this.events = [];

        const operation = (async () => {
            try {
                await retryWithBackoff(
                    () => this.onFlush(events),
                    this.maxRetries,
                    () => this.stats?.onRetry?.(),
                    this.signal
                );

                this.stats?.onSuccess?.(events.length);
            } catch (error) {
                // Preserve the failed batch, ahead of newer events.
                this.events = [...events, ...this.events];

                if (
                    error instanceof Error &&
                    error.message === "Retry cancelled"
                ) {
                    return;
                }

                this.stats?.onFailure?.();

                logger.error(
                    `Failed to flush events: ${error instanceof Error
                        ? error.message
                        : String(error)
                    }`
                );
            }
        })();

        this.inFlightFlush = operation;

        try {
            await operation;
        } finally {
            if (this.inFlightFlush === operation) {
                this.inFlightFlush = null;
            }
        }
    }

    // Stop periodic flushes, wait for any active send, then drain remaining events.
    async stop(): Promise<void> {
        clearInterval(this.timer);

        if (this.inFlightFlush) {
            await this.inFlightFlush;
        }

        await this.flush();
    }
}