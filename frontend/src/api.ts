export type HealthResponse = {
    status: string;
};

export type DashboardMetrics = {
    eventsReceived: number;
    eventsProcessed: number;
    batchesProcessed: number;
    flushFailures: number;
    retries: number;
    httpRequests: number;
    http4xx: number;
    http5xx: number;
    httpRequestDurationMs: number;
};

export async function getHealth(): Promise<HealthResponse> {
    const response = await fetch("/api/health");

    if (!response.ok) {
        throw new Error("Health request failed");
    }

    return response.json() as Promise<HealthResponse>;
}

export async function login(apiKey: string) {
    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ apiKey }),
    });

    if (!response.ok) {
        throw new Error("Authentication failed");
    }
}

export async function logout() {
    await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
    });
}

export async function getMetrics(): Promise<DashboardMetrics> {
    const response = await fetch("/api/metrics", {
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Metrics request failed");
    }

    return response.json() as Promise<DashboardMetrics>;
}

export async function getSession(): Promise<boolean> {
    const response = await fetch("/api/auth/me", {
        credentials: "include",
    });

    if (!response.ok) {
        return false;
    }

    const data = await response.json() as {
        authenticated: boolean;
    };

    return data.authenticated;
}