import { logger } from "./logger.js";
import { config } from "../config.js";

export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = config.maxRetries,
    onRetry?: () => void,
    signal?: AbortSignal
): Promise<T> {
    let delay = 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (signal?.aborted) {
            throw new Error("Retry cancelled");
        }

        try {
            return await operation();
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }

            if (signal?.aborted) {
                throw new Error("Retry cancelled");
            }

            onRetry?.();

            logger.warn(
                `Operation failed. Retrying in ${delay}ms...`
            );
            await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(resolve, delay);

                signal?.addEventListener(
                    "abort",
                    () => {
                        clearTimeout(timer);
                        reject(new Error("Retry cancelled"));
                    },
                    { once: true }
                );
            });

            delay *= 2;
        }
    }

    throw new Error("Retry operation failed");
}