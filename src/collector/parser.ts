import { eventSchema } from "../schemas/event.js";

export function parseLogLine(line: string) {
    const parts = line.split(" ");

    if (parts.length < 4) {
        return null;
    }

    const timestamp = parts[0];
    const level = parts[1];
    const source = parts[2];
    const message = parts.slice(3).join(" ").trim();

    const result = eventSchema.safeParse({
        timestamp,
        level,
        source,
        message,
    });

    if (!result.success) {
        return null;
    }

    return result.data;
}