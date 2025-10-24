/**
 * API Route: Token Expiration Cron Job
 * GET /api/cron/expire-tokens
 * 
 * This endpoint should be called daily by a cron service (e.g., Vercel Cron, GitHub Actions)
 * to expire tokens and notify users about expiring tokens
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from "next/server";
import { expireTokens, notifyUsersAboutExpiringTokens, getExpirationStats } from "@/lib/token-expiration";

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error("[Cron] CRON_SECRET not configured");
            return NextResponse.json(
                { error: "Cron secret not configured" },
                { status: 500 }
            );
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            console.error("[Cron] Invalid authorization header");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        console.log("[Cron] Starting token expiration job");

        // Step 1: Expire tokens
        const expirationResult = await expireTokens();
        console.log(`[Cron] Expired ${expirationResult.expired} purchases (${expirationResult.tokensExpired} tokens)`);

        // Step 2: Notify users about tokens expiring soon
        const notificationResult = await notifyUsersAboutExpiringTokens();
        console.log(`[Cron] Notified ${notificationResult.usersNotified} users about expiring tokens`);

        // Step 3: Get stats for logging
        const stats = await getExpirationStats();
        console.log(`[Cron] Stats:`, stats);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            results: {
                expired: expirationResult.expired,
                tokensExpired: expirationResult.tokensExpired,
                usersNotified: notificationResult.usersNotified,
                stats,
            },
        });
    } catch (error) {
        console.error("[Cron] Token expiration job failed:", error);
        return NextResponse.json(
            {
                error: "Failed to run token expiration job",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

// Also support POST for manual triggering
export const POST = GET;
