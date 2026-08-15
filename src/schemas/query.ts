import { z } from "zod";


export const querySchema = z.object({
        level: z.string().optional(),
        source: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
        before: z.string().optional()
});