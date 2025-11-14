/**
 * Sandbox Health Monitoring Service
 * 
 * Monitors sandbox health and automatically handles issues:
 * - Detects expired/killed sandboxes
 * - Monitors sandbox connectivity
 * - Triggers automatic restoration when needed
 * - Provides health status for UI/API
 * 
 * Usage:
 * - Call checkSandboxHealth() before operations
 * - Use monitorSandboxHealth() for periodic checks
 * - Subscribe to health events for real-time updates
 */

import { Sandbox } from "e2b";
import { prisma } from "@/lib/db";
import { restoreProjectFromExpiredSandbox, getRestorationStatus } from "./r2-sandbox-restore";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface SandboxHealthStatus {
    projectId: string;
    sandboxId: string;
    status: "healthy" | "paused" | "expired" | "error" | "unknown";
    canRestore: boolean;
    backupAvailable: boolean;
    lastBackup?: Date;
    lastCheck: Date;
    message: string;
}

export interface SandboxHealthCheckResult {
    healthy: boolean;
    needsRestoration: boolean;
    canRestore: boolean;
    status: SandboxHealthStatus;
    restoredSandboxId?: string;
}

// ============================================================================
// HEALTH CHECK FUNCTIONS
// ============================================================================

/**
 * Check sandbox health and automatically restore if needed
 * 
 * This is the main function to call before any sandbox operation.
 * It will:
 * 1. Check if sandbox is accessible
 * 2. If expired, automatically restore from R2
 * 3. Return current health status
 * 
 * @param projectId - Project ID
 * @param autoRestore - Automatically restore if sandbox expired (default: true)
 * @returns Health check result
 */
export async function checkSandboxHealth(
    projectId: string,
    autoRestore = true
): Promise<SandboxHealthCheckResult> {
    console.log(`🔍 [Project ${projectId}] Checking sandbox health...`);

    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                sandboxId: true,
                sandboxPausedAt: true,
                lastBackupAt: true,
            },
        });

        if (!project?.sandboxId) {
            return {
                healthy: false,
                needsRestoration: false,
                canRestore: false,
                status: {
                    projectId,
                    sandboxId: "",
                    status: "error",
                    canRestore: false,
                    backupAvailable: false,
                    lastCheck: new Date(),
                    message: "No sandbox associated with this project",
                },
            };
        }

        // Try to connect to sandbox
        try {
            const sandbox = await Sandbox.connect(project.sandboxId);

            // Verify sandbox is actually working
            const testResult = await sandbox.commands.run("echo 'health-check'", {
                timeoutMs: 10000,
            });

            if (testResult.exitCode !== 0) {
                throw new Error("Sandbox health check command failed");
            }

            // Sandbox is healthy
            const isPaused = project.sandboxPausedAt !== null;

            return {
                healthy: true,
                needsRestoration: false,
                canRestore: false,
                status: {
                    projectId,
                    sandboxId: project.sandboxId,
                    status: isPaused ? "paused" : "healthy",
                    canRestore: true,
                    backupAvailable: project.lastBackupAt !== null,
                    lastBackup: project.lastBackupAt || undefined,
                    lastCheck: new Date(),
                    message: isPaused ? "Sandbox is paused but healthy" : "Sandbox is healthy and accessible",
                },
            };
        } catch (error: any) {
            console.warn(`⚠️ [Project ${projectId}] Sandbox not accessible:`, error.message);

            // Check if sandbox is expired/deleted
            const isExpired = error.message?.includes('NotFoundError') ||
                error.message?.includes('not found') ||
                error.message?.includes('does not exist');

            if (isExpired) {
                console.log(`🔄 [Project ${projectId}] Sandbox expired, checking restoration options...`);

                // Get restoration status
                const restorationStatus = await getRestorationStatus(projectId);

                if (autoRestore && restorationStatus.canRestore) {
                    console.log(`🚀 [Project ${projectId}] Auto-restoring from backup...`);

                    try {
                        const newSandboxInfo = await restoreProjectFromExpiredSandbox(
                            projectId,
                            project.sandboxId
                        );

                        return {
                            healthy: true,
                            needsRestoration: false, // Already restored
                            canRestore: true,
                            restoredSandboxId: newSandboxInfo.sandboxId,
                            status: {
                                projectId,
                                sandboxId: newSandboxInfo.sandboxId,
                                status: "healthy",
                                canRestore: true,
                                backupAvailable: true,
                                lastBackup: project.lastBackupAt || undefined,
                                lastCheck: new Date(),
                                message: `Sandbox automatically restored from backup (old: ${project.sandboxId}, new: ${newSandboxInfo.sandboxId})`,
                            },
                        };
                    } catch (restoreError) {
                        console.error(`❌ [Project ${projectId}] Auto-restore failed:`, restoreError);

                        return {
                            healthy: false,
                            needsRestoration: true,
                            canRestore: restorationStatus.canRestore,
                            status: {
                                projectId,
                                sandboxId: project.sandboxId,
                                status: "expired",
                                canRestore: restorationStatus.canRestore,
                                backupAvailable: restorationStatus.backupSource !== undefined,
                                lastBackup: project.lastBackupAt || undefined,
                                lastCheck: new Date(),
                                message: `Sandbox expired but auto-restore failed: ${restoreError instanceof Error ? restoreError.message : "Unknown error"}`,
                            },
                        };
                    }
                }

                // Don't auto-restore or can't restore
                return {
                    healthy: false,
                    needsRestoration: true,
                    canRestore: restorationStatus.canRestore,
                    status: {
                        projectId,
                        sandboxId: project.sandboxId,
                        status: "expired",
                        canRestore: restorationStatus.canRestore,
                        backupAvailable: restorationStatus.backupSource !== undefined,
                        lastBackup: project.lastBackupAt || undefined,
                        lastCheck: new Date(),
                        message: restorationStatus.canRestore
                            ? "Sandbox expired but can be restored from backup"
                            : "Sandbox expired and no backup available",
                    },
                };
            }

            // Other error (network, timeout, etc.)
            return {
                healthy: false,
                needsRestoration: false,
                canRestore: true,
                status: {
                    projectId,
                    sandboxId: project.sandboxId,
                    status: "error",
                    canRestore: true,
                    backupAvailable: project.lastBackupAt !== null,
                    lastBackup: project.lastBackupAt || undefined,
                    lastCheck: new Date(),
                    message: `Sandbox health check failed: ${error.message}`,
                },
            };
        }
    } catch (error) {
        console.error(`❌ [Project ${projectId}] Health check failed:`, error);

        return {
            healthy: false,
            needsRestoration: false,
            canRestore: false,
            status: {
                projectId,
                sandboxId: "",
                status: "unknown",
                canRestore: false,
                backupAvailable: false,
                lastCheck: new Date(),
                message: `Health check error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
        };
    }
}

/**
 * Batch health check for multiple projects
 * Useful for dashboard/status pages
 * 
 * @param projectIds - Array of project IDs to check
 * @param autoRestore - Auto-restore expired sandboxes
 * @returns Map of project ID to health status
 */
export async function checkMultipleSandboxHealth(
    projectIds: string[],
    autoRestore = false // Default false for batch checks to avoid overwhelming system
): Promise<Map<string, SandboxHealthCheckResult>> {
    console.log(`🔍 Checking health for ${projectIds.length} sandboxes...`);

    const results = await Promise.all(
        projectIds.map(async (projectId) => {
            try {
                const result = await checkSandboxHealth(projectId, autoRestore);
                return [projectId, result] as const;
            } catch (error) {
                console.error(`❌ Health check failed for project ${projectId}:`, error);
                return [
                    projectId,
                    {
                        healthy: false,
                        needsRestoration: false,
                        canRestore: false,
                        status: {
                            projectId,
                            sandboxId: "",
                            status: "error" as const,
                            canRestore: false,
                            backupAvailable: false,
                            lastCheck: new Date(),
                            message: "Health check failed",
                        },
                    },
                ] as const;
            }
        })
    );

    return new Map(results);
}

/**
 * Get quick health status without full check
 * Fast lookup for UI display
 * 
 * @param projectId - Project ID
 * @returns Basic health status
 */
export async function getQuickHealthStatus(projectId: string): Promise<{
    hasActiveSandbox: boolean;
    isPaused: boolean;
    hasBackup: boolean;
    lastBackup?: Date;
}> {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            sandboxId: true,
            sandboxPausedAt: true,
            lastBackupAt: true,
        },
    });

    return {
        hasActiveSandbox: !!project?.sandboxId,
        isPaused: project?.sandboxPausedAt !== null,
        hasBackup: project?.lastBackupAt !== null,
        lastBackup: project?.lastBackupAt || undefined,
    };
}

/**
 * Force health check and restoration
 * Used by admin/support to manually trigger recovery
 * 
 * @param projectId - Project ID
 * @returns Health check result with restoration details
 */
export async function forceHealthCheckAndRestore(
    projectId: string
): Promise<SandboxHealthCheckResult> {
    console.log(`🔧 [Project ${projectId}] Force health check and restore...`);
    return checkSandboxHealth(projectId, true);
}

/**
 * Get sandbox uptime statistics
 * Useful for monitoring and billing
 * 
 * @param projectId - Project ID
 * @returns Uptime statistics
 */
export async function getSandboxUptime(projectId: string): Promise<{
    totalUptime: number; // milliseconds
    pausedTime: number; // milliseconds
    activeTime: number; // milliseconds
    lastActive?: Date;
    createdAt?: Date;
}> {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            sandboxId: true,
            sandboxPausedAt: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!project) {
        return {
            totalUptime: 0,
            pausedTime: 0,
            activeTime: 0,
        };
    }

    const now = new Date();
    const createdAt = project.createdAt;
    const totalUptime = now.getTime() - createdAt.getTime();

    // Calculate paused time (approximate)
    const pausedTime = project.sandboxPausedAt
        ? now.getTime() - project.sandboxPausedAt.getTime()
        : 0;

    const activeTime = totalUptime - pausedTime;

    return {
        totalUptime,
        pausedTime,
        activeTime,
        lastActive: project.sandboxPausedAt || project.updatedAt,
        createdAt,
    };
}
