/**
 * Sentry Error Tracking Configuration
 * 
 * This module provides error tracking and performance monitoring
 * for production environments using Sentry.
 * 
 * Setup:
 * 1. Create a Sentry project at https://sentry.io
 * 2. Add SENTRY_DSN to your environment variables
 * 3. Optionally add SENTRY_AUTH_TOKEN for source map uploads
 */

// Note: For full Sentry integration in Next.js 15, install and configure:
// pnpm add @sentry/nextjs
// npx @sentry/wizard@latest -i nextjs

// This is a lightweight alternative that works without the full Sentry SDK
// It captures errors and sends them to Sentry's API directly

interface SentryEvent {
    message?: string;
    level: "fatal" | "error" | "warning" | "info" | "debug";
    exception?: {
        values: Array<{
            type: string;
            value: string;
            stacktrace?: {
                frames: Array<{
                    filename: string;
                    function: string;
                    lineno?: number;
                    colno?: number;
                }>;
            };
        }>;
    };
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: {
        id?: string;
        email?: string;
        username?: string;
    };
    environment?: string;
    timestamp?: number;
}

const SENTRY_DSN = process.env.SENTRY_DSN;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Parse Sentry DSN to get project ID and public key
 */
function parseDSN(dsn: string): { publicKey: string; host: string; projectId: string } | null {
    try {
        const url = new URL(dsn);
        const publicKey = url.username;
        const host = url.host;
        const projectId = url.pathname.slice(1);
        return { publicKey, host, projectId };
    } catch {
        return null;
    }
}

/**
 * Capture an error and send it to Sentry
 */
export async function captureError(
    error: Error,
    context?: {
        tags?: Record<string, string>;
        extra?: Record<string, unknown>;
        user?: { id?: string; email?: string; username?: string };
    }
): Promise<void> {
    // Only send to Sentry in production with a valid DSN
    if (!IS_PRODUCTION || !SENTRY_DSN) {
        console.error("[Sentry] Error captured (dev mode):", error);
        return;
    }

    const dsnParts = parseDSN(SENTRY_DSN);
    if (!dsnParts) {
        console.error("[Sentry] Invalid DSN");
        return;
    }

    const event: SentryEvent = {
        level: "error",
        exception: {
            values: [
                {
                    type: error.name || "Error",
                    value: error.message,
                    stacktrace: error.stack
                        ? {
                            frames: error.stack.split("\n").slice(1).map((line) => {
                                const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
                                if (match) {
                                    return {
                                        function: match[1],
                                        filename: match[2],
                                        lineno: parseInt(match[3], 10),
                                        colno: parseInt(match[4], 10),
                                    };
                                }
                                return {
                                    function: line.trim(),
                                    filename: "unknown",
                                };
                            }),
                        }
                        : undefined,
                },
            ],
        },
        tags: context?.tags,
        extra: context?.extra,
        user: context?.user,
        environment: process.env.NODE_ENV || "production",
        timestamp: Date.now() / 1000,
    };

    try {
        const response = await fetch(
            `https://${dsnParts.host}/api/${dsnParts.projectId}/store/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsnParts.publicKey}`,
                },
                body: JSON.stringify(event),
            }
        );

        if (!response.ok) {
            console.error("[Sentry] Failed to send event:", response.status);
        }
    } catch (err) {
        console.error("[Sentry] Failed to send event:", err);
    }
}

/**
 * Capture a message and send it to Sentry
 */
export async function captureMessage(
    message: string,
    level: "info" | "warning" | "error" = "info",
    context?: {
        tags?: Record<string, string>;
        extra?: Record<string, unknown>;
        user?: { id?: string; email?: string; username?: string };
    }
): Promise<void> {
    if (!IS_PRODUCTION || !SENTRY_DSN) {
        console.log(`[Sentry] Message captured (dev mode) [${level}]:`, message);
        return;
    }

    const dsnParts = parseDSN(SENTRY_DSN);
    if (!dsnParts) {
        console.error("[Sentry] Invalid DSN");
        return;
    }

    const event: SentryEvent = {
        message,
        level,
        tags: context?.tags,
        extra: context?.extra,
        user: context?.user,
        environment: process.env.NODE_ENV || "production",
        timestamp: Date.now() / 1000,
    };

    try {
        await fetch(`https://${dsnParts.host}/api/${dsnParts.projectId}/store/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${dsnParts.publicKey}`,
            },
            body: JSON.stringify(event),
        });
    } catch (err) {
        console.error("[Sentry] Failed to send message:", err);
    }
}

/**
 * Wrap an async function with error capturing
 */
export function withErrorCapture<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context?: {
        tags?: Record<string, string>;
        extra?: Record<string, unknown>;
    }
): T {
    return (async (...args: Parameters<T>) => {
        try {
            return await fn(...args);
        } catch (error) {
            if (error instanceof Error) {
                await captureError(error, context);
            }
            throw error;
        }
    }) as T;
}
