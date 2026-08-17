import { startFileCollector } from "./fileCollector.js";
import { EventBuffer } from "./buffer.js";
import { sendEvents } from "./apiClient.js";

const buffer = new EventBuffer(sendEvents);

const stopCollector = startFileCollector(
    "logs/application.log",
    (events) => {
        buffer.add(events);
    }
);

console.log("Log collector started");

process.on("SIGINT", async () => {
    console.log("Stopping log collector...");

    stopCollector();

    await buffer.stop();

    process.exit(0);
});