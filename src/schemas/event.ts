import { z } from "zod";

export const eventSchema = z.object({
    timestamp: z.coerce.date(),
    level: z.enum(["DEBUG", "INFO", "WARN", "ERROR", "CRITICAL"]),
    source: z.string().min(1).max(100),
    message: z.string().min(1).max(5000),
    metadata: z.record(z.string(), z.unknown()).default({}),
});

export type Event = z.infer<typeof eventSchema>;
export type EventInput = z.infer<typeof eventSchema>;