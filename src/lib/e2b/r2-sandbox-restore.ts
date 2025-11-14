/**
 * R2 Sandbox Restoration Service
 * 
 * Handles restoration of project files from R2 when sandboxes expire.
 * E2B sandboxes expire after 30 days even when paused - this service
 * ensures seamless recovery by creating a new sandbox and restoring
 * all files from R2 backup.
 * 
 * Workflow:
 * 1. Detect expired sandbox (NotFoundError on connect)
 * 2. Create new sandbox with same configuration
 * 3. Restore all project files from R2 backup
 * 4. Update database with new sandboxId
 * 5. Return new sandbox ready to use
 */

import { prisma } from "@/lib/db";
import { restoreProjectFiles, hasBackup } from "./r2-project-backup";
import { createSandbox, writeFilesToSandbox, type SandboxInfo } from "./sandbox-manager";

// ============================================================================
// RESTORATION FUNCTIONS
// ============================================================================

/**
 * Restore a project from expired sandbox using R2 backup
 * 
 * This is called when:
 * - Sandbox expired (>30 days old)
 * - Sandbox was manually killed
 * - Sandbox deleted by E2B
 * 
 * Steps:
 * 1. Check if R2 backup exists
 * 2. Create new sandbox
 * 3. Restore all files from R2
 * 4. Update database with new sandboxId
 * 
 * @param projectId - Project ID
 * @param expiredSandboxId - Old sandbox ID that expired
 * @returns New sandbox information with all files restored
 */
export async function restoreProjectFromExpiredSandbox(
    projectId: string,
    expiredSandboxId: string
): Promise<SandboxInfo> {
    console.log(`🔄 [Project ${projectId}] Starting restoration from expired sandbox ${expiredSandboxId}...`);

    try {
        // 1. Check if R2 backup exists
        const backupExists = await hasBackup(projectId);

        if (!backupExists) {
            console.warn(`⚠️ [Project ${projectId}] No R2 backup found, checking database...`);

            // Fallback to database files if no R2 backup
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { codeFiles: true },
            });

            if (!project || !project.codeFiles) {
                throw new Error(
                    `No backup found for project. Both R2 and database backups are empty. ` +
                    `The project may have been newly created or files were never saved.`
                );
            }

            // Parse codeFiles JSON to array
            const codeFilesData = project.codeFiles as any;
            const dbFiles = Object.entries(codeFilesData).map(([path, content]) => ({
                path,
                content: content as string | null,
            }));

            if (dbFiles.length === 0) {
                throw new Error(
                    `No backup found for project. Both R2 and database backups are empty. ` +
                    `The project may have been newly created or files were never saved.`
                );
            }

            console.log(`ℹ️ [Project ${projectId}] Using ${dbFiles.length} files from database as fallback`);

            // Restore using database files
            return await restoreProjectFromDatabase(projectId, expiredSandboxId, dbFiles);
        }

        // 2. Restore all files from R2
        console.log(`📥 [Project ${projectId}] Restoring files from R2...`);
        const files = await restoreProjectFiles(projectId);

        if (files.length === 0) {
            throw new Error(`R2 backup exists but contains no files`);
        }

        console.log(`✅ [Project ${projectId}] Found ${files.length} files in R2 backup`);

        // 3. Create new sandbox
        console.log(`🆕 [Project ${projectId}] Creating new sandbox...`);
        const sandboxInfo = await createSandbox({
            metadata: {
                projectId,
                restoredFrom: expiredSandboxId,
                restoredAt: new Date().toISOString(),
            },
        });

        console.log(`✅ [Project ${projectId}] New sandbox created: ${sandboxInfo.sandboxId}`);

        // 4. Write all files to new sandbox
        console.log(`📤 [Project ${projectId}] Writing ${files.length} files to new sandbox...`);
        const fileOperations = files.map(({ path, content }) => ({
            path,
            content,
        }));

        await writeFilesToSandbox(sandboxInfo.sandbox, fileOperations);
        console.log(`✅ [Project ${projectId}] All files restored to new sandbox`);

        // 5. Update database with new sandboxId
        await prisma.project.update({
            where: { id: projectId },
            data: {
                sandboxId: sandboxInfo.sandboxId,
                sandboxPausedAt: null,
            },
        });

        console.log(`✅ [Project ${projectId}] Database updated with new sandbox ID`);

        // 6. Link sandbox to project
        sandboxInfo.projectId = projectId;

        console.log(`🎉 [Project ${projectId}] Successfully restored from R2 backup!`);
        console.log(`   Old sandbox: ${expiredSandboxId}`);
        console.log(`   New sandbox: ${sandboxInfo.sandboxId}`);
        console.log(`   Files restored: ${files.length}`);

        return sandboxInfo;
    } catch (error) {
        console.error(`❌ [Project ${projectId}] Failed to restore from expired sandbox:`, error);
        throw error;
    }
}

/**
 * Restore project from database files (fallback when no R2 backup)
 */
async function restoreProjectFromDatabase(
    projectId: string,
    expiredSandboxId: string,
    dbFiles: Array<{ path: string; content: string | null }>
): Promise<SandboxInfo> {
    console.log(`🔄 [Project ${projectId}] Restoring from database files...`);

    // Create new sandbox
    const sandboxInfo = await createSandbox({
        metadata: {
            projectId,
            restoredFrom: expiredSandboxId,
            restoredAt: new Date().toISOString(),
            source: "database-fallback",
        },
    });

    // Write files to sandbox
    const fileOperations = dbFiles
        .filter(f => f.content !== null)
        .map(({ path, content }) => ({
            path,
            content: content!,
        }));

    if (fileOperations.length > 0) {
        await writeFilesToSandbox(sandboxInfo.sandbox, fileOperations);
    }

    // Update database
    await prisma.project.update({
        where: { id: projectId },
        data: {
            sandboxId: sandboxInfo.sandboxId,
            sandboxPausedAt: null,
        },
    });

    sandboxInfo.projectId = projectId;

    console.log(`✅ [Project ${projectId}] Restored ${fileOperations.length} files from database`);
    return sandboxInfo;
}

/**
 * Pre-restore validation - check if restoration is possible
 * 
 * @param projectId - Project ID
 * @returns Validation result with details
 */
export async function validateRestorationPossible(projectId: string): Promise<{
    canRestore: boolean;
    source: "r2" | "database" | "none";
    fileCount: number;
    message: string;
}> {
    try {
        // Check R2 backup first
        const backupExists = await hasBackup(projectId);

        if (backupExists) {
            const files = await restoreProjectFiles(projectId);
            return {
                canRestore: true,
                source: "r2",
                fileCount: files.length,
                message: `R2 backup available with ${files.length} files`,
            };
        }

        // Check database backup
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });

        if (project?.codeFiles) {
            const codeFilesData = project.codeFiles as any;
            const fileCount = Object.keys(codeFilesData).length;

            if (fileCount > 0) {
                return {
                    canRestore: true,
                    source: "database",
                    fileCount,
                    message: `Database backup available with ${fileCount} files`,
                };
            }
        }

        return {
            canRestore: false,
            source: "none",
            fileCount: 0,
            message: "No backup found in R2 or database",
        };
    } catch (error) {
        console.error(`❌ Failed to validate restoration for project ${projectId}:`, error);
        return {
            canRestore: false,
            source: "none",
            fileCount: 0,
            message: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

/**
 * Get restoration status for a project
 * Useful for UI to show users if their project can be restored
 */
export async function getRestorationStatus(projectId: string): Promise<{
    needsRestoration: boolean;
    canRestore: boolean;
    backupSource?: "r2" | "database";
    fileCount?: number;
    lastBackup?: Date;
}> {
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                sandboxId: true,
                lastBackupAt: true,
            },
        });

        if (!project?.sandboxId) {
            return {
                needsRestoration: false,
                canRestore: false,
            };
        }

        // Try to connect to sandbox
        try {
            const { Sandbox } = await import("e2b");
            await Sandbox.connect(project.sandboxId);

            // Sandbox is accessible - no restoration needed
            return {
                needsRestoration: false,
                canRestore: true, // Has backup even though not needed
            };
        } catch (error: any) {
            // Sandbox not accessible - check if restoration is possible
            if (error.message?.includes('NotFoundError') || error.message?.includes('not found')) {
                const validation = await validateRestorationPossible(projectId);

                return {
                    needsRestoration: true,
                    canRestore: validation.canRestore,
                    backupSource: validation.source === "none" ? undefined : validation.source,
                    fileCount: validation.fileCount,
                    lastBackup: project.lastBackupAt || undefined,
                };
            }

            // Other error - assume sandbox is temporarily unavailable
            return {
                needsRestoration: false,
                canRestore: true,
            };
        }
    } catch (error) {
        console.error(`❌ Failed to get restoration status for project ${projectId}:`, error);
        return {
            needsRestoration: false,
            canRestore: false,
        };
    }
}
