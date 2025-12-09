import { posthog } from "@/components/providers/PostHogProvider";

/**
 * PostHog Analytics Utilities
 *
 * IMPORTANT: Analytics only runs in PRODUCTION.
 * Development data is NOT tracked to keep analytics clean.
 *
 * Usage:
 * - Import these functions to track events throughout the app
 * - User identification happens automatically when users sign in
 *
 * FEATURES ENABLED (Production Only):
 * ✅ Product Analytics - Page views, custom events
 * ✅ Session Replay - Record user sessions
 * ✅ Error Tracking - Capture JS errors automatically
 * ✅ Heatmaps - Click tracking and scroll depth
 * ✅ Feature Flags - A/B testing and feature rollouts
 * ✅ LLM Analytics - AI/LLM usage tracking (via @posthog/ai)
 */

// Check if we're in production
const isProduction = process.env.NODE_ENV === "production";

/**
 * Identify a user in PostHog
 * Call this when a user signs in
 */
export function identifyUser(
    userId: string,
    properties?: {
        email?: string;
        name?: string;
        plan?: string;
        [key: string]: unknown;
    }
) {
    if (typeof window === "undefined" || !isProduction) return;

    posthog.identify(userId, properties);

    // Also set as a group for company-level analytics
    if (properties?.plan) {
        posthog.group("plan", properties.plan);
    }
}

/**
 * Reset user identity (call on sign out)
 */
export function resetUser() {
    if (typeof window === "undefined" || !isProduction) return;

    posthog.reset();
}

/**
 * Track a custom event
 */
export function trackEvent(
    eventName: string,
    properties?: Record<string, unknown>
) {
    if (typeof window === "undefined" || !isProduction) return;

    posthog.capture(eventName, properties);
}

/**
 * Set user properties without sending an event
 */
export function setUserProperties(properties: Record<string, unknown>) {
    if (typeof window === "undefined" || !isProduction) return;

    posthog.setPersonProperties(properties);
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(
    featureName: string,
    properties?: Record<string, unknown>
) {
    trackEvent("feature_used", {
        feature: featureName,
        ...properties,
    });
}

/**
 * Check if a feature flag is enabled
 * Note: Returns false in development for safety
 */
export function isFeatureEnabled(flagName: string): boolean {
    if (typeof window === "undefined" || !isProduction) return false;
    return posthog.isFeatureEnabled(flagName) ?? false;
}

/**
 * Get feature flag value (for multivariate flags)
 * Note: Returns undefined in development
 */
export function getFeatureFlag(flagName: string): string | boolean | undefined {
    if (typeof window === "undefined" || !isProduction) return undefined;
    return posthog.getFeatureFlag(flagName);
}

/**
 * Capture an exception/error
 */
export function captureException(
    error: Error,
    context?: Record<string, unknown>
) {
    if (typeof window === "undefined" || !isProduction) return;

    posthog.capture("$exception", {
        $exception_message: error.message,
        $exception_type: error.name,
        $exception_stack_trace: error.stack,
        ...context,
    });
}

// Pre-defined event trackers for common actions

export const analytics = {
    // Project events
    projectCreated: (projectId: string, projectName: string) =>
        trackEvent("project_created", { projectId, projectName }),

    projectOpened: (projectId: string) =>
        trackEvent("project_opened", { projectId }),

    projectDeleted: (projectId: string) =>
        trackEvent("project_deleted", { projectId }),

    // Chat events
    messageSent: (projectId: string, messageLength: number) =>
        trackEvent("message_sent", { projectId, messageLength }),

    // AI events
    aiResponseReceived: (
        model: string,
        tokensUsed: number,
        responseTime: number
    ) =>
        trackEvent("ai_response_received", { model, tokensUsed, responseTime }),

    // Subscription events
    subscriptionStarted: (plan: string) =>
        trackEvent("subscription_started", { plan }),

    subscriptionCancelled: (plan: string) =>
        trackEvent("subscription_cancelled", { plan }),

    creditsAdded: (amount: number) => trackEvent("credits_added", { amount }),

    // Feature flags
    featureFlagEvaluated: (flagName: string, value: boolean | string) =>
        trackEvent("feature_flag_evaluated", { flagName, value }),

    // Errors (use captureException for Error objects)
    errorOccurred: (errorType: string, errorMessage: string, context?: string) =>
        trackEvent("error_occurred", { errorType, errorMessage, context }),

    // User actions
    signedUp: (method: string) => trackEvent("signed_up", { method }),

    signedIn: (method: string) => trackEvent("signed_in", { method }),

    signedOut: () => trackEvent("signed_out"),

    // Deployment events
    projectDeployed: (projectId: string, platform: string) =>
        trackEvent("project_deployed", { projectId, platform }),

    // Preview events
    previewStarted: (projectId: string) =>
        trackEvent("preview_started", { projectId }),

    previewError: (projectId: string, error: string) =>
        trackEvent("preview_error", { projectId, error }),
};
