/**
 * PostHog Server-Side Analytics for LLM Tracking
 *
 * This module provides server-side PostHog integration for tracking
 * AI/LLM usage across the application using the @posthog/ai SDK.
 *
 * IMPORTANT: Only sends data in PRODUCTION to keep analytics clean.
 * Development data is NOT tracked.
 *
 * Features:
 * - Automatic LLM generation tracking with withTracing wrapper
 * - Token usage and cost tracking
 * - Latency measurement
 * - User attribution (distinct ID)
 * - Custom properties for filtering
 * - Automatic cleanup on process exit
 */

import { PostHog } from "posthog-node";
import { withTracing } from "@posthog/ai";

// Singleton PostHog client for server-side usage
let posthogClient: PostHog | null = null;
let cleanupRegistered = false;

// Only enable PostHog in production
const isProduction = process.env.NODE_ENV === "production";

/**
 * Get or create the PostHog server client
 * Returns null in development to prevent polluting production analytics
 */
export function getPostHogClient(): PostHog | null {
    // Don't track in development
    if (!isProduction) {
        return null;
    }

    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host =
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    if (!apiKey) {
        return null;
    }

    if (!posthogClient) {
        posthogClient = new PostHog(apiKey, {
            host,
            // Flush events every 10 seconds or when 20 events are queued
            flushAt: 20,
            flushInterval: 10000,
        });

        // Register automatic cleanup on process exit (only once)
        if (!cleanupRegistered) {
            cleanupRegistered = true;
            registerCleanupHandlers();
        }
    }

    return posthogClient;
}

/**
 * Shutdown the PostHog client gracefully
 * Ensures all queued events are flushed before shutdown.
 *
 * This is called automatically on process exit, but you can call it manually
 * if you need to ensure events are flushed at a specific point.
 *
 * @example
 * // In a cleanup handler or API route that needs to ensure events are sent
 * await shutdownPostHog();
 */
export async function shutdownPostHog(): Promise<void> {
    if (posthogClient) {
        await posthogClient.shutdown();
        posthogClient = null;
    }
}

/**
 * Register cleanup handlers for graceful shutdown
 * Ensures PostHog events are flushed when the process exits
 */
function registerCleanupHandlers(): void {
    const cleanup = async () => {
        await shutdownPostHog();
    };

    // Handle various exit signals
    process.on("beforeExit", cleanup);
    process.on("SIGINT", async () => {
        await cleanup();
        process.exit(0);
    });
    process.on("SIGTERM", async () => {
        await cleanup();
        process.exit(0);
    });
}

/**
 * Options for wrapping AI models with PostHog tracing
 */
export interface PostHogTracingOptions {
    /** User ID for attribution */
    posthogDistinctId?: string;
    /** Custom trace ID for grouping related generations */
    posthogTraceId?: string;
    /** Custom properties to attach to LLM events */
    posthogProperties?: Record<string, unknown>;
    /** Privacy mode - if true, inputs/outputs won't be captured */
    posthogPrivacyMode?: boolean;
    /** Group analytics (e.g., by company or project) */
    posthogGroups?: Record<string, string>;
}

/**
 * Default tracing options factory
 * Creates common options for LLM tracking
 */
export function createTracingOptions(
    userId?: string,
    projectId?: string,
    additionalProps?: Record<string, unknown>
): PostHogTracingOptions {
    return {
        posthogDistinctId: userId,
        posthogTraceId: projectId ? `project_${projectId}` : undefined,
        posthogProperties: {
            projectId,
            source: "craft",
            ...additionalProps,
        },
        posthogPrivacyMode: true, // Privacy mode ON: LLM inputs/outputs NOT captured to protect user data
    };
}

/**
 * Wrap a model with PostHog tracing
 *
 * This is a convenience function that handles the common pattern of:
 * 1. Getting the PostHog client
 * 2. Checking if it's available (returns null in dev)
 * 3. Wrapping the model with tracing if available, or returning the base model
 *
 * @param baseModel - The AI model instance to wrap
 * @param userId - User ID for attribution
 * @param projectId - Project ID for grouping
 * @param additionalProps - Additional properties to track (modelId, agentType, etc.)
 * @returns The traced model (in production) or the base model (in development)
 *
 * @example
 * const model = getTracedModel(xai("grok-4-fast"), userId, projectId, {
 *   modelId: "x-ai/grok-4-fast",
 *   agentType: "orchestrator",
 * });
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTracedModel<T>(
    baseModel: T,
    userId?: string,
    projectId?: string,
    additionalProps?: Record<string, unknown>
): T {
    const posthogClient = getPostHogClient();

    if (!posthogClient) {
        return baseModel;
    }

    // withTracing expects LanguageModelV2 but we use a generic to preserve the original type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return withTracing(baseModel as any, posthogClient, {
        ...createTracingOptions(userId, projectId, additionalProps),
    }) as T;
}

// Re-export withTracing from @posthog/ai for convenience
export { withTracing } from "@posthog/ai";
