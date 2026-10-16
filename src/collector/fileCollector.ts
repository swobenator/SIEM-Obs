// Watches a log file and forwards complete, valid appended lines to the event buffer.
import { watch } from "node:fs";
import { dirname, basename } from "node:path";
import { readFile } from "node:fs/promises";
import { parseLogLine } from "./parser.js";
import type { Event } from "../schemas/event.js";
import { logger } from "../logger.js";

export function startFileCollector(
    filePath: string,
    onEvents: (events: Event[]) => void
) {
    let offset: number | null = null;
    let buffer = "";

    async function processFile() {
        const content = await readFile(filePath, "utf8");

        // Start at the current end of the file; only later appended content is ingested.
        if (offset === null) {
            offset = content.length;
            return;
        }

        // A truncation/rotation reset invalidates the saved offset and partial line.
        if (content.length < offset) {
            offset = 0;
            buffer = "";
        }

        const newContent = content.slice(offset);

        if (newContent.length === 0) {
            return;
        }

        offset = content.length;

        buffer += newContent;

        // Keep the final fragment until its newline arrives so partial writes are not parsed.
        const lines = buffer.split(/\r?\n/);

        buffer = lines.pop() ?? "";

        const parsedEvents = lines
            .filter(line => line.trim().length > 0)
            .map(parseLogLine);

        // Skip malformed lines rather than sending invalid records to the API.
        const events: Event[] = parsedEvents.filter(
            (event): event is Event => event !== null
        );

        if (events.length > 0) {
            onEvents(events);
        }
    }

    const directory = dirname(filePath);
    const filename = basename(filePath);

    const watcher = watch(directory, (eventType, changedFile) => {
        if (changedFile === filename) {
            processFile().catch((error) => {
                logger.error("Failed to process log file", {
                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                });
            });
        }
    });

    processFile().catch((error) => {
        logger.error("Failed to process log file", {
            error:
                error instanceof Error
                    ? error.message
                    : String(error),
        });
    });

    return () => {
        watcher.close();
    };
}