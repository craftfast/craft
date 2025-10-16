import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkUserTokenAvailability } from "@/lib/ai-usage";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const availability = await checkUserTokenAvailability(session.user.id);

        return NextResponse.json({
            totalAvailable: availability.totalAvailable,
            subscriptionTokensRemaining:
                availability.subscriptionTokenLimit !== null
                    ? Math.max(
                        0,
                        availability.subscriptionTokenLimit -
                        availability.subscriptionTokensUsed
                    )
                    : 0,
            purchasedTokensRemaining: availability.purchasedTokensRemaining,
            subscriptionTokenLimit: availability.subscriptionTokenLimit,
            subscriptionTokensUsed: availability.subscriptionTokensUsed,
        });
    } catch (error) {
        console.error("Error fetching credit balance:", error);
        return NextResponse.json(
            { error: "Failed to fetch credit balance" },
            { status: 500 }
        );
    }
}
