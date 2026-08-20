import "dotenv/config";

function required(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

function requiredUrl(name: string): string {
    const value = required(name);

    try {
        new URL(value);
    } catch {
        throw new Error(`${name} must be a valid URL`);
    }

    return value;
}

function positiveInteger(name: string): number {
    const value = Number(required(name));

    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(
            `${name} must be a positive integer`
        );
    }

    return value;
}

export const config = {
    apiUrl: requiredUrl("API_URL"),
    logFilePath: required("LOG_FILE_PATH"),
    batchSize: positiveInteger("BATCH_SIZE"),
    flushIntervalMs: positiveInteger("FLUSH_INTERVAL_MS"),
    maxRetries: positiveInteger("MAX_RETRIES"),
};