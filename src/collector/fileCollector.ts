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
    let offset = 0;
    let buffer = "";

    async function processFile() {
        const content = await readFile(filePath, "utf8");

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