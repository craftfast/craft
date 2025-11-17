/**
 * Cloudflare R2 Storage Service
 * Handles file uploads, downloads, and deletions using S3-compatible API
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";

// Cloudflare R2 endpoint - uses Account ID in subdomain format
const R2_ENDPOINT = `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "craft-files";
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || `https://pub-${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.dev`;

// Initialize R2 client with proper configuration
const r2Client = new S3Client({
    region: "auto", // R2 uses 'auto' region
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
    },
    // Try both path styles to see which works
    forcePathStyle: false, // Changed to false - let SDK choose
});

// Log configuration on startup (only in development)
if (process.env.NODE_ENV === "development") {
    console.log("🔧 R2 Configuration:");
    console.log(`   Endpoint: ${R2_ENDPOINT}`);
    console.log(`   Bucket: ${BUCKET_NAME}`);
    console.log(`   Public URL: ${PUBLIC_URL}`);
    console.log(`   Access Key: ${process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.slice(0, 8)}...`);
}

export interface UploadFileOptions {
    userId: string;
    fileName: string;
    fileContent: Buffer | Uint8Array | string;
    mimeType?: string;
    purpose?: "source" | "image" | "asset" | "upload";
    projectId?: string;
}

export interface UploadedFile {
    r2Key: string;
    r2Url: string;
    fileName: string;
    size: number;
    mimeType: string;
}

/**
 * Upload a file to R2 storage
 */
export async function uploadFile(options: UploadFileOptions): Promise<UploadedFile> {
    const { userId, fileName, fileContent, mimeType, purpose = "upload", projectId } = options;

    // Generate unique key
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const prefix = purpose === "image" ? "images" : purpose === "source" ? "source" : "files";
    const r2Key = projectId
        ? `${prefix}/${projectId}/${timestamp}-${randomId}-${fileName}`
        : `${prefix}/temp/${userId}/${timestamp}-${randomId}-${fileName}`;

    // Convert content to Buffer if it's a string
    const buffer = typeof fileContent === "string" ? Buffer.from(fileContent) : fileContent;
    const size = buffer.length;

    // Detect MIME type if not provided
    const detectedMimeType = mimeType || detectMimeType(fileName);

    console.log(`📤 Uploading to R2:`, {
        bucket: BUCKET_NAME,
        key: r2Key,
        size,
        mimeType: detectedMimeType,
    });

    try {
        // Upload to R2
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
            Body: buffer,
            ContentType: detectedMimeType,
            Metadata: {
                userId,
                purpose,
                uploadedAt: new Date().toISOString(),
                ...(projectId && { projectId }),
            },
        });

        console.log(`🔄 Sending request to R2...`);
        await r2Client.send(command);
        console.log(`✅ Upload successful!`);

        // Construct public URL
        const r2Url = `${PUBLIC_URL}/${r2Key}`;

        return {
            r2Key,
            r2Url,
            fileName,
            size,
            mimeType: detectedMimeType,
        };
    } catch (error) {
        console.error("❌ Error uploading file to R2:", error);
        console.error("Configuration check:", {
            endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            bucket: BUCKET_NAME,
            hasAccessKey: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        });
        throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Upload multiple files in parallel
 */
export async function uploadFiles(files: UploadFileOptions[]): Promise<UploadedFile[]> {
    return Promise.all(files.map((file) => uploadFile(file)));
}

/**
 * Get a signed URL for temporary access to a file (optional, for private files)
 */
export async function getSignedFileUrl(r2Key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: r2Key,
    });

    return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Delete a file from R2
 */
export async function deleteFile(r2Key: string): Promise<void> {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
        });

        await r2Client.send(command);
    } catch (error) {
        console.error("Error deleting file from R2:", error);
        throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Delete multiple files in parallel
 */
export async function deleteFiles(r2Keys: string[]): Promise<void> {
    await Promise.all(r2Keys.map((key) => deleteFile(key)));
}

/**
 * Check if a file exists in R2
 */
export async function fileExists(r2Key: string): Promise<boolean> {
    try {
        const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
        });

        await r2Client.send(command);
        return true;
    } catch {
        return false;
    }
}

/**
 * Download file content from R2
 */
export async function downloadFile(r2Key: string): Promise<Buffer> {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
        });

        const response = await r2Client.send(command);
        const chunks: Uint8Array[] = [];

        if (response.Body) {
            for await (const chunk of response.Body as Readable) {
                chunks.push(chunk);
            }
        }

        return Buffer.concat(chunks);
    } catch (error) {
        console.error("Error downloading file from R2:", error);
        throw new Error(`Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Move a file from temp to project folder (when project is created)
 */
export async function moveFileToProject(r2Key: string, projectId: string): Promise<string> {
    try {
        // Download the file
        const content = await downloadFile(r2Key);

        // Extract filename from old key
        const fileName = r2Key.split("/").pop() || "file";
        const purpose = r2Key.startsWith("images/") ? "image" : r2Key.startsWith("source/") ? "source" : "upload";

        // Upload to new location
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const newKey = `${purpose === "image" ? "images" : purpose === "source" ? "source" : "files"}/${projectId}/${timestamp}-${randomId}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: newKey,
            Body: content,
            ContentType: detectMimeType(fileName),
        });

        await r2Client.send(command);

        // Delete old file
        await deleteFile(r2Key);

        return newKey;
    } catch (error) {
        console.error("Error moving file to project:", error);
        throw new Error(`Failed to move file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}

/**
 * Detect MIME type from filename
 */
function detectMimeType(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
        // Images
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
        svg: "image/svg+xml",
        ico: "image/x-icon",

        // Documents
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

        // Code files
        js: "text/javascript",
        ts: "text/typescript",
        tsx: "text/typescript",
        jsx: "text/javascript",
        json: "application/json",
        html: "text/html",
        css: "text/css",
        md: "text/markdown",
        txt: "text/plain",

        // Archives
        zip: "application/zip",
        tar: "application/x-tar",
        gz: "application/gzip",
    };

    return mimeTypes[ext || ""] || "application/octet-stream";
}

/**
 * Get file size limit based on purpose
 */
export function getFileSizeLimit(purpose: string): number {
    const limits: Record<string, number> = {
        image: 5 * 1024 * 1024, // 5MB for images
        source: 10 * 1024 * 1024, // 10MB for source files
        asset: 20 * 1024 * 1024, // 20MB for assets
        upload: 5 * 1024 * 1024, // 5MB for general uploads
    };

    return limits[purpose] || 5 * 1024 * 1024;
}
