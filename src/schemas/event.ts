import { z } from "zod";

export const eventSchema = z.object({
    source: z.string().min(1),
    level: z.string().min(1),
    message: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()).default({})
});

export type EventInput = z.infer<typeof eventSchema>;