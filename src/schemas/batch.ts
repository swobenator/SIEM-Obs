// Limits batch payloads to between 1 and 1,000 events before ingestion.
import { z } from "zod";
import { eventSchema } from "./event.js";

export const eventBatchSchema = z.object({
    events: z.array(eventSchema).min(1).max(1000),
});