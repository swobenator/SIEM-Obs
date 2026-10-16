// Stores expiring browser sessions in process memory; a server restart clears them.
import { randomUUID } from "node:crypto";

const SESSION_DURATION_MS = 60 * 60 * 1000;

type Session = {
    expiresAt: number;
};

// Sessions are intentionally process-local; they are not persisted to the database.
const sessions = new Map<string, Session>();

export function createSession() {
    const sessionId = randomUUID();

    sessions.set(sessionId, {
        expiresAt: Date.now() + SESSION_DURATION_MS,
    });

    return sessionId;
}

export function hasValidSession(sessionId: string) {
    const session = sessions.get(sessionId);

    if (!session) {
        return false;
    }

    // Remove expired entries when they are next checked.
    if (session.expiresAt <= Date.now()) {
        sessions.delete(sessionId);
        return false;
    }

    return true;
}

export function deleteSession(sessionId: string) {
    sessions.delete(sessionId);
}