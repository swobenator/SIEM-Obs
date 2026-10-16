// Sends validated collector batches to the SIEM-Obs ingestion API.
import type { Event } from "../schemas/event.js";
import { config } from "../config.js";

const API_URL = `${config.apiUrl}/api/events/batch`;

export async function sendEvents(events: Event[]) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
            events,
        }),
    });

    // Treat non-2xx responses as failed sends so the buffer can retry them.
    if (!response.ok) {
        const body = await response.text();

        throw new Error(
            `Event ingestion failed (${response.status}): ${body}`
        );
    }

    return response.json();
}