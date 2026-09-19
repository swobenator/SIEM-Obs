export type LogLevel = "INFO" | "WARN" | "ERROR";

export type LogContext = Record<string, unknown>;

function log(
    level: LogLevel,
    message: string,
    context: LogContext = {}
) {
    const entry = {
        ...context,
        timestamp: new Date().toISOString(),
        level,
        message,
    };

    const output = JSON.stringify(entry);

    if (level === "ERROR") {
        console.error(output);
        return;
    }

    if (level === "WARN") {
        console.warn(output);
        return;
    }

    console.log(output);
}

export const logger = {
    info(message: string, context?: LogContext) {
        log("INFO", message, context);
    },

    warn(message: string, context?: LogContext) {
        log("WARN", message, context);
    },

    error(message: string, context?: LogContext) {
        log("ERROR", message, context);
    },
};