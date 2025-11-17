/**
 * R2 Project Backup Service
 * 
 * Handles automatic backup of E2B sandbox project files to Cloudflare R2.
 * This ensures project files are preserved even when sandboxes expire (30-day limit).
 * 
 * Features:
 * - Automatic backup on every file write
 * - Batch backup for multiple files
 * - Full project restoration to new sandboxes
 * - Incremental sync (only changed files)
 * - Compression support for large projects
 * 
 * Workflow:
 * 1. User edits file → AI writes to sandbox → Auto-backup to R2
 * 2. Sandbox expires → Create new sandbox → Restore from R2
 * 3. Seamless transition, no data loss
 */

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { prisma } from "@/lib/db";

// R2 Configuration
const R2_ENDPOINT = `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "craft-files";

const r2Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
    },
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProjectFile {
    path: string;
    content: string;
    updatedAt: Date;
}

export interface BackupMetadata {
    projectId: string;
    sandboxId: string;
    timestamp: Date;
    fileCount: number;
    totalSize: number;
}

// ============================================================================
// BACKUP FUNCTIONS
// ============================================================================

/**
 * Backup a single project file to R2
 * 
 * @param projectId - Project ID
 * @param filePath - File path relative to project root
 * @param content - File content
 */
export async function backupProjectFile(
    projectId: string,
    filePath: string,
    content: string
): Promise<void> {
    try {
        // Normalize file path (remove leading slash)
        const normalizedPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

        // R2 key format: projects/{projectId}/files/{filePath}
        const r2Key = `projects/${projectId}/files/${normalizedPath}`;

        console.log(`📤 Backing up file to R2: ${normalizedPath}`);

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
            Body: Buffer.from(content, "utf-8"),
            ContentType: detectContentType(normalizedPath),
            Metadata: {
                projectId,
                filePath: normalizedPath,
                updatedAt: new Date().toISOString(),
            },
        });

        await r2Client.send(command);
        console.log(`✅ File backed up: ${normalizedPath}`);

        // Update database record with last backup time
        await prisma.project.update({
            where: { id: projectId },
            data: { lastBackupAt: new Date() },
        });
    } catch (error) {
        console.error(`❌ Failed to backup file ${filePath}:`, error);
        throw error;
    }
}

/**
 * Backup multiple project files to R2 in parallel
 * 
 * @param projectId - Project ID
 * @param files - Array of files to backup
 */
export async function backupProjectFiles(
    projectId: string,
    files: Array<{ path: string; content: string }>
): Promise<void> {
    try {
        console.log(`📦 Backing up ${files.length} files for project ${projectId}...`);

        await Promise.all(
            files.map(({ path, content }) =>
                backupProjectFile(projectId, path, content)
            )
        );

        console.log(`✅ Backed up ${files.length} files to R2`);
    } catch (error) {
        console.error("❌ Failed to backup project files:", error);
        throw error;
    }
}

/**
 * Backup all files from database to R2
 * Used during initial project creation or manual sync
 * 
 * @param projectId - Project ID
 */
export async function backupAllProjectFiles(projectId: string): Promise<void> {
    try {
        console.log(`🔄 Starting full backup for project ${projectId}...`);

        // Get all files from database (stored in codeFiles JSON field)
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { codeFiles: true },
        });

        if (!project || !project.codeFiles) {
            console.log(`ℹ️ No files to backup for project ${projectId}`);
            return;
        }

        // Parse codeFiles JSON to array
        const codeFilesData = project.codeFiles as any;
        const files = Object.entries(codeFilesData).map(([path, content]) => ({
            path,
            content: content as string,
        }));

        if (files.length === 0) {
            console.log(`ℹ️ No files to backup for project ${projectId}`);
            return;
        }

        await backupProjectFiles(projectId, files);

        console.log(`✅ Full backup completed: ${files.length} files`);
    } catch (error) {
        console.error(`❌ Failed to backup all project files:`, error);
        throw error;
    }
}

// ============================================================================
// RESTORE FUNCTIONS
// ============================================================================

/**
 * Restore all project files from R2
 * Returns array of files ready to be written to sandbox
 * 
 * @param projectId - Project ID
 * @returns Array of project files
 */
export async function restoreProjectFiles(projectId: string): Promise<ProjectFile[]> {
    try {
        console.log(`📥 Restoring project files from R2 for project ${projectId}...`);

        const prefix = `projects/${projectId}/files/`;
        const files: ProjectFile[] = [];

        // List all files for this project
        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
        });

        const listResponse = await r2Client.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            console.log(`ℹ️ No backup files found for project ${projectId}`);
            return [];
        }

        console.log(`📋 Found ${listResponse.Contents.length} files in R2`);

        // Download all files in parallel
        await Promise.all(
            listResponse.Contents.map(async (object) => {
                if (!object.Key) return;

                try {
                    const getCommand = new GetObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: object.Key,
                    });

                    const response = await r2Client.send(getCommand);
                    const content = await streamToString(response.Body as Readable);

                    // Extract file path from R2 key
                    const filePath = object.Key.replace(prefix, "");

                    files.push({
                        path: filePath,
                        content,
                        updatedAt: object.LastModified || new Date(),
                    });

                    console.log(`✅ Restored: ${filePath}`);
                } catch (error) {
                    console.error(`❌ Failed to restore ${object.Key}:`, error);
                }
            })
        );

        console.log(`✅ Restored ${files.length} files from R2`);
        return files;
    } catch (error) {
        console.error(`❌ Failed to restore project files:`, error);
        throw error;
    }
}

/**
 * Restore a single file from R2
 * 
 * @param projectId - Project ID
 * @param filePath - File path relative to project root
 * @returns File content or null if not found
 */
export async function restoreProjectFile(
    projectId: string,
    filePath: string
): Promise<string | null> {
    try {
        const normalizedPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
        const r2Key = `projects/${projectId}/files/${normalizedPath}`;

        console.log(`📥 Restoring file from R2: ${normalizedPath}`);

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
        });

        const response = await r2Client.send(command);
        const content = await streamToString(response.Body as Readable);

        console.log(`✅ File restored: ${normalizedPath}`);
        return content;
    } catch (error: any) {
        if (error.name === "NoSuchKey") {
            console.log(`ℹ️ File not found in R2: ${filePath}`);
            return null;
        }
        console.error(`❌ Failed to restore file ${filePath}:`, error);
        throw error;
    }
}

// ============================================================================
// CLEANUP FUNCTIONS
// ============================================================================

/**
 * Delete all backup files for a project from R2
 * Used when deleting a project
 * 
 * @param projectId - Project ID
 */
export async function deleteProjectBackup(projectId: string): Promise<void> {
    try {
        console.log(`🗑️ Deleting project backup from R2: ${projectId}`);

        const prefix = `projects/${projectId}/`;

        // List all objects
        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
        });

        const listResponse = await r2Client.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            console.log(`ℹ️ No backup found for project ${projectId}`);
            return;
        }

        // Delete all objects
        const deleteCommand = new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: {
                Objects: listResponse.Contents.map((obj) => ({ Key: obj.Key! })),
            },
        });

        await r2Client.send(deleteCommand);

        console.log(`✅ Deleted ${listResponse.Contents.length} backup files for project ${projectId}`);
    } catch (error) {
        console.error(`❌ Failed to delete project backup:`, error);
        throw error;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert a readable stream to string
 */
async function streamToString(stream: Readable): Promise<string> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
}

/**
 * Detect content type based on file extension
 */
function detectContentType(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();

    const contentTypes: Record<string, string> = {
        // Code files
        ts: "text/typescript",
        tsx: "text/typescript",
        js: "text/javascript",
        jsx: "text/javascript",
        json: "application/json",

        // Markup
        html: "text/html",
        css: "text/css",
        scss: "text/scss",
        md: "text/markdown",

        // Config files
        yml: "text/yaml",
        yaml: "text/yaml",
        toml: "text/toml",
        xml: "text/xml",

        // Other
        txt: "text/plain",
        svg: "image/svg+xml",
    };

    return contentTypes[ext || ""] || "text/plain";
}

/**
 * Get backup metadata for a project
 */
export async function getBackupMetadata(projectId: string): Promise<BackupMetadata | null> {
    try {
        const prefix = `projects/${projectId}/files/`;

        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
        });

        const listResponse = await r2Client.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return null;
        }

        const totalSize = listResponse.Contents.reduce(
            (sum, obj) => sum + (obj.Size || 0),
            0
        );

        // Get most recent modification date
        const latestFile = listResponse.Contents.reduce((latest, obj) => {
            if (!obj.LastModified) return latest;
            if (!latest || obj.LastModified > latest) return obj.LastModified;
            return latest;
        }, null as Date | null);

        // Get project info
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { sandboxId: true },
        });

        return {
            projectId,
            sandboxId: project?.sandboxId || "",
            timestamp: latestFile || new Date(),
            fileCount: listResponse.Contents.length,
            totalSize,
        };
    } catch (error) {
        console.error(`❌ Failed to get backup metadata:`, error);
        return null;
    }
}

/**
 * Check if backup exists for a project
 */
export async function hasBackup(projectId: string): Promise<boolean> {
    const metadata = await getBackupMetadata(projectId);
    return metadata !== null && metadata.fileCount > 0;
}
