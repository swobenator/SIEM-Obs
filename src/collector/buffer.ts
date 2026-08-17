import type { Event } from "../schemas/event.js";

const MAX_BATCH_SIZE = 50;
const FLUSH_INTERVAL = 1000;

export class EventBuffer {
    private events: Event[] = [];
    private timer: NodeJS.Timeout;

    constructor(
        private onFlush: (events: Event[]) => Promise<void>
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
            await this.onFlush(events);

            this.events = [];
        } catch (error) {
            console.error("Failed to flush events:", error);
        }
    }
    async stop() {
        clearInterval(this.timer);

        await this.flush();
    }
}