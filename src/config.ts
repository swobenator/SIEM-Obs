// Read and validate runtime settings once so the application fails fast on invalid configuration.
import "dotenv/config";

// Required values are rejected early rather than failing later during a request.
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

// Shared validator for ports, limits and intervals that must be positive integers.
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

    port: positiveInteger("PORT"),
    dbHost: required("DB_HOST"),
    dbPort: positiveInteger("DB_PORT"),
    dbUser: required("DB_USER"),
    dbPassword: required("DB_PASSWORD"),
    dbName: required("DB_NAME"),
    apiKey: required("API_KEY"),

    rateLimitMax: positiveInteger("RATE_LIMIT_MAX"),
    rateLimitWindowMs: positiveInteger("RATE_LIMIT_WINDOW_MS"),
};
