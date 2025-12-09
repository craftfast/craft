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
 */

import { PostHog } from "posthog-node";

// Singleton PostHog client for server-side usage
let posthogClient: PostHog | null = null;

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
    }

    return posthogClient;
}

/**
 * Shutdown the PostHog client gracefully
 * Call this when the server is shutting down
 */
export async function shutdownPostHog(): Promise<void> {
    if (posthogClient) {
        await posthogClient.shutdown();
        posthogClient = null;
    }
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
        posthogPrivacyMode: false, // We want to capture inputs/outputs for debugging
    };
}

// Re-export withTracing from @posthog/ai for convenience
export { withTracing } from "@posthog/ai";
