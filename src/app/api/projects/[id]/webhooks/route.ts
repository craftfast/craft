import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { generateWebhookSecret } from "@/lib/webhook";

// GET /api/projects/[id]/webhooks - List webhooks
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
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const hasAccess =
            project.userId === session.user.id ||
            (await prisma.projectCollaborator.findFirst({
                where: { projectId, userId: session.user.id },
            })) !== null;

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get webhooks (exclude secret from response)
        const webhooks = await prisma.projectWebhook.findMany({
            where: { projectId },
            select: {
                id: true,
                url: true,
                events: true,
                isActive: true,
                description: true,
                lastTriggeredAt: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { deliveries: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ webhooks });
    } catch (error) {
        console.error("Error fetching webhooks:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/projects/[id]/webhooks - Create webhook
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
        const body = await req.json();
        const { url, events, description } = body;

        if (!url || !events || !Array.isArray(events) || events.length === 0) {
            return NextResponse.json(
                { error: "URL and events are required" },
                { status: 400 }
            );
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
        }

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found or access denied" },
                { status: 404 }
            );
        }

        // Generate secret for webhook signing
        const secret = generateWebhookSecret();

        // Create webhook
        const webhook = await prisma.projectWebhook.create({
            data: {
                projectId,
                url,
                secret,
                events,
                description,
                isActive: true,
            },
            select: {
                id: true,
                url: true,
                secret: true, // Return secret only on creation
                events: true,
                isActive: true,
                description: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ webhook });
    } catch (error) {
        console.error("Error creating webhook:", error);
        return NextResponse.json(
            { error: "Failed to create webhook" },
            { status: 500 }
        );
    }
}
