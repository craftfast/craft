/**
 * Grace Period Cron Job
 * 
 * This endpoint should be called daily (preferably at midnight) to:
 * 1. Send reminder emails to users in grace period
 * 2. Downgrade expired grace period subscriptions to Hobby plan
 * 
 * Security: Should be protected by CRON_SECRET environment variable
 * 
 * Usage:
 * - Vercel Cron: Add to vercel.json crons configuration
 * - Manual: curl -X POST https://your-domain.com/api/cron/grace-period \
 *           -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

import { NextRequest, NextResponse } from "next/server";
import {
    sendGracePeriodReminders,
    processExpiredGracePeriods,
} from "@/lib/grace-period";

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

        console.log("🕐 Starting grace period cron job...");

        // Step 1: Send reminder emails
        console.log("📧 Sending grace period reminders...");
        const remindersResult = await sendGracePeriodReminders();
        console.log(`✅ Sent ${remindersResult.sent} reminders`);

        if (remindersResult.errors.length > 0) {
            console.error(`❌ ${remindersResult.errors.length} reminder errors:`, remindersResult.errors);
        }

        // Step 2: Process expired grace periods
        console.log("⏰ Processing expired grace periods...");
        const expirationResult = await processExpiredGracePeriods();
        console.log(`✅ Processed ${expirationResult.processed} expirations`);

        if (expirationResult.errors.length > 0) {
            console.error(`❌ ${expirationResult.errors.length} expiration errors:`, expirationResult.errors);
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results: {
                reminders: {
                    sent: remindersResult.sent,
                    errors: remindersResult.errors.length,
                },
                expirations: {
                    processed: expirationResult.processed,
                    errors: expirationResult.errors.length,
                },
            },
        });
    } catch (error) {
        console.error("❌ Grace period cron job failed:", error);
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
