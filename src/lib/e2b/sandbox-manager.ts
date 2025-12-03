/**
 * E2B Sandbox Manager
 * 
 * This service manages E2B sandboxes with intelligent reuse and auto-pause.
 * 
 * 🔑 CRITICAL POLICIES:
 * 1. Sandboxes are the SOURCE OF TRUTH for all code files
 * 2. Database files are BACKUP ONLY (used when sandboxes unavailable)
 * 3. WE NEVER KILL SANDBOXES - E2B auto-pause handles lifecycle
 * 4. ONE SANDBOX PER PROJECT - Created ONLY during project creation
 * 5. NEVER recreate sandbox for existing project - ALWAYS reconnect to existing
 * 
 * Features:
 * - One-to-one project-sandbox relationship (preserves all user data)
 * - Auto-pause after timeout (preserves all state indefinitely)
 * - Retry logic with exponential backoff (waits for sandbox to resume)
 * - Stateless design (no in-memory registry, works with multi-instance deployments)
 * - File operations (read/write)
 * - Command execution
 * 
 * Workflow:
 * 1. User opens existing project → Fetch sandboxId from database
 *    - If found → Retry connection with exponential backoff (up to 5 attempts)
 *    - If paused → Auto-resumes (~1 second, all files/memory intact)
 *    - If running → Reconnects (~500ms, all files intact)
 *    - If NotFoundError → Sandbox expired/deleted by E2B, throw error (don't recreate!)
 * 2. User creates NEW project → Create new sandbox with autoPause: true
 * 
 * Auto-Pause Feature (Beta):
 * - Sandboxes created with autoPause: true pause after 10min of inactivity
 * - Pausing preserves filesystem AND memory (processes, variables, etc.)
 * - Paused sandboxes are FREE during beta (no compute cost)
 * - Sandboxes expire after 30 days (E2B manages cleanup automatically)
 * 
 * Why One Sandbox Per Project:
 * - User's code and state always preserved
 * - No accidental data loss from recreating sandboxes
 * - Clear error when sandbox truly unavailable (contact support)
 * - Simpler mental model (one project = one sandbox)
 * 
 * Why We Never Kill or Recreate:
 * - Auto-pause is free and preserves all state
 * - E2B handles cleanup after 30 days automatically
 * - Manual killing or recreating loses user data unnecessarily
 * - Wait/retry is better than destroy/recreate
 * 
 * Data Flow:
 * - Sandbox → Source of truth (all edits happen here)
 * - Database → Stores sandboxId + backup files (for disaster recovery only)
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
    const { metadata = {}, envVars = {} } = options;

    // Get E2B template ID from environment
    const templateId = process.env.E2B_TEMPLATE_ID || undefined;

    console.log(`🚀 Creating E2B sandbox${templateId ? ` with template: ${templateId}` : ''}...`);

    // Retry logic for E2B API timeouts
    const maxRetries = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 1) {
                console.log(`🔄 Retry attempt ${attempt}/${maxRetries}...`);
            }

            // Create sandbox from Craft template (or default if not configured)
            // 🔑 CRITICAL: autoPause: true enables sandbox to pause after timeout instead of being killed
            // Default timeout is 10 minutes - sandbox will auto-pause and can be resumed with Sandbox.connect()
            const sandbox = templateId
                ? await Sandbox.betaCreate(templateId, {
                    metadata,
                    autoPause: true,
                    timeoutMs: options.timeoutMs || 10 * 60 * 1000 // 10 minutes default
                })
                : await Sandbox.betaCreate({
                    metadata,
                    autoPause: true,
                    timeoutMs: options.timeoutMs || 10 * 60 * 1000
                });

            console.log(`✅ Sandbox created: ${sandbox.sandboxId}`);
            if (templateId) {
                console.log(`⚡ Using optimized Craft template (Node.js + pnpm ready)`);
            }

            // Create sandbox info (lightweight, no state tracking needed)
            const sandboxInfo: SandboxInfo = {
                sandboxId: sandbox.sandboxId,
                sandbox,
            };

            return sandboxInfo;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Unknown error");

            // Check if it's a timeout error that we should retry
            const isTimeoutError = error instanceof Error &&
                (error.message.includes('timeout') ||
                    error.message.includes('CONNECT_TIMEOUT') ||
                    error.message.includes('fetch failed'));

            if (isTimeoutError && attempt < maxRetries) {
                console.warn(`⚠️ Attempt ${attempt} failed with timeout, retrying...`);
                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));
                continue;
            }

            // If not a timeout or last attempt, throw
            if (attempt === maxRetries) {
                console.error("❌ Failed to create sandbox after all retries:", lastError);
                throw new Error(`Sandbox creation failed after ${maxRetries} attempts: ${lastError.message}`);
            }
        }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error(`Sandbox creation failed: ${lastError?.message || "Unknown error"}`);
}

/**
 * Get or create a sandbox for a project
 * 
 * 🔑 CRITICAL POLICY:
 * - ONE SANDBOX PER PROJECT (created only during project creation)
 * - NEVER create new sandbox for existing project
 * - ALWAYS wait/retry for existing sandbox to resume
 * - If sandbox truly unavailable, throw error (don't recreate)
 * 
 * Workflow:
 * 1. Check database for existing sandboxId
 * 2. If found → Retry connection with exponential backoff
 * 3. If not found → Create new sandbox (only for brand new projects)
 * 
 * This ensures:
 * - User's code and state always preserved
 * - No accidental data loss from recreating sandboxes
 * - Clear error when sandbox truly unavailable
 * 
 * @param projectId - Project ID
 * @param options - Sandbox creation options
 * @returns Sandbox information
 * @throws Error if existing project's sandbox is unavailable
 */
export async function getOrCreateProjectSandbox(
    projectId: string,
    options: SandboxCreateOptions = {}
): Promise<SandboxInfo> {
    console.log(`🔍 [Project ${projectId}] Getting sandbox...`);

    // Check database for existing sandbox (paused or running)
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { sandboxId: true, sandboxPausedAt: true },
    });

    if (project?.sandboxId) {
        // 🔑 EXISTING PROJECT: NEVER create new sandbox, only reconnect with retries
        const isPaused = project.sandboxPausedAt !== null;
        console.log(`⏯️ [Project ${projectId}] ${isPaused ? 'Resuming paused' : 'Reconnecting to'} sandbox: ${project.sandboxId}`);

        // Retry logic for connection (sandbox may be resuming)
        const maxRetries = 5;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 1) {
                    const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Cap at 10s
                    console.log(`🔄 [Project ${projectId}] Retry ${attempt}/${maxRetries} after ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }

                const sandboxInfo = await resumeSandbox(project.sandboxId, projectId);
                console.log(`✅ [Project ${projectId}] Successfully ${isPaused ? 'resumed' : 'reconnected to'} existing sandbox (all files preserved)`);
                return sandboxInfo;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`⚠️ [Project ${projectId}] Attempt ${attempt}/${maxRetries} failed:`, lastError.message);

                // If it's a NotFoundError, sandbox was deleted/expired by E2B
                // Restore from R2 backup and create new sandbox
                if (lastError.message.includes('NotFoundError') || lastError.message.includes('not found')) {
                    console.error(`❌ [Project ${projectId}] Sandbox ${project.sandboxId} was deleted/expired by E2B`);
                    console.log(`🔄 [Project ${projectId}] Attempting to restore from R2 backup...`);

                    try {
                        // Import R2 backup service dynamically to avoid circular dependencies
                        const { restoreProjectFromExpiredSandbox } = await import('./r2-sandbox-restore');
                        const newSandboxInfo = await restoreProjectFromExpiredSandbox(projectId, project.sandboxId);
                        console.log(`✅ [Project ${projectId}] Successfully restored from R2 to new sandbox: ${newSandboxInfo.sandboxId}`);
                        return newSandboxInfo;
                    } catch (restoreError) {
                        console.error(`❌ [Project ${projectId}] Failed to restore from R2:`, restoreError);
                        throw new Error(
                            `Sandbox expired and restoration failed. ` +
                            `Original sandbox: ${project.sandboxId}. ` +
                            `Please contact support if this persists.`
                        );
                    }
                }

                // For other errors, continue retrying
                if (attempt === maxRetries) {
                    console.error(`❌ [Project ${projectId}] Failed to connect after ${maxRetries} attempts`);
                    throw new Error(
                        `Unable to connect to project sandbox after ${maxRetries} attempts. ` +
                        `The sandbox may be temporarily unavailable. Please try again in a few moments.`
                    );
                }
            }
        }

        // Should never reach here, but TypeScript needs it
        throw lastError || new Error("Failed to connect to sandbox");
    }

    // 🆕 NEW PROJECT ONLY: Create sandbox
    console.log(`🆕 [Project ${projectId}] New project - creating sandbox...`);
    const sandboxInfo = await createSandbox(options);
    sandboxInfo.projectId = projectId;

    // Save sandbox ID to database
    await prisma.project.update({
        where: { id: projectId },
        data: {
            sandboxId: sandboxInfo.sandboxId,
            sandboxPausedAt: null,
        },
    });

    console.log(`✅ [Project ${projectId}] Created sandbox: ${sandboxInfo.sandboxId}`);
    return sandboxInfo;
}

/**
 * Pause a sandbox while preserving state
 * 
 * Paused sandboxes keep all files and can be resumed quickly (~500ms-1s)
 * 
 * @param sandboxId - Sandbox ID to pause
 * @param projectId - Optional project ID to update database
 * @returns Success status
 */
export async function pauseSandbox(sandboxId: string, projectId?: string): Promise<boolean> {
    console.log(`⏸️ Pausing sandbox: ${sandboxId}`);

    try {
        // E2B's betaPause() stops billing
        await Sandbox.betaPause(sandboxId);

        // Update database if linked to project
        if (projectId) {
            await prisma.project.update({
                where: { id: projectId },
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
 * Resume a paused sandbox or reconnect to a running one
 * 
 * Uses Sandbox.connect() which automatically:
 * - Resumes paused sandboxes (~1 second)
 * - Reconnects to running sandboxes (~500ms)
 * - Resets timeout to default (10 minutes if autoPause enabled)
 * 
 * ⚠️ Important: Throws NotFoundError if sandbox was:
 * - Killed manually
 * - Expired (>30 days since creation)
 * - Deleted by E2B
 * 
 * In these cases, caller must create a new sandbox.
 * 
 * @param sandboxId - Sandbox ID to resume
 * @param projectId - Optional project ID to link
 * @param skipHealthCheck - Skip health check for brand new sandboxes
 * @returns Sandbox information
 * @throws Error if sandbox not found or not responding
 */
export async function resumeSandbox(
    sandboxId: string,
    projectId?: string,
    skipHealthCheck = false
): Promise<SandboxInfo> {
    console.log(`⏯️ Resuming sandbox: ${sandboxId}`);

    try {
        // E2B's connect() automatically resumes paused sandboxes
        // Throws NotFoundError if sandbox was killed or expired (>30 days)
        const sandbox = await Sandbox.connect(sandboxId);

        // ⚠️ CRITICAL: Verify sandbox is actually working after connect
        // Sometimes connect() succeeds but sandbox was killed by E2B
        // Use longer timeout for health check - sandbox might be resuming from pause
        if (!skipHealthCheck) {
            try {
                await sandbox.commands.run("echo 'alive'", { timeoutMs: 15000 }); // 15s for resume
                console.log(`✅ Sandbox ${sandboxId} is alive and responding`);
            } catch (testError) {
                console.error(`❌ Sandbox ${sandboxId} connected but not responding:`, testError);
                // Don't kill - let E2B auto-pause handle it
                // Just throw error so caller knows to create new sandbox
                throw new Error("Sandbox is not responding - may have been killed by E2B");
            }
        } else {
            console.log(`⏭️ Skipping health check for newly created sandbox`);
        }

        // Create sandbox info (lightweight, no state tracking)
        const sandboxInfo: SandboxInfo = {
            sandboxId: sandbox.sandboxId,
            sandbox,
            projectId,
        };

        // Update database if linked to project
        if (projectId) {
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
 * Pause a sandbox (preserves all state)
 * 
 * ℹ️ Note: We NEVER kill sandboxes. E2B auto-pause handles lifecycle.
 * 
 * Pausing preserves:
 * - All filesystem content
 * - All running processes
 * - All memory state
 * 
 * Paused sandboxes:
 * - Are free (no compute cost during beta)
 * - Can be resumed in ~1 second
 * - Expire after 30 days
 * 
 * @param sandboxId - Sandbox ID to pause
 * @returns Success status
 * @deprecated Use E2B's auto-pause instead. This function kept for explicit pause needs only.
 */
export async function pauseSandboxById(sandboxId: string): Promise<boolean> {
    console.log(`⏸️ Manually pausing sandbox: ${sandboxId}`);

    try {
        const sandbox = await Sandbox.connect(sandboxId);
        await sandbox.betaPause();

        console.log(`✅ Sandbox ${sandboxId} paused successfully`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to pause sandbox ${sandboxId}:`, error);
        return false;
    }
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Write a file to a sandbox
 * 
 * @param sandbox - Sandbox instance or sandbox ID
 * @param path - File path (relative to /home/user/project)
 * @param content - File content
 * @returns Success status
 */
export async function writeFileToSandbox(
    sandbox: Sandbox | string,
    path: string,
    content: string
): Promise<boolean> {
    try {
        const sandboxInstance = typeof sandbox === 'string' ? await Sandbox.connect(sandbox) : sandbox;
        const sandboxId = typeof sandbox === 'string' ? sandbox : sandbox.sandboxId;
        const fullPath = `/home/user/project/${path}`;
        await sandboxInstance.files.write(fullPath, content);
        console.log(`✅ Wrote file to sandbox: ${path}`);

        // 🔄 Auto-backup to R2 if sandbox is linked to a project
        try {
            // Get projectId from sandbox metadata or database lookup
            const project = await prisma.project.findFirst({
                where: { sandboxId },
                select: { id: true },
            });

            if (project) {
                const { backupProjectFile } = await import('./r2-project-backup');
                await backupProjectFile(project.id, path, content);
            }
        } catch (backupError) {
            // Don't fail the write operation if backup fails
            console.warn(`⚠️ Failed to backup file to R2 (write still succeeded):`, backupError);
        }

        return true;
    } catch (error) {
        console.error(`❌ Failed to write file ${path}:`, error);
        throw error;
    }
}

/**
 * Read a file from a sandbox
 * 
 * @param sandbox - Sandbox instance or sandbox ID
 * @param path - File path (relative to /home/user/project)
 * @returns File content
 */
export async function readFileFromSandbox(
    sandbox: Sandbox | string,
    path: string
): Promise<string> {
    try {
        const sandboxInstance = typeof sandbox === 'string' ? await Sandbox.connect(sandbox) : sandbox;
        const fullPath = `/home/user/project/${path}`;
        const content = await sandboxInstance.files.read(fullPath);
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
 * @param sandbox - Sandbox instance or sandbox ID
 * @param files - Array of file operations
 * @returns Success status
 */
export async function writeFilesToSandbox(
    sandbox: Sandbox | string,
    files: SandboxFileOperation[]
): Promise<boolean> {
    try {
        const sandboxInstance = typeof sandbox === 'string' ? await Sandbox.connect(sandbox) : sandbox;
        const sandboxId = typeof sandbox === 'string' ? sandbox : sandbox.sandboxId;

        await Promise.all(
            files.map(({ path, content }) => {
                if (!content) return Promise.resolve();
                const fullPath = `/home/user/project/${path}`;
                return sandboxInstance.files.write(fullPath, content);
            })
        );

        console.log(`✅ Wrote ${files.length} files to sandbox`);

        // 🔄 Auto-backup to R2 if sandbox is linked to a project
        try {
            const project = await prisma.project.findFirst({
                where: { sandboxId },
                select: { id: true },
            });

            if (project) {
                const { backupProjectFiles } = await import('./r2-project-backup');
                const filesToBackup = files
                    .filter(f => f.content)
                    .map(f => ({ path: f.path, content: f.content! }));

                if (filesToBackup.length > 0) {
                    await backupProjectFiles(project.id, filesToBackup);
                }
            }
        } catch (backupError) {
            console.warn(`⚠️ Failed to backup files to R2 (writes still succeeded):`, backupError);
        }

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
 * Keep sandbox alive by extending its timeout
 * 
 * This function extends the sandbox timeout to prevent auto-pause.
 * Useful for keeping sandboxes alive during active user sessions.
 * 
 * ⚠️ PERFORMANCE NOTE: When passing a sandbox ID string, this creates a new
 * connection to E2B API. For better performance, pass an existing Sandbox instance
 * when available, or use the cached connection approach.
 * 
 * @param sandbox - Sandbox instance or sandbox ID
 * @param timeoutMs - Timeout in milliseconds (default: 10 minutes)
 * @returns True if timeout was extended, false if failed
 */
export async function keepSandboxAlive(
    sandbox: Sandbox | string,
    timeoutMs = 10 * 60 * 1000
): Promise<boolean> {
    const sandboxId = typeof sandbox === 'string' ? sandbox : sandbox.sandboxId;

    try {
        let sandboxInstance: Sandbox;

        if (typeof sandbox === 'string') {
            // When only sandbox ID is provided, we need to connect
            // Use a shorter timeout for the connection attempt to fail fast
            const connectTimeoutMs = 15000; // 15 seconds

            const connectPromise = Sandbox.connect(sandbox);
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Connection timeout')), connectTimeoutMs);
            });

            sandboxInstance = await Promise.race([connectPromise, timeoutPromise]);
        } else {
            sandboxInstance = sandbox;
        }

        await sandboxInstance.setTimeout(timeoutMs);
        console.log(`⏰ Extended sandbox ${sandboxId} timeout by ${timeoutMs / 1000}s`);
        return true;
    } catch (error) {
        // Log at warn level - heartbeat failures are usually transient network issues
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Don't log full stack trace for common transient errors
        if (errorMessage.includes('timeout') || errorMessage.includes('CONNECT_TIMEOUT')) {
            console.warn(`⚠️ Heartbeat timeout for ${sandboxId} (transient - will retry on next interval)`);
        } else {
            console.warn(`⚠️ Failed to extend timeout for ${sandboxId}: ${errorMessage}`);
        }

        return false;
    }
}

/**
 * Execute a shell command in a sandbox
 * 
 * @param sandbox - Sandbox instance or sandbox ID
 * @param command - Shell command to execute
 * @param timeoutMs - Timeout in milliseconds
 * @returns Command result
 */
export async function executeSandboxCommand(
    sandbox: Sandbox | string,
    command: string,
    timeoutMs = 30000
): Promise<SandboxCommandResult> {
    try {
        const sandboxInstance = typeof sandbox === 'string' ? await Sandbox.connect(sandbox) : sandbox;

        const result = await sandboxInstance.commands.run(
            `cd /home/user/project && ${command}`,
            { timeoutMs }
        );

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
