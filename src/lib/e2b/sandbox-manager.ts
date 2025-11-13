/**
 * E2B Sandbox Manager - Phase 3
 * 
 * This service manages E2B sandboxes with pause/resume functionality.
 * 
 * Features:
 * - Default E2B sandboxes (no templates - agents scaffold projects on-demand)
 * - Pause/resume for cost optimization (paused sandboxes are FREE)
 * - Auto-cleanup of idle sandboxes
 * - File operations (read/write)
 * - Command execution
 * 
 * Workflow:
 * 1. Agent creates default E2B sandbox
 * 2. Agent uses tools to scaffold project (create-next-app, install deps, etc.)
 * 3. Sandbox paused after 5 min inactivity (FREE)
 * 4. Sandbox resumed when user returns (~500ms, all state preserved)
 * 5. Sandbox killed after 30 min of being paused (cleanup)
 */

import { Sandbox } from "e2b";
import { prisma } from "@/lib/db";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SandboxInfo {
    sandboxId: string;
    sandbox: Sandbox;
    projectId?: string;
    createdAt: Date;
    lastAccessed: Date;
    isPaused: boolean;
    isLocked?: boolean; // Prevent auto-pause during active operations
}

export interface SandboxCreateOptions {
    metadata?: Record<string, string>;
    timeoutMs?: number;
    envVars?: Record<string, string>;
}

export interface SandboxFileOperation {
    path: string;
    content?: string;
}

export interface SandboxCommandResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}

// ============================================================================
// GLOBAL SANDBOX REGISTRY
// ============================================================================

// In-memory registry of active sandboxes
// In production, this should be in Redis for multi-instance deployments
const sandboxRegistry = new Map<string, SandboxInfo>();

// Track sandbox by project ID for quick lookups
const projectSandboxMap = new Map<string, string>(); // projectId -> sandboxId

/**
 * Get the sandbox registry (for external use, e.g., in API routes)
 */
export function getSandboxRegistry() {
    return sandboxRegistry;
}

/**
 * Get the project-to-sandbox mapping
 */
export function getProjectSandboxMap() {
    return projectSandboxMap;
}

// ============================================================================
// SANDBOX LIFECYCLE MANAGEMENT
// ============================================================================

/**
 * Create a new E2B sandbox
 * 
 * Uses Craft's optimized template with Node.js 24 + pnpm pre-installed.
 * This provides ~150ms spawn time vs 60-90s for default sandbox + Node.js installation.
 * 
 * Template includes:
 * - Node.js 24 (slim variant)
 * - pnpm 9.15.4
 * - Empty /home/user/project directory
 * 
 * Agents will scaffold Next.js projects on-demand using tools.
 * 
 * @param options - Sandbox creation options
 * @returns Sandbox information
 */
export async function createSandbox(
    options: SandboxCreateOptions = {}
): Promise<SandboxInfo> {
    // Default to 10 minutes for sandboxes (long enough for project initialization)
    const { metadata = {}, timeoutMs = 600000, envVars = {} } = options;

    // Get E2B template ID from environment
    // Falls back to default sandbox if not configured
    const templateId = process.env.E2B_TEMPLATE_ID || undefined;

    console.log(`🚀 Creating E2B sandbox${templateId ? ` with template: ${templateId}` : ' (default)'}...`);

    try {
        // Create sandbox from Craft template (or default if not configured)
        const sandbox = templateId
            ? await Sandbox.create(templateId, {
                metadata,
                timeoutMs,
            })
            : await Sandbox.create({
                metadata,
                timeoutMs,
            });

        console.log(`✅ Sandbox created: ${sandbox.sandboxId}`);
        if (templateId) {
            console.log(`⚡ Using optimized Craft template (Node.js + pnpm ready)`);
        }

        // Create sandbox info
        const sandboxInfo: SandboxInfo = {
            sandboxId: sandbox.sandboxId,
            sandbox,
            createdAt: new Date(),
            lastAccessed: new Date(),
            isPaused: false,
        };

        // Register in global registry
        sandboxRegistry.set(sandbox.sandboxId, sandboxInfo);

        return sandboxInfo;
    } catch (error) {
        console.error("❌ Failed to create sandbox:", error);
        throw new Error(`Sandbox creation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Get or create a sandbox for a project
 * 
 * This function:
 * 1. Checks if project has an active sandbox in memory
 * 2. If not, checks database for paused sandbox ID
 * 3. If paused sandbox exists, resumes it
 * 4. Otherwise, creates new sandbox
 * 
 * @param projectId - Project ID
 * @param options - Sandbox creation options
 * @returns Sandbox information
 */
export async function getOrCreateProjectSandbox(
    projectId: string,
    options: SandboxCreateOptions = {}
): Promise<SandboxInfo> {
    console.log(`🔍 Getting/creating sandbox for project ${projectId}`);

    // 1. Check if sandbox already active in memory
    const existingSandboxId = projectSandboxMap.get(projectId);
    if (existingSandboxId) {
        const sandboxInfo = sandboxRegistry.get(existingSandboxId);
        if (sandboxInfo) {
            console.log(`✅ Using existing active sandbox: ${existingSandboxId}`);
            sandboxInfo.lastAccessed = new Date();
            return sandboxInfo;
        }
    }

    // 2. Check database for paused sandbox
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { sandboxId: true, sandboxPausedAt: true },
    });

    if (project?.sandboxId && project.sandboxPausedAt) {
        // Try to resume paused sandbox
        try {
            console.log(`⏯️ Resuming paused sandbox: ${project.sandboxId}`);
            const sandboxInfo = await resumeSandbox(project.sandboxId, projectId);
            console.log(`✅ Successfully resumed sandbox for project ${projectId}`);
            return sandboxInfo;
        } catch (error) {
            console.warn(`⚠️ Failed to resume sandbox ${project.sandboxId}, creating new one:`, error);
            // If resume fails, create new sandbox
        }
    }

    // 3. Create new sandbox
    const sandboxInfo = await createSandbox(options);
    sandboxInfo.projectId = projectId;

    // Link sandbox to project
    projectSandboxMap.set(projectId, sandboxInfo.sandboxId);

    // Save sandbox ID to database
    await prisma.project.update({
        where: { id: projectId },
        data: {
            sandboxId: sandboxInfo.sandboxId,
            sandboxPausedAt: null, // Clear paused timestamp
        },
    });

    console.log(`✅ Created new sandbox ${sandboxInfo.sandboxId} for project ${projectId}`);
    return sandboxInfo;
}

/**
 * Pause a sandbox to stop billing while preserving state
 * 
 * Paused sandboxes:
 * - Cost $0 (no compute charges)
 * - Keep all files and dependencies
 * - Can be resumed quickly (~500ms)
 * 
 * @param sandboxId - Sandbox ID to pause
 * @returns Success status
 */
export async function pauseSandbox(sandboxId: string): Promise<boolean> {
    console.log(`⏸️ Pausing sandbox: ${sandboxId}`);

    const sandboxInfo = sandboxRegistry.get(sandboxId);
    if (!sandboxInfo) {
        console.warn(`⚠️ Sandbox ${sandboxId} not found in registry`);
        return false;
    }

    try {
        // E2B's betaPause() stops billing
        await Sandbox.betaPause(sandboxId);

        // Update registry
        sandboxInfo.isPaused = true;
        sandboxInfo.lastAccessed = new Date();

        // Update database if linked to project
        if (sandboxInfo.projectId) {
            await prisma.project.update({
                where: { id: sandboxInfo.projectId },
                data: { sandboxPausedAt: new Date() },
            });
        }

        console.log(`✅ Sandbox ${sandboxId} paused successfully`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to pause sandbox ${sandboxId}:`, error);
        return false;
    }
}

/**
 * Resume a paused sandbox
 * 
 * @param sandboxId - Sandbox ID to resume
 * @param projectId - Optional project ID to link
 * @returns Sandbox information
 */
export async function resumeSandbox(
    sandboxId: string,
    projectId?: string
): Promise<SandboxInfo> {
    console.log(`⏯️ Resuming sandbox: ${sandboxId}`);

    try {
        // E2B's resumeSandbox() or connect() automatically resumes
        const sandbox = await Sandbox.connect(sandboxId);

        // Create/update sandbox info
        const sandboxInfo: SandboxInfo = {
            sandboxId: sandbox.sandboxId,
            sandbox,
            projectId,
            createdAt: new Date(), // We don't track original creation time
            lastAccessed: new Date(),
            isPaused: false,
        };

        // Register in global registry
        sandboxRegistry.set(sandboxId, sandboxInfo);

        // Link to project if provided
        if (projectId) {
            projectSandboxMap.set(projectId, sandboxId);

            // Update database
            await prisma.project.update({
                where: { id: projectId },
                data: { sandboxPausedAt: null },
            });
        }

        console.log(`✅ Sandbox ${sandboxId} resumed successfully`);
        return sandboxInfo;
    } catch (error) {
        console.error(`❌ Failed to resume sandbox ${sandboxId}:`, error);
        throw new Error(`Failed to resume sandbox: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Kill a sandbox permanently (destroys all state)
 * 
 * Use this only when:
 * - Sandbox is corrupted
 * - Project is deleted
 * - Long-term storage not needed
 * 
 * @param sandboxId - Sandbox ID to kill
 * @returns Success status
 */
export async function killSandbox(sandboxId: string): Promise<boolean> {
    console.log(`💀 Killing sandbox: ${sandboxId}`);

    const sandboxInfo = sandboxRegistry.get(sandboxId);

    try {
        if (sandboxInfo?.sandbox) {
            await sandboxInfo.sandbox.kill();
        } else {
            // Try to kill by ID even if not in registry
            const sandbox = await Sandbox.connect(sandboxId);
            await sandbox.kill();
        }

        // Remove from registry and project map
        sandboxRegistry.delete(sandboxId);
        if (sandboxInfo?.projectId) {
            projectSandboxMap.delete(sandboxInfo.projectId);
        }

        console.log(`✅ Sandbox ${sandboxId} killed successfully`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to kill sandbox ${sandboxId}:`, error);
        return false;
    }
}

/**
 * Keep a sandbox alive by extending its timeout
 * 
 * Call this during long operations to prevent timeout.
 * 
 * @param sandboxId - Sandbox ID
 * @param timeoutMs - Additional timeout in milliseconds (default: 10 minutes)
 */
export async function keepSandboxAlive(sandboxId: string, timeoutMs: number = 600000): Promise<void> {
    const sandboxInfo = sandboxRegistry.get(sandboxId);
    if (!sandboxInfo) {
        console.warn(`⚠️ Cannot keep alive: Sandbox ${sandboxId} not found`);
        return;
    }

    try {
        await sandboxInfo.sandbox.setTimeout(timeoutMs);
        sandboxInfo.lastAccessed = new Date();
        console.log(`⏰ Extended sandbox ${sandboxId} timeout by ${timeoutMs / 1000}s`);
    } catch (error) {
        console.warn(`⚠️ Failed to extend timeout for ${sandboxId}:`, error);
    }
}

/**
 * Lock a sandbox to prevent auto-pause during active operations
 * 
 * Use this during AI code generation, long builds, etc.
 * MUST call unlockSandbox when done!
 * 
 * @param sandboxId - Sandbox ID
 */
export function lockSandbox(sandboxId: string): void {
    const sandboxInfo = sandboxRegistry.get(sandboxId);
    if (sandboxInfo) {
        sandboxInfo.isLocked = true;
        sandboxInfo.lastAccessed = new Date();
        console.log(`🔒 Locked sandbox ${sandboxId} (auto-pause disabled)`);
    }
}

/**
 * Unlock a sandbox to allow auto-pause
 * 
 * Call this after AI code generation or long operations complete.
 * 
 * @param sandboxId - Sandbox ID
 */
export function unlockSandbox(sandboxId: string): void {
    const sandboxInfo = sandboxRegistry.get(sandboxId);
    if (sandboxInfo) {
        sandboxInfo.isLocked = false;
        sandboxInfo.lastAccessed = new Date();
        console.log(`🔓 Unlocked sandbox ${sandboxId} (auto-pause enabled)`);
    }
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Write a file to a sandbox
 * 
 * @param sandboxId - Sandbox ID
 * @param path - File path (relative to /home/user/project)
 * @param content - File content
 * @returns Success status
 */
export async function writeFileToSandbox(
    sandboxId: string,
    path: string,
    content: string
): Promise<boolean> {
    const sandboxInfo = sandboxRegistry.get(sandboxId);
    if (!sandboxInfo) {
        throw new Error(`Sandbox ${sandboxId} not found`);
    }

    try {
        const fullPath = `/home/user/project/${path}`;
        await sandboxInfo.sandbox.files.write(fullPath, content);
        sandboxInfo.lastAccessed = new Date();
        console.log(`✅ Wrote file to sandbox: ${path}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to write file ${path}:`, error);
        throw error;
    }
}

/**
 * Read a file from a sandbox
 * 
 * @param sandboxId - Sandbox ID
 * @param path - File path (relative to /home/user/project)
 * @returns File content
 */
export async function readFileFromSandbox(
    sandboxId: string,
    path: string
): Promise<string> {
    const sandboxInfo = sandboxRegistry.get(sandboxId);
    if (!sandboxInfo) {
        throw new Error(`Sandbox ${sandboxId} not found`);
    }

    try {
        const fullPath = `/home/user/project/${path}`;
        const content = await sandboxInfo.sandbox.files.read(fullPath);
        sandboxInfo.lastAccessed = new Date();
        console.log(`✅ Read file from sandbox: ${path} (${content.length} bytes)`);
        return content;
    } catch (error) {
        console.error(`❌ Failed to read file ${path}:`, error);
        throw error;
    }
}

/**
 * Write multiple files to a sandbox
 * 
 * @param sandboxId - Sandbox ID
 * @param files - Array of file operations
 * @returns Success status
 */
export async function writeFilesToSandbox(
    sandboxId: string,
    files: SandboxFileOperation[]
): Promise<boolean> {
    const sandboxInfo = sandboxRegistry.get(sandboxId);
    if (!sandboxInfo) {
        throw new Error(`Sandbox ${sandboxId} not found`);
    }

    try {
        await Promise.all(
            files.map(({ path, content }) => {
                if (!content) return Promise.resolve();
                const fullPath = `/home/user/project/${path}`;
                return sandboxInfo.sandbox.files.write(fullPath, content);
            })
        );

        sandboxInfo.lastAccessed = new Date();
        console.log(`✅ Wrote ${files.length} files to sandbox`);
        return true;
    } catch (error) {
        console.error("❌ Failed to write files:", error);
        throw error;
    }
}

// ============================================================================
// COMMAND EXECUTION
// ============================================================================

/**
 * Execute a shell command in a sandbox
 * 
 * @param sandboxId - Sandbox ID
 * @param command - Shell command to execute
 * @param timeoutMs - Timeout in milliseconds
 * @returns Command result
 */
export async function executeSandboxCommand(
    sandboxId: string,
    command: string,
    timeoutMs = 30000
): Promise<SandboxCommandResult> {
    const sandboxInfo = sandboxRegistry.get(sandboxId);
    if (!sandboxInfo) {
        throw new Error(`Sandbox ${sandboxId} not found`);
    }

    try {
        const result = await sandboxInfo.sandbox.commands.run(
            `cd /home/user/project && ${command}`,
            { timeoutMs }
        );

        sandboxInfo.lastAccessed = new Date();

        return {
            exitCode: result.exitCode,
            stdout: result.stdout || "",
            stderr: result.stderr || "",
        };
    } catch (error) {
        console.error(`❌ Command execution failed:`, error);
        throw error;
    }
}

// ============================================================================
// AUTO-CLEANUP & MAINTENANCE
// ============================================================================

/**
 * Configuration for sandbox cleanup
 */
const CLEANUP_CONFIG = {
    // Pause sandboxes after 5 minutes of inactivity
    PAUSE_AFTER_MS: 5 * 60 * 1000,
    // Kill sandboxes after 30 minutes of being paused
    KILL_AFTER_PAUSED_MS: 30 * 60 * 1000,
    // Run cleanup every 1 minute
    CLEANUP_INTERVAL_MS: 60 * 1000,
};

/**
 * Start automatic sandbox cleanup
 * 
 * This runs in the background and:
 * 1. Pauses inactive sandboxes (saves $$)
 * 2. Kills long-paused sandboxes (frees resources)
 */
export function startSandboxCleanup() {
    console.log("🧹 Starting automatic sandbox cleanup...");

    setInterval(async () => {
        const now = new Date();
        let pausedCount = 0;
        let killedCount = 0;

        for (const [sandboxId, info] of sandboxRegistry.entries()) {
            // Skip locked sandboxes (active AI operations)
            if (info.isLocked) {
                continue;
            }

            const idleTime = now.getTime() - info.lastAccessed.getTime();

            // Pause inactive sandboxes
            if (!info.isPaused && idleTime > CLEANUP_CONFIG.PAUSE_AFTER_MS) {
                const paused = await pauseSandbox(sandboxId);
                if (paused) pausedCount++;
            }

            // Kill long-paused sandboxes
            if (info.isPaused && idleTime > CLEANUP_CONFIG.KILL_AFTER_PAUSED_MS) {
                const killed = await killSandbox(sandboxId);
                if (killed) killedCount++;
            }
        }

        if (pausedCount > 0 || killedCount > 0) {
            console.log(
                `🧹 Cleanup: ${pausedCount} paused, ${killedCount} killed, ${sandboxRegistry.size} active`
            );
        }
    }, CLEANUP_CONFIG.CLEANUP_INTERVAL_MS);
}

// Start cleanup on module load
if (typeof global !== "undefined") {
    startSandboxCleanup();
}
