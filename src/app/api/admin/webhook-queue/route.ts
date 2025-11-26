/**
 * Webhook Queue Management API
 * 
 * Admin endpoints for managing webhook event processing:
 * - Get queue statistics
 * - View failed webhooks
 * - Retry failed webhooks
 * - Clean up old jobs
 */

import { NextRequest, NextResponse } from "next/server";
import {
    getWebhookQueueStats,
    getFailedWebhookJobs,
    getCompletedWebhookJobs,
    retryWebhookEvent,
    cleanupWebhookQueue,
} from "@/lib/webhook-queue";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/webhook-queue
 * Get webhook queue statistics and recent jobs
 */
export async function GET(request: NextRequest) {
    try {
        // Check admin authorization
        const adminCheck = await requireAdmin(request);
        if (adminCheck) return adminCheck;

        const { searchParams } = new URL(request.url);
        const view = searchParams.get("view") || "stats";

        if (view === "stats") {
            const stats = await getWebhookQueueStats();
            return NextResponse.json({ stats });
        }

        if (view === "failed") {
            const limit = Number(searchParams.get("limit")) || 50;
            const failed = await getFailedWebhookJobs(limit);
            return NextResponse.json({ failed });
        }

        if (view === "completed") {
            const limit = Number(searchParams.get("limit")) || 50;
            const completed = await getCompletedWebhookJobs(limit);
            return NextResponse.json({ completed });
        }

        return NextResponse.json(
            { error: "Invalid view parameter" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Webhook queue GET error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/webhook-queue
 * Perform actions on webhook queue
 */
export async function POST(request: NextRequest) {
    try {
        // Check admin authorization
        const adminCheck = await requireAdmin(request);
        if (adminCheck) return adminCheck;

        const body = await request.json();
        const { action, eventId } = body;

        if (action === "retry") {
            if (!eventId) {
                return NextResponse.json(
                    { error: "eventId required for retry action" },
                    { status: 400 }
                );
            }

            const success = await retryWebhookEvent(eventId);
            return NextResponse.json({
                success,
                message: success
                    ? "Webhook event queued for retry"
                    : "Failed to retry webhook event",
            });
        }

        if (action === "cleanup") {
            const gracePeriodDays = Number(body.gracePeriodDays) || 7;
            const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000;

            const result = await cleanupWebhookQueue(gracePeriodMs);
            return NextResponse.json({
                success: true,
                removed: result.removed,
                message: `Cleaned up ${result.removed} old webhook jobs`,
            });
        }

        return NextResponse.json(
            { error: "Invalid action parameter" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Webhook queue POST error:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}
