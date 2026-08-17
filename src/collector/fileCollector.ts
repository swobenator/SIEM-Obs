import { watch } from "node:fs";
import { readFile } from "node:fs/promises";
import { parseLogLine } from "./parser.js";
import type { Event } from "../schemas/event.js";

export function startFileCollector(
    filePath: string,
    onEvents: (events: Event[]) => void
) {
    let offset = 0;
    let buffer = "";

    async function processFile() {
        const content = await readFile(filePath, "utf8");

        const newContent = content.slice(offset);

        if (newContent.length === 0) {
            return;
        }

        offset = content.length;

        buffer += newContent;

        const lines = buffer.split(/\r?\n/);

        buffer = lines.pop() ?? "";

        const parsedEvents = lines
            .filter(line => line.trim().length > 0)
            .map(parseLogLine);

        const events: Event[] = parsedEvents.filter(
            (event): event is Event => event !== null
        );

        if (events.length > 0) {
            onEvents(events);
        }
    }

    const watcher = watch(filePath, () => {
        processFile().catch(console.error);
    });

    processFile().catch(console.error);

    return () => {
        watcher.close();
    };
}