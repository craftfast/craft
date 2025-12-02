/**
 * Application constants and configuration
 * 
 * Single source of truth for app-wide constants.
 * All hardcoded values should be defined here.
 */

// Asset paths
export const ASSETS = {
    BACKGROUNDS: {
        HEXAGONS_PATTERN: "/hexagons-pattern-background.jpg",
    },
    LOGOS: {
        LOGO_PNG: "/logo.png",
        LOGO_SVG: "/logo.svg",
    },
    ICONS: {
        NEXT_SVG: "/next.svg",
        VERCEL_SVG: "/vercel.svg",
        FILE_SVG: "/file.svg",
        GLOBE_SVG: "/globe.svg",
        WINDOW_SVG: "/window.svg",
    },
} as const;

// External links
export const LINKS = {
    GITHUB_REPO: "https://github.com/craftfast/craft",
    TWITTER_CRAFT: "https://x.com/craftdotfast",
    TWITTER_SUDHEER: "https://x.com/sudheerdotai",
    DISCORD: "https://discord.gg/YvPKxcCV",
    YOUTUBE: "https://www.youtube.com/channel/UCImqQGc8t8t0koAsw7pscnQ",
} as const;

// App metadata
export const APP = {
    NAME: "craft",
    DOMAIN: ".fast",
    FULL_NAME: "craft.fast",
} as const;

// Contact emails - centralized for easy updates
export const EMAILS = {
    SUPPORT: "support@craft.fast",
    SALES: "sales@craft.fast",
    LEGAL: "legal@craft.fast",
    HELLO: "hello@craft.fast",
    PRIVACY: "privacy@craft.fast",
    DPO: "dpo@craft.fast",
    NOREPLY: "noreply@craft.fast",
} as const;

// API configuration
export const API = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || `https://api.${APP.FULL_NAME}`,
} as const;

// Rate limiting defaults (requests per minute)
export const RATE_LIMITS = {
    CHAT: 20,
    API: 100,
    SANDBOX: 10,
    PAYMENT: 10,
    AUTH: 5,
} as const;

// Timeout defaults (in milliseconds)
export const TIMEOUTS = {
    SANDBOX_DEFAULT: 10 * 60 * 1000, // 10 minutes
    COMMAND_SHORT: 30 * 1000, // 30 seconds
    COMMAND_MEDIUM: 60 * 1000, // 1 minute
    COMMAND_LONG: 180 * 1000, // 3 minutes
    INSTALL_COMMAND: 300 * 1000, // 5 minutes
    BUILD_COMMAND: 180 * 1000, // 3 minutes
    SCREENSHOT: 10 * 1000, // 10 seconds
} as const;

// Usage limits (for display/reference - actual limits are pay-as-you-go)
export const USAGE_LIMITS = {
    STORAGE_BYTES: 5 * 1024 * 1024 * 1024, // 5GB
    BUILDS_PER_MONTH: 100,
    API_CALLS_PER_MONTH: 10000,
    BANDWIDTH_BYTES: 100 * 1024 * 1024 * 1024, // 100GB
} as const;