import "dotenv/config";
import { env } from "node:process";

const apiKey = env.API_KEY;

if (!apiKey) {
    throw new Error("Missing API_KEY environment variable");
}

// Intended to benchmark local batch-ingestion throughput across several payload sizes.
// Compare small and larger payloads to show how batching affects measured throughput.
const sizes = [1, 10, 100, 1000];

async function benchmark(size: number) {
    const events = Array.from({ length: size }, (_, i) => ({
        timestamp: new Date().toISOString(),
        level: "INFO",
        source: "benchmark",
        message: `Benchmark event ${i}`,
        metadata: {
            index: i,
        },
    }));

    // Use a monotonic timer so elapsed request duration is not affected by clock changes.
    const start = performance.now();

    const response = await fetch("http://localhost:3000/api/events/batch", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ events }),
    });

    const result = await response.json();
    const end = performance.now();

    if (!response.ok) {
        throw new Error(
            `Benchmark request failed with HTTP ${response.status}: ${JSON.stringify(result)}`
        );
    }


    const duration = end - start;

    console.log({
        events: size,
        durationMs: duration.toFixed(2),
        eventsPerSecond: Math.round(size / (duration / 1000)),
        status: response.status,
        result,
    });
}

async function main() {
    for (const size of sizes) {
        await benchmark(size);
    }
}

main();