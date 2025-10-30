import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { checkUserCreditAvailability } from "@/lib/ai-usage";

export async function GET() {
    try {
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const availability = await checkUserCreditAvailability(session.user.id);

        return NextResponse.json({
            totalAvailable: availability.creditsRemaining,
            subscriptionCreditsRemaining: availability.creditsRemaining,
            subscriptionCreditLimit: availability.dailyCreditsLimit,
            subscriptionCreditsUsed: availability.dailyCreditsUsed,
            planName: availability.planName, // Added: user's subscription plan
            // Legacy fields for backwards compatibility
            dailyCreditsUsed: availability.dailyCreditsUsed,
            dailyCreditsLimit: availability.dailyCreditsLimit,
            creditsRemaining: availability.creditsRemaining,
            allowed: availability.allowed,
            reason: availability.reason,
        });
    } catch (error) {
        console.error("Error fetching credit balance:", error);
        return NextResponse.json(
            { error: "Failed to fetch credit balance" },
            { status: 500 }
        );
    }
}
