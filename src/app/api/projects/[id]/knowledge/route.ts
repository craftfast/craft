import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { uploadFile, deleteFile } from "@/lib/r2-storage";
import { checkUserBalance } from "@/lib/ai-usage";

// GET /api/projects/[id]/knowledge - Get all knowledge files
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        // Verify project access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                knowledgeFiles: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        uploader: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Check if user has access (owner or collaborator)
        const collaborators = await prisma.projectCollaborator.findMany({
            where: { projectId, userId: session.user.id },
        });
        const hasAccess = project.userId === session.user.id || collaborators.length > 0;

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const files = project.knowledgeFiles.map((file) => ({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
            description: file.description,
            r2Url: file.r2Url,
            uploadedBy: {
                id: file.uploader.id,
                name: file.uploader.name,
                email: file.uploader.email,
            },
            createdAt: file.createdAt.toISOString(),
        }));

        return NextResponse.json({ files });
    } catch (error) {
        console.error("Error fetching knowledge files:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/projects/[id]/knowledge - Upload a knowledge file
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // CSRF Protection
        const csrfCheck = await withCsrfProtection(req);
        if (csrfCheck) return csrfCheck;

        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;

        // Verify project ownership or editor access
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                collaborators: true,
            },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        const isOwner = project.userId === session.user.id;
        const editorCollab = await prisma.projectCollaborator.findFirst({
            where: { projectId, userId: session.user.id, role: "editor" },
        });
        const isEditor = !!editorCollab;

        if (!isOwner && !isEditor) {
            return NextResponse.json(
                { error: "You don't have permission to upload files" },
                { status: 403 }
            );
        }

        // 🔒 BALANCE CHECK: Require minimum balance for uploads
        const balanceCheck = await checkUserBalance(session.user.id, 0);
        if (!balanceCheck.allowed) {
            return NextResponse.json(
                {
                    error: "Insufficient balance",
                    message: balanceCheck.reason || "Please add credits to continue.",
                    balance: balanceCheck.balance,
                },
                { status: 402 }
            );
        }

        // Parse form data
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const description = formData.get("description") as string;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File size exceeds 10MB limit" },
                { status: 400 }
            );
        }

        // Convert file to buffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract text content for text-based files (for AI context)
        let textContent: string | null = null;
        const textMimeTypes = [
            'text/plain', 'text/markdown', 'text/csv',
            'application/json', 'text/html', 'text/css',
        ];
        const isTextFile = textMimeTypes.some(t => file.type.startsWith(t)) ||
            file.name.endsWith('.md') || file.name.endsWith('.txt') ||
            file.name.endsWith('.json') || file.name.endsWith('.csv');

        if (isTextFile && buffer.length < 500 * 1024) { // Only store text for files < 500KB
            textContent = buffer.toString('utf-8');
        }

        // Upload to R2 storage
        const uploadResult = await uploadFile({
            userId: session.user.id,
            fileName: file.name,
            fileContent: buffer,
            mimeType: file.type || 'application/octet-stream',
            purpose: 'upload',
            projectId,
        });

        // Save to database with text content for AI context
        const knowledgeFile = await prisma.knowledgeFile.create({
            data: {
                projectId,
                name: file.name,
                r2Key: uploadResult.r2Key,
                r2Url: uploadResult.r2Url,
                mimeType: uploadResult.mimeType,
                size: uploadResult.size,
                description: description || null,
                textContent, // Store extracted text for AI context
                uploadedBy: session.user.id,
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            file: {
                id: knowledgeFile.id,
                name: knowledgeFile.name,
                mimeType: knowledgeFile.mimeType,
                size: knowledgeFile.size,
                description: knowledgeFile.description,
                r2Url: knowledgeFile.r2Url,
                uploadedBy: {
                    id: knowledgeFile.uploader.id,
                    name: knowledgeFile.uploader.name,
                    email: knowledgeFile.uploader.email,
                },
                createdAt: knowledgeFile.createdAt.toISOString(),
            },
        });
    } catch (error) {
        console.error("Error uploading knowledge file:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
