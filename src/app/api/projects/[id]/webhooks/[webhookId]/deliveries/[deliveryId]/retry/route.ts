import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withCsrfProtection } from "@/lib/csrf";
import { retryWebhookDelivery } from "@/lib/webhook";

// POST /api/projects/[id]/webhooks/[webhookId]/deliveries/[deliveryId]/retry
export async function POST(
    req: NextRequest,
    {
        params,
    }: {
        params: Promise<{ id: string; webhookId: string; deliveryId: string }>;
    }
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

        const { id: _projectId, webhookId, deliveryId } = await params;

        // Verify delivery exists and belongs to webhook
        const delivery = await prisma.webhookDelivery.findUnique({
            where: { id: deliveryId },
            include: {
                webhook: {
                    include: { project: true },
                },
            },
        });

        if (!delivery) {
            return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
        }

        if (delivery.webhookId !== webhookId) {
            return NextResponse.json(
                { error: "Delivery does not belong to this webhook" },
                { status: 400 }
            );
        }

        if (delivery.webhook.project.userId !== session.user.id) {
            return NextResponse.json(
                { error: "Only project owner can retry deliveries" },
                { status: 403 }
            );
        }

        // Retry delivery
        const result = await retryWebhookDelivery(deliveryId);

        return NextResponse.json({
            success: result.success,
            message: result.success
                ? "Delivery retried successfully"
                : "Delivery retry failed",
        });
    } catch (error) {
        console.error("Error retrying delivery:", error);
        return NextResponse.json(
            { error: "Failed to retry delivery" },
            { status: 500 }
        );
    }
}
