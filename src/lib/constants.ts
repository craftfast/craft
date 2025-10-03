/**
 * Application constants and configuration
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
    GITHUB_REPO: "https://github.com/craftdottech/craft",
    TWITTER_CRAFT: "https://x.com/craftdottech",
    TWITTER_SUDHEER: "https://x.com/sudheerdotai",
} as const;

// App metadata
export const APP = {
    NAME: "craft",
    DOMAIN: ".tech",
    FULL_NAME: "craft.tech",
} as const;