/**
 * E2B Build System 2.0 - Next.js Sandbox Template Definition
 * 
 * This file defines our sandbox template as CODE following E2B v2 best practices.
 * 
 * Benefits:
 * - 14× faster builds when cached
 * - AI-friendly (can be parsed/modified by AI agents)
 * - Simpler DX - no separate e2b.toml or Dockerfile needed
 * - Templates expressed as TypeScript for type safety
 * 
 * References:
 * - https://e2b.dev/docs/template/how-it-works
 * - https://e2b.dev/docs/template/defining-template
 * - https://e2b.dev/docs/template/start-ready-command
 */

import { Template, waitForPort } from "e2b";

/**
 * Create a Next.js sandbox template using official create-next-app.
 * This template will be built once and then spawned instantly (~150ms) for each user.
 * 
 * The template includes:
 * - Node.js 24 (slim image for faster downloads)
 * - Next.js 15.5.4 + React 19
 * - TypeScript
 * - Tailwind CSS
 * - App Router with src directory
 * - All dependencies pre-installed via create-next-app
 * 
 * How it works:
 * 1. Template is built using create-next-app with all deps installed
 * 2. Next.js dev server is started with Turbopack
 * 3. We wait for port 3000 to be ready
 * 4. Sandbox is snapshotted with server running
 * 5. Users can spawn this snapshot in ~150ms with server already running
 */
export const nextjsTemplate = Template()
  // Start from official Node.js 24 slim image (smaller & faster)
  .fromNodeImage("24-slim")

  // Install curl and ca-certificates (needed for pnpm installer)
  .aptInstall("curl ca-certificates")

  // Install pnpm using the standalone script (works without corepack)
  .runCmd("curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=9.15.4 sh -")

  // Set working directory where we'll create the Next.js app
  .setWorkdir("/home/user/project")

  // Set environment variables - add pnpm to PATH
  .setEnvs({
    PATH: "/home/user/.local/share/pnpm:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
    NODE_ENV: "development",
    PORT: "3000",
    HOSTNAME: "0.0.0.0",
    NEXT_TELEMETRY_DISABLED: "1",
  })

  // Use create-next-app to scaffold the project with pnpm
  // This ensures we get the exact official Next.js setup
  // Export PATH inline so npx can find pnpm
  .runCmd(
    'PATH="/home/user/.local/share/pnpm:$PATH" npx create-next-app@15.5.4 . --app --src-dir --ts --tailwind --no-linter --import-alias "@/*" --use-pnpm --turbopack --yes'
  )

  // setStartCmd runs when a sandbox is SPAWNED, not during template build
  // This starts the Next.js dev server and waits for port 3000
  // Must set PATH inline since env vars aren't inherited by start command
  .setStartCmd(
    'PATH="/home/user/.local/share/pnpm:$PATH" pnpm run dev',
    waitForPort(3000) // Wait for Next.js to be ready on port 3000
  );

/**
 * Get the template alias for creating sandboxes.
 * 
 * In development, we use a separate alias to avoid conflicts.
 * In production, we use the main alias.
 */
export function getTemplateAlias(): string {
  const isDevelopment = process.env.NODE_ENV === "development";
  return isDevelopment ? "craft-nextjs-dev" : "craft-nextjs";
}

/**
 * Build options for the E2B template.
 * 
 * These control CPU, RAM, caching, and logging during the build process.
 * 
 * Reference: https://e2b.dev/docs/template/build
 */
export const buildOptions = {
  // CPU and RAM configuration
  // 2 vCPUs = faster builds, good for Next.js dev server
  cpuCount: 2,
  memoryMB: 4096, // 4GB RAM for Next.js dev server and builds

  // Skip cache if needed (normally false for faster builds)
  skipCache: false,

  // Custom build logger to see what's happening during template build
  onBuildLogs: (log: { message: string; level: string; timestamp: Date }) => {
    const prefix =
      log.level === "error" ? "❌" :
        log.level === "warn" ? "⚠️" :
          log.level === "info" ? "ℹ️" :
            "📦";

    const timestamp = log.timestamp
      ? `[${log.timestamp.toLocaleTimeString()}]`
      : "";

    console.log(`${prefix} ${timestamp} ${log.message}`);
  },
};
