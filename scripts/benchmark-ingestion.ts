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

    const start = performance.now();

    const response = await fetch("http://localhost:3000/api/events/batch", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ events }),
    });

    const end = performance.now();

    const result = await response.json();

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