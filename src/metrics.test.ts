import { describe, expect, it } from "vitest";
import { Metrics } from "./metrics.js";

describe("Metrics", () => {
    it("starts with all metrics at zero", () => {
        const metrics = new Metrics();

        expect(metrics.getSnapshot()).toEqual({
            eventsReceived: 0,
            eventsProcessed: 0,
            batchesProcessed: 0,
            flushFailures: 0,
            retries: 0,
        });
    });

    it("records received events", () => {
        const metrics = new Metrics();

        metrics.recordEventsReceived(10);

        expect(metrics.getSnapshot().eventsReceived).toBe(10);
    });

    it("records processed events", () => {
        const metrics = new Metrics();

        metrics.recordEventsProcessed(8);

        expect(metrics.getSnapshot().eventsProcessed).toBe(8);
    });

    it("records processed batches", () => {
        const metrics = new Metrics();

        metrics.recordBatchProcessed();
        metrics.recordBatchProcessed();

        expect(metrics.getSnapshot().batchesProcessed).toBe(2);
    });

    it("records flush failures", () => {
        const metrics = new Metrics();

        metrics.recordFlushFailure();

        expect(metrics.getSnapshot().flushFailures).toBe(1);
    });

    it("records retries", () => {
        const metrics = new Metrics();

        metrics.recordRetry();
        metrics.recordRetry();
        metrics.recordRetry();

        expect(metrics.getSnapshot().retries).toBe(3);
    });

    it("accumulates metric values", () => {
        const metrics = new Metrics();

        metrics.recordEventsReceived(5);
        metrics.recordEventsReceived(7);

        metrics.recordEventsProcessed(4);
        metrics.recordEventsProcessed(3);

        metrics.recordBatchProcessed();
        metrics.recordBatchProcessed();

        expect(metrics.getSnapshot()).toEqual({
            eventsReceived: 12,
            eventsProcessed: 7,
            batchesProcessed: 2,
            flushFailures: 0,
            retries: 0,
        });
    });
});