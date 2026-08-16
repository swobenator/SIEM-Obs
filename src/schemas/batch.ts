import { z } from "zod";
import { eventSchema } from "./event.js";

export const eventBatchSchema = z.object({
    events: z.array(eventSchema).min(1).max(1000),
});