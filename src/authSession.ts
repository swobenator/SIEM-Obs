import { randomUUID } from "node:crypto";

const SESSION_DURATION_MS = 60 * 60 * 1000;

type Session = {
    expiresAt: number;
};

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

    if (session.expiresAt <= Date.now()) {
        sessions.delete(sessionId);
        return false;
    }

    return true;
}

export function deleteSession(sessionId: string) {
    sessions.delete(sessionId);
}