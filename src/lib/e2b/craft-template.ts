/**
 * Craft E2B Template Builder
 * 
 * This creates an optimized E2B template with:
 * - Node.js 24 (slim variant)
 * - pnpm 9.15.4 pre-installed
 * - Empty /home/user/project directory
 * 
 * Benefits:
 * - Sandbox spawns in ~150ms (vs 60-90s for default + installing Node.js/pnpm)
 * - AI can immediately run create-next-app without waiting for Node.js installation
 * - Flexible for any framework (Next.js, Vite, Remix, SvelteKit, etc.)
 * 
 * What's NOT included (intentionally):
 * - No Next.js pre-installed (AI scaffolds on-demand)
 * - No dependencies (AI installs based on user's request)
 * - No dev server running (AI starts it when ready)
 * 
 * This gives AI full control over project initialization while keeping
 * sandbox spawn times fast.
 */

import { Template } from "e2b";

/**
 * Build the Craft E2B template
 * 
 * This template is the foundation for all Craft projects.
 * It provides a clean Node.js + pnpm environment ready for
 * the AI to scaffold any type of project.
 */
export function buildCraftTemplate() {
    return Template()
        // Start with Node.js 24 slim (Ubuntu-based, minimal image)
        .fromNodeImage("24-slim")

        // Install essential packages for pnpm installer
        .aptInstall([
            "curl",           // For downloading pnpm installer
            "ca-certificates" // For HTTPS connections
        ])

        // Install pnpm 9.15.4 (latest stable)
        .runCmd(
            "curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=9.15.4 sh -"
        )

        // Set working directory to project root
        .setWorkdir("/home/user/project")

        // Configure environment variables
        .setEnvs({
            // Add pnpm to PATH
            PATH: "/home/user/.local/share/pnpm:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",

            // Node.js environment
            NODE_ENV: "development",

            // Disable Next.js telemetry
            NEXT_TELEMETRY_DISABLED: "1",

            // Turbopack settings (faster builds)
            TURBOPACK_ENABLED: "1",
        });

    // Template is now ready!
    // When spawned:
    // ✅ Node.js 24 available
    // ✅ pnpm 9.15.4 ready
    // ✅ /home/user/project is empty (AI scaffolds projects here)
    // ✅ Environment configured for development
}

/**
 * Template metadata for E2B dashboard
 */
export const craftTemplateMetadata = {
    name: "craft-dev-env",
    description: "Craft development environment with Node.js 24 and pnpm",
    version: "1.0.0",
    tags: ["nodejs", "pnpm", "nextjs", "react", "typescript"],
};

/**
 * Build and export the template for CLI usage
 * 
 * Usage:
 * ```bash
 * # Build for development
 * pnpm e2b:build:dev
 * 
 * # Build for production
 * pnpm e2b:build:prod
 * ```
 */
export const craftTemplate = buildCraftTemplate();
