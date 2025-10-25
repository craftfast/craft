import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class", // Changed from "media" to "class" for manual theme control
    theme: {
        extend: {
            colors: {
                // Primary theme colors using CSS variables
                background: "var(--color-background)",
                foreground: "var(--color-foreground)",
                muted: "var(--color-muted)",
                accent: "var(--color-accent)",
                border: "var(--color-border)",
                surface: "var(--color-surface)",
                "surface-hover": "var(--color-surface-hover)",

                // Additional semantic colors
                primary: "var(--color-primary)",
                secondary: "var(--color-secondary)",
                success: "var(--color-success)",
                warning: "var(--color-warning)",
                error: "var(--color-error)",
                info: "var(--color-info)",
            },
            borderRadius: {
                sm: "var(--radius-sm)",
                md: "var(--radius-md)",
                lg: "var(--radius-lg)",
                xl: "var(--radius-xl)",
                "2xl": "var(--radius-2xl)",
            },
            boxShadow: {
                sm: "var(--shadow-sm)",
                md: "var(--shadow-md)",
                lg: "var(--shadow-lg)",
                xl: "var(--shadow-xl)",
            },
            fontFamily: {
                sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
                mono: ["var(--font-geist-mono)", "monospace"],
            },
        },
    },
    plugins: [],
};

export default config;
