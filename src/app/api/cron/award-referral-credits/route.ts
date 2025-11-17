import { NextRequest, NextResponse } from "next/server";
import { awardMonthlyReferralCredits } from "@/lib/referrals";

/**
 * POST /api/cron/award-referral-credits
 * Award monthly referral credits to all users with active referrals
 * 
 * This should be called once per month via a cron job (e.g., Vercel Cron)
 * 
 * Security: Verify cron secret to prevent unauthorized access
 */
export async function POST(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error("CRON_SECRET not configured");
            return NextResponse.json(
                { error: "Cron job not configured" },
                { status: 500 }
            );
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            console.error("Unauthorized cron request");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Award monthly credits
        const result = await awardMonthlyReferralCredits();

        return NextResponse.json({
            success: true,
            usersProcessed: result.usersProcessed,
            totalCreditsAwarded: result.totalCreditsAwarded,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error in referral credits cron job:", error);
        return NextResponse.json(
            { error: "Failed to award referral credits" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/cron/award-referral-credits
 * Manual trigger for testing (requires secret)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const result = await awardMonthlyReferralCredits();

        return NextResponse.json({
            success: true,
            usersProcessed: result.usersProcessed,
            totalCreditsAwarded: result.totalCreditsAwarded,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error in referral credits cron job:", error);
        return NextResponse.json(
            { error: "Failed to award referral credits" },
            { status: 500 }
        );
    }
}
