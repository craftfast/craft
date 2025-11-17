/**
 * Pending Plan Changes Cron Job
 * 
 * This endpoint should be called daily to process scheduled plan changes (downgrades).
 * When users downgrade their plan, the change is scheduled for the end of their billing cycle.
 * This cron job applies those changes when the time comes.
 * 
 * Security: Should be protected by CRON_SECRET environment variable
 * 
 * Usage:
 * - Vercel Cron: Add to vercel.json crons configuration
 * - Manual: curl -X POST https://your-domain.com/api/cron/pending-plan-changes \
 *           -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

import { NextRequest, NextResponse } from "next/server";
import { processPendingPlanChanges } from "@/lib/proration";

export async function POST(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        console.log("🕐 Starting pending plan changes cron job...");

        const result = await processPendingPlanChanges();

        console.log(`✅ Processed ${result.processed} plan changes`);

        if (result.errors.length > 0) {
            console.error(`❌ ${result.errors.length} errors:`, result.errors);
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results: {
                processed: result.processed,
                errors: result.errors.length,
                errorDetails: result.errors,
            },
        });
    } catch (error) {
        console.error("❌ Pending plan changes cron job failed:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

// Allow GET for testing purposes (remove in production)
export async function GET(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { error: "Method not allowed in production" },
            { status: 405 }
        );
    }

    return POST(request);
}
