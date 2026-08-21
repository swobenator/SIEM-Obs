import { describe, expect, it, vi } from "vitest";
import { retryWithBackoff } from "./retry.js";

describe("retryWithBackoff", () => {
    it("retries after failures and eventually succeeds", async () => {
        vi.useFakeTimers();

        try {
            let attempts = 0;
            const onRetry = vi.fn();

            const operation = vi.fn().mockImplementation(async () => {
                attempts++;

                if (attempts < 3) {
                    throw new Error("Temporary failure");
                }

                return "success";
            });

            const promise = retryWithBackoff(
                operation,
                5,
                onRetry
            );

            await vi.advanceTimersByTimeAsync(1000);
            await vi.advanceTimersByTimeAsync(2000);

            const result = await promise;

            expect(result).toBe("success");
            expect(operation).toHaveBeenCalledTimes(3);
            expect(onRetry).toHaveBeenCalledTimes(2);
        } finally {
            vi.useRealTimers();
        }
    });
    it("throws when all retries are exhausted", async () => {
        vi.useFakeTimers();

        try {
            const operation = vi
                .fn()
                .mockRejectedValue(new Error("API unavailable"));

            const onRetry = vi.fn();

            const promise = retryWithBackoff(
                operation,
                5,
                onRetry
            );

            const rejection = expect(promise).rejects.toThrow(
                "API unavailable"
            );

            await vi.advanceTimersByTimeAsync(1000);
            await vi.advanceTimersByTimeAsync(2000);
            await vi.advanceTimersByTimeAsync(4000);
            await vi.advanceTimersByTimeAsync(8000);
            await vi.advanceTimersByTimeAsync(16000);

            await rejection;

            expect(operation).toHaveBeenCalledTimes(6);
            expect(onRetry).toHaveBeenCalledTimes(5);
        } finally {
            vi.useRealTimers();
        }
    });
});