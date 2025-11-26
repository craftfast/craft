/**
 * Production-safe Logger
 * 
 * Provides structured logging that respects environment settings.
 * Logs are suppressed in production unless explicitly enabled.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerOptions {
    prefix?: string;
    showTimestamp?: boolean;
}

const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
const VERBOSE_LOGGING = process.env.VERBOSE_LOGGING === "true";

// Map log levels to console methods and emojis
const LOG_CONFIG: Record<LogLevel, { method: (...args: unknown[]) => void; emoji: string }> = {
    debug: { method: console.debug, emoji: "🔍" },
    info: { method: console.log, emoji: "ℹ️" },
    warn: { method: console.warn, emoji: "⚠️" },
    error: { method: console.error, emoji: "❌" },
};

/**
 * Check if logging is enabled for the given level
 */
function shouldLog(level: LogLevel): boolean {
    // Always log errors
    if (level === "error") return true;

    // Always log warnings in development
    if (level === "warn" && IS_DEVELOPMENT) return true;

    // In development, log everything
    if (IS_DEVELOPMENT) return true;

    // In production, only log if verbose logging is enabled
    return VERBOSE_LOGGING;
}

/**
 * Format log message with optional prefix and timestamp
 */
function formatMessage(message: string, options: LoggerOptions, emoji: string): string {
    const parts: string[] = [];

    if (options.showTimestamp) {
        parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(emoji);

    if (options.prefix) {
        parts.push(`[${options.prefix}]`);
    }

    parts.push(message);

    return parts.join(" ");
}

/**
 * Create a namespaced logger
 */
export function createLogger(namespace: string, options: LoggerOptions = {}) {
    const opts: LoggerOptions = {
        prefix: namespace,
        showTimestamp: false,
        ...options,
    };

    return {
        debug: (message: string, ...args: unknown[]) => {
            if (shouldLog("debug")) {
                LOG_CONFIG.debug.method(formatMessage(message, opts, LOG_CONFIG.debug.emoji), ...args);
            }
        },

        info: (message: string, ...args: unknown[]) => {
            if (shouldLog("info")) {
                LOG_CONFIG.info.method(formatMessage(message, opts, LOG_CONFIG.info.emoji), ...args);
            }
        },

        warn: (message: string, ...args: unknown[]) => {
            if (shouldLog("warn")) {
                LOG_CONFIG.warn.method(formatMessage(message, opts, LOG_CONFIG.warn.emoji), ...args);
            }
        },

        error: (message: string, ...args: unknown[]) => {
            if (shouldLog("error")) {
                LOG_CONFIG.error.method(formatMessage(message, opts, LOG_CONFIG.error.emoji), ...args);
            }
        },
    };
}

// Pre-configured loggers for common use cases
export const logger = {
    ai: createLogger("AI"),
    api: createLogger("API"),
    auth: createLogger("Auth"),
    db: createLogger("DB"),
    payment: createLogger("Payment"),
    sandbox: createLogger("Sandbox"),
    webhook: createLogger("Webhook"),

    // Generic logging for one-off uses
    debug: (message: string, ...args: unknown[]) => {
        if (shouldLog("debug")) {
            console.debug(`🔍 ${message}`, ...args);
        }
    },

    info: (message: string, ...args: unknown[]) => {
        if (shouldLog("info")) {
            console.log(`ℹ️ ${message}`, ...args);
        }
    },

    warn: (message: string, ...args: unknown[]) => {
        if (shouldLog("warn")) {
            console.warn(`⚠️ ${message}`, ...args);
        }
    },

    error: (message: string, ...args: unknown[]) => {
        if (shouldLog("error")) {
            console.error(`❌ ${message}`, ...args);
        }
    },
};

export default logger;
