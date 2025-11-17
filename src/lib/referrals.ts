import { prisma } from "@/lib/db";

/**
 * Award referral credits to a user for a specific month
 */
export async function awardReferralCreditsForMonth(
    userId: string,
    month: Date
): Promise<number> {
    try {
        // Get all active referrals for this user
        const referrals = await prisma.user.findMany({
            where: {
                referredById: userId,
                deletedAt: null, // Only active users
            },
            select: {
                id: true,
            },
        });

        if (referrals.length === 0) {
            return 0;
        }

        // Normalize month to first day of month
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);

        // Create credit records for each referral
        const creditPromises = referrals.map((referral) =>
            prisma.referralCredit.upsert({
                where: {
                    userId_referredUserId_awardedForMonth: {
                        userId,
                        referredUserId: referral.id,
                        awardedForMonth: monthStart,
                    },
                },
                create: {
                    userId,
                    referredUserId: referral.id,
                    creditsAwarded: 1,
                    awardedForMonth: monthStart,
                    status: "active",
                },
                update: {
                    // Already exists, don't change anything
                },
            })
        );

        await Promise.all(creditPromises);

        return referrals.length; // Total credits awarded (1 per referral)
    } catch (error) {
        console.error("Error awarding referral credits:", error);
        throw error;
    }
}

/**
 * Process referral signup - link referred user to referrer
 */
export async function processReferralSignup(
    newUserId: string,
    referralCode: string
): Promise<boolean> {
    try {
        const referralCodeUpper = referralCode.toUpperCase();

        // Find referrer by code
        const referrer = await prisma.user.findUnique({
            where: { referralCode: referralCodeUpper },
            select: { id: true },
        });

        if (!referrer) {
            console.warn(`Invalid referral code: ${referralCode}`);
            return false;
        }

        // Prevent self-referral
        if (referrer.id === newUserId) {
            console.warn("User tried to refer themselves");
            return false;
        }

        // Link the new user to the referrer
        await prisma.user.update({
            where: { id: newUserId },
            data: { referredById: referrer.id },
        });

        // Award credit for the current month
        const currentMonth = new Date();
        await awardReferralCreditsForMonth(referrer.id, currentMonth);

        console.log(`✅ Referral processed: User ${newUserId} referred by ${referrer.id}`);
        return true;
    } catch (error) {
        console.error("Error processing referral signup:", error);
        return false;
    }
}

/**
 * Get total monthly credits for a user (plan credits + referral credits)
 */
export async function getUserMonthlyCredits(userId: string): Promise<{
    planCredits: number;
    referralCredits: number;
    totalCredits: number;
}> {
    try {
        // Get user subscription and plan
        const subscription = await prisma.userSubscription.findUnique({
            where: { userId },
            include: {
                plan: {
                    select: {
                        monthlyCredits: true,
                    },
                },
            },
        });

        const planCredits = subscription?.plan.monthlyCredits || 0;

        // Get active referrals count (each = 1 credit per month)
        const activeReferralsCount = await prisma.user.count({
            where: {
                referredById: userId,
                deletedAt: null,
            },
        });

        const referralCredits = activeReferralsCount;
        const totalCredits = planCredits + referralCredits;

        return {
            planCredits,
            referralCredits,
            totalCredits,
        };
    } catch (error) {
        console.error("Error getting user monthly credits:", error);
        return {
            planCredits: 0,
            referralCredits: 0,
            totalCredits: 0,
        };
    }
}

/**
 * Revoke referral credits when a referred user deletes their account
 */
export async function revokeReferralCredits(referredUserId: string): Promise<void> {
    try {
        await prisma.referralCredit.updateMany({
            where: {
                referredUserId,
                status: "active",
            },
            data: {
                status: "revoked",
            },
        });

        console.log(`✅ Revoked referral credits for deleted user: ${referredUserId}`);
    } catch (error) {
        console.error("Error revoking referral credits:", error);
    }
}

/**
 * Cron job function to award monthly credits to all users with active referrals
 * Should be run once per month (e.g., 1st day of each month)
 */
export async function awardMonthlyReferralCredits(): Promise<{
    usersProcessed: number;
    totalCreditsAwarded: number;
}> {
    try {
        console.log("🔄 Starting monthly referral credits award...");

        // Get all users who have active referrals
        const usersWithReferrals = await prisma.user.findMany({
            where: {
                referrals: {
                    some: {
                        deletedAt: null,
                    },
                },
            },
            select: {
                id: true,
            },
        });

        const currentMonth = new Date();
        let totalCreditsAwarded = 0;

        for (const user of usersWithReferrals) {
            const creditsAwarded = await awardReferralCreditsForMonth(
                user.id,
                currentMonth
            );
            totalCreditsAwarded += creditsAwarded;
        }

        console.log(`✅ Monthly referral credits awarded: ${totalCreditsAwarded} credits to ${usersWithReferrals.length} users`);

        return {
            usersProcessed: usersWithReferrals.length,
            totalCreditsAwarded,
        };
    } catch (error) {
        console.error("Error awarding monthly referral credits:", error);
        throw error;
    }
}
