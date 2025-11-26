import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";

// GET /api/projects/[id]/webhooks/[webhookId] - Get webhook details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId, webhookId } = await params;

        // Verify access
        const webhook = await prisma.projectWebhook.findUnique({
            where: { id: webhookId },
            include: {
                project: true,
                deliveries: {
                    orderBy: { createdAt: "desc" },
                    take: 50,
                },
            },
        });

        if (!webhook) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        if (webhook.projectId !== projectId) {
            return NextResponse.json(
                { error: "Webhook does not belong to this project" },
                { status: 400 }
            );
        }

        const hasAccess =
            webhook.project.userId === session.user.id ||
            (await prisma.projectCollaborator.findFirst({
                where: { projectId, userId: session.user.id },
            })) !== null;

        if (!hasAccess) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Return webhook with deliveries (exclude secret)
        const { secret: _secret, ...webhookData } = webhook;

        return NextResponse.json({ webhook: webhookData });
    } catch (error) {
        console.error("Error fetching webhook:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PATCH /api/projects/[id]/webhooks/[webhookId] - Update webhook
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; webhookId: string }> }
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

        const { id: _projectId, webhookId } = await params;
        const body = await req.json();
        const { url, events, isActive, description } = body;

        // Verify ownership
        const webhook = await prisma.projectWebhook.findUnique({
            where: { id: webhookId },
            include: { project: true },
        });

        if (!webhook) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        if (webhook.project.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Only project owner can update webhooks" },
                { status: 403 }
            );
        }

        // Validate URL if provided
        if (url) {
            try {
                new URL(url);
            } catch {
                return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
            }
        }

        // Validate events if provided
        if (events && (!Array.isArray(events) || events.length === 0)) {
            return NextResponse.json(
                { error: "Events must be a non-empty array" },
                { status: 400 }
            );
        }

        // Update webhook
        const updated = await prisma.projectWebhook.update({
            where: { id: webhookId },
            data: {
                ...(url && { url }),
                ...(events && { events }),
                ...(typeof isActive === "boolean" && { isActive }),
                ...(description !== undefined && { description }),
            },
            select: {
                id: true,
                url: true,
                events: true,
                isActive: true,
                description: true,
                lastTriggeredAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json({ webhook: updated });
    } catch (error) {
        console.error("Error updating webhook:", error);
        return NextResponse.json(
            { error: "Failed to update webhook" },
            { status: 500 }
        );
    }
}

// DELETE /api/projects/[id]/webhooks/[webhookId] - Delete webhook
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; webhookId: string }> }
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

        const { id: _projectId, webhookId } = await params;

        // Verify ownership
        const webhook = await prisma.projectWebhook.findUnique({
            where: { id: webhookId },
            include: { project: true },
        });

        if (!webhook) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        if (webhook.project.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Only project owner can delete webhooks" },
                { status: 403 }
            );
        }

        // Delete webhook (cascades to deliveries)
        await prisma.projectWebhook.delete({
            where: { id: webhookId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting webhook:", error);
        return NextResponse.json(
            { error: "Failed to delete webhook" },
            { status: 500 }
        );
    }
}
