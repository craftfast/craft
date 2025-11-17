import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { sendProjectWebhook } from "@/lib/webhook";

// POST /api/projects/[id]/webhooks/test - Test webhook delivery
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
        const { webhookId } = body;

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

        // Get webhook
        const webhook = await prisma.projectWebhook.findUnique({
            where: { id: webhookId, projectId },
        });

        if (!webhook) {
            return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
        }

        // Send test event
        await sendProjectWebhook(projectId, "webhook.test", {
            message: "This is a test webhook event",
            timestamp: new Date().toISOString(),
            projectName: project.name,
        });

        return NextResponse.json({
            success: true,
            message: "Test webhook sent successfully",
        });
    } catch (error) {
        console.error("Error testing webhook:", error);
        return NextResponse.json(
            { error: "Failed to test webhook" },
            { status: 500 }
        );
    }
}
