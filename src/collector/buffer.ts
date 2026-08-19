import type { Event } from "../schemas/event.js";
import { retryWithBackoff } from "./retry.js";
import { logger } from "./logger.js";

const MAX_BATCH_SIZE = 50;
const FLUSH_INTERVAL = 1000;
type FlushStats = {
    onSuccess?: (eventCount: number) => void;
    onFailure?: () => void;
    onRetry?: () => void;
};

export class EventBuffer {
    private events: Event[] = [];
    private timer: NodeJS.Timeout;

    constructor(
        private onFlush: (events: Event[]) => Promise<unknown>,
        private stats?: FlushStats,
        private signal?: AbortSignal
    ) {
        this.timer = setInterval(() => {
            this.flush().catch(console.error);
        }, FLUSH_INTERVAL);
    }

    add(events: Event[]) {
        this.events.push(...events);

        if (this.events.length >= MAX_BATCH_SIZE) {
            this.flush().catch(console.error);
        }
    }

    private async flush() {
        if (this.events.length === 0) {
            return;
        }

        const events = this.events;

        try {
            await retryWithBackoff(
                () => this.onFlush(events),
                5,
                () => this.stats?.onRetry?.(),
                this.signal
            );

            this.events = [];

            this.stats?.onSuccess?.(events.length);
        } catch (error) {
            if (error instanceof Error && error.message === "Retry cancelled") {
                return;
            }

            this.stats?.onFailure?.();

            logger.error(
                `Failed to flush events: ${error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }
    async stop() {
        clearInterval(this.timer);

        await this.flush();
    }
}