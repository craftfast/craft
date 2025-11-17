import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { processReferralSignup } from "@/lib/referrals";

/**
 * POST /api/referrals/process
 * Process referral code after user signup
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { referralCode } = await request.json();

        if (!referralCode || typeof referralCode !== "string") {
            return NextResponse.json(
                { error: "Invalid referral code" },
                { status: 400 }
            );
        }

        const success = await processReferralSignup(
            session.user.id,
            referralCode
        );

        if (!success) {
            return NextResponse.json(
                { error: "Failed to process referral" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Referral processed successfully",
        });
    } catch (error) {
        console.error("Error processing referral:", error);
        return NextResponse.json(
            { error: "Failed to process referral" },
            { status: 500 }
        );
    }
}
