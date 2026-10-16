// Encodes and validates the timestamp/ID position used for stable event pagination.
import { z } from "zod";

const cursorDataSchema = z.object({
    timestamp: z.string().datetime(),
    id: z.string().uuid(),
});

export function encodeCursor(timestamp: Date, id: string): string {
    const data = {
        timestamp: timestamp.toISOString(),
        id,
    };

    // Base64url makes the cursor safe to place in a query parameter; it is not an auth token.
    return Buffer
        .from(JSON.stringify(data))
        .toString("base64url");
}

export function decodeCursor(cursor: string) {
    const decoded = Buffer
        .from(cursor, "base64url")
        .toString("utf-8");

    const parsed = JSON.parse(decoded);

    return cursorDataSchema.parse(parsed);
}