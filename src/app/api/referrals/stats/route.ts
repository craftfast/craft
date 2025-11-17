import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";

/**
 * GET /api/referrals/stats
 * Get referral statistics for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get user with referral data
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                referralCode: true,
                referrals: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                referralCredits: {
                    where: {
                        status: "active",
                    },
                    select: {
                        id: true,
                        referredUserId: true,
                        creditsAwarded: true,
                        awardedForMonth: true,
                        createdAt: true,
                    },
                    orderBy: {
                        awardedForMonth: "desc",
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Calculate stats
        const totalReferrals = user.referrals.length;
        const totalCreditsEarned = user.referralCredits.reduce(
            (sum, credit) => sum + credit.creditsAwarded,
            0
        );

        // Current month credits (active referrals * 1 credit per month)
        const currentMonthlyCredits = totalReferrals; // Each active referral = 1 credit per month

        // Get credit history grouped by month
        const creditHistory = user.referralCredits.reduce((acc, credit) => {
            const month = credit.awardedForMonth.toISOString().slice(0, 7); // YYYY-MM
            if (!acc[month]) {
                acc[month] = {
                    month,
                    credits: 0,
                    referrals: new Set(),
                };
            }
            acc[month].credits += credit.creditsAwarded;
            acc[month].referrals.add(credit.referredUserId);
            return acc;
        }, {} as Record<string, { month: string; credits: number; referrals: Set<string> }>);

        const creditHistoryArray = Object.values(creditHistory).map((item) => ({
            month: item.month,
            credits: item.credits,
            activeReferrals: item.referrals.size,
        }));

        return NextResponse.json({
            referralCode: user.referralCode,
            totalReferrals,
            totalCreditsEarned,
            currentMonthlyCredits,
            referrals: user.referrals,
            creditHistory: creditHistoryArray,
        });
    } catch (error) {
        console.error("Error getting referral stats:", error);
        return NextResponse.json(
            { error: "Failed to get referral stats" },
            { status: 500 }
        );
    }
}
