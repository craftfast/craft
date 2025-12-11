/**
 * Application Version Configuration
 *
 * Centralized version management for the Craft application.
 * Version is automatically read from package.json via Next.js env.
 */

export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0";

type AppStage = "alpha" | "beta" | "rc" | "stable";
export const APP_STAGE: AppStage = "beta";

export const VERSION_DISPLAY = `v${APP_VERSION}`;
export const FULL_VERSION_DISPLAY = `v${APP_VERSION} ${APP_STAGE}`;

// Helper to check if pre-release
const checkIsPreRelease = (stage: AppStage): boolean => stage !== "stable";

/**
 * Version metadata for display and tracking
 */
export const VERSION_INFO = {
    version: APP_VERSION,
    stage: APP_STAGE,
    displayVersion: VERSION_DISPLAY,
    fullDisplayVersion: FULL_VERSION_DISPLAY,
    isPreRelease: checkIsPreRelease(APP_STAGE),
} as const;
