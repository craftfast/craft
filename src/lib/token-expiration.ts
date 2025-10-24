/**
 * Token Expiration Management
 * 
 * Utilities for managing token expiration:
 * - Expire tokens that are past their expiration date
 * - Notify users about tokens expiring soon
 * - Clean up expired token purchases
 */

import { prisma } from "./db";

/**
 * Expire all tokens that have passed their expiration date
 * This should be run daily via cron job
 */
export async function expireTokens(): Promise<{
    expired: number;
    tokensExpired: number;
}> {
    const now = new Date();

    console.log(`[Token Expiration] Starting expiration check at ${now.toISOString()}`);

    // Find all purchases that have expired but still have tokens remaining
    const expiredPurchases = await prisma.tokenPurchase.findMany({
        where: {
            status: "completed",
            expiresAt: {
                lte: now,
            },
            tokensRemaining: {
                gt: 0,
            },
        },
    });

    console.log(`[Token Expiration] Found ${expiredPurchases.length} expired purchases with remaining tokens`);

    let totalTokensExpired = 0;

    // Mark tokens as expired by changing status
    // IMPORTANT: We keep tokensRemaining as-is to preserve historical data
    // This allows us to track how many tokens were unused when they expired
    for (const purchase of expiredPurchases) {
        const tokensExpiredCount = purchase.tokensRemaining;

        await prisma.tokenPurchase.update({
            where: { id: purchase.id },
            data: {
                status: "expired", // Mark as expired (queries will filter this out)
                // tokensRemaining stays unchanged - preserves history!
            },
        });

        totalTokensExpired += tokensExpiredCount;

        console.log(`[Token Expiration] Expired purchase ${purchase.id} (user: ${purchase.userId})`);
        console.log(`  ├─ Tokens purchased: ${purchase.tokenAmount}`);
        console.log(`  ├─ Tokens used: ${purchase.tokenAmount - tokensExpiredCount}`);
        console.log(`  └─ Tokens expired unused: ${tokensExpiredCount}`);
    }

    console.log(`[Token Expiration] Completed: ${expiredPurchases.length} purchases expired, ${totalTokensExpired} tokens removed`);

    return {
        expired: expiredPurchases.length,
        tokensExpired: totalTokensExpired,
    };
}

/**
 * Get tokens expiring soon for a user (within next 30 days)
 */
export async function getTokensExpiringSoon(userId: string, daysAhead: number = 30): Promise<{
    purchases: Array<{
        id: string;
        tokensRemaining: number;
        expiresAt: Date;
        daysUntilExpiry: number;
    }>;
    totalTokens: number;
}> {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const purchases = await prisma.tokenPurchase.findMany({
        where: {
            userId,
            status: "completed",
            tokensRemaining: {
                gt: 0,
            },
            expiresAt: {
                gt: now,
                lte: futureDate,
            },
        },
        orderBy: {
            expiresAt: "asc",
        },
    });

    const purchasesWithDays = purchases.map(p => {
        const daysUntilExpiry = Math.ceil(
            (p.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
            id: p.id,
            tokensRemaining: p.tokensRemaining,
            expiresAt: p.expiresAt!,
            daysUntilExpiry,
        };
    });

    const totalTokens = purchases.reduce((sum, p) => sum + p.tokensRemaining, 0);

    return {
        purchases: purchasesWithDays,
        totalTokens,
    };
}

/**
 * Notify users about tokens expiring soon
 * This should be run daily to send email notifications
 */
export async function notifyUsersAboutExpiringTokens(): Promise<{
    usersNotified: number;
}> {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Find users with tokens expiring in the next 7 days
    const expiringPurchases = await prisma.tokenPurchase.findMany({
        where: {
            status: "completed",
            tokensRemaining: {
                gt: 0,
            },
            expiresAt: {
                gt: now,
                lte: sevenDaysFromNow,
            },
        },
    });

    // Group by user and fetch user details
    const userMap = new Map<string, {
        tokens: number;
        earliestExpiry: Date;
    }>();

    for (const purchase of expiringPurchases) {
        const existing = userMap.get(purchase.userId);
        if (!existing) {
            userMap.set(purchase.userId, {
                tokens: purchase.tokensRemaining,
                earliestExpiry: purchase.expiresAt!,
            });
        } else {
            existing.tokens += purchase.tokensRemaining;
            if (purchase.expiresAt! < existing.earliestExpiry) {
                existing.earliestExpiry = purchase.expiresAt!;
            }
        }
    }

    console.log(`[Token Expiration] Found ${userMap.size} users with tokens expiring in next 7 days`);

    // Fetch user details for notifications
    for (const [userId, data] of userMap) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true },
        });

        if (user?.email) {
            console.log(`[Token Expiration] Should notify user ${user.email}: ${data.tokens} tokens expiring on ${data.earliestExpiry.toISOString()}`);
            // TODO: In production, integrate with your email service (SendGrid, Resend, etc.)
            // await sendExpirationNotificationEmail(user.email, data.tokens, data.earliestExpiry);
        }
    }

    return {
        usersNotified: userMap.size,
    };
}

/**
 * Get expiration statistics for admin dashboard
 */
export async function getExpirationStats(): Promise<{
    expiringIn7Days: number;
    expiringIn30Days: number;
    expiredLastMonth: number;
    expiredUnusedLastMonth: number; // NEW: Track unused tokens
    totalActiveTokens: number;
}> {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const [expiring7, expiring30, expiredLast, active] = await Promise.all([
        // Tokens expiring in next 7 days
        prisma.tokenPurchase.aggregate({
            where: {
                status: "completed",
                tokensRemaining: { gt: 0 },
                expiresAt: { gt: now, lte: sevenDaysFromNow },
            },
            _sum: { tokensRemaining: true },
        }),
        // Tokens expiring in next 30 days
        prisma.tokenPurchase.aggregate({
            where: {
                status: "completed",
                tokensRemaining: { gt: 0 },
                expiresAt: { gt: now, lte: thirtyDaysFromNow },
            },
            _sum: { tokensRemaining: true },
        }),
        // Tokens that expired in last month (now tracking unused tokens!)
        prisma.tokenPurchase.aggregate({
            where: {
                status: "expired",
                expiresAt: { gte: oneMonthAgo, lte: now },
            },
            _sum: {
                tokensRemaining: true, // Tokens that expired unused
                tokenAmount: true,     // Total tokens purchased
            },
        }),
        // Total active tokens
        prisma.tokenPurchase.aggregate({
            where: {
                status: "completed",
                tokensRemaining: { gt: 0 },
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: now } },
                ],
            },
            _sum: { tokensRemaining: true },
        }),
    ]);

    return {
        expiringIn7Days: expiring7._sum.tokensRemaining || 0,
        expiringIn30Days: expiring30._sum.tokensRemaining || 0,
        expiredLastMonth: expiredLast._sum.tokenAmount || 0,
        expiredUnusedLastMonth: expiredLast._sum.tokensRemaining || 0, // NEW: Unused tokens
        totalActiveTokens: active._sum.tokensRemaining || 0,
    };
}

/**
 * Get detailed purchase analytics (preserves historical data)
 */
export async function getPurchaseAnalytics(userId: string): Promise<{
    totalPurchased: number;
    totalUsed: number;
    currentlyAvailable: number;
    expiredUnused: number;
    utilizationRate: number; // Percentage of tokens actually used
}> {
    const [allPurchases, expiredPurchases] = await Promise.all([
        // All completed purchases (includes expired)
        prisma.tokenPurchase.findMany({
            where: {
                userId,
                status: { in: ["completed", "expired"] },
            },
        }),
        // Only expired purchases
        prisma.tokenPurchase.findMany({
            where: {
                userId,
                status: "expired",
            },
        }),
    ]);

    const totalPurchased = allPurchases.reduce((sum, p) => sum + p.tokenAmount, 0);
    const expiredUnused = expiredPurchases.reduce((sum, p) => sum + p.tokensRemaining, 0);

    // Currently available = sum of active purchases' remaining tokens
    const activePurchases = allPurchases.filter(p => p.status === "completed");
    const currentlyAvailable = activePurchases.reduce((sum, p) => sum + p.tokensRemaining, 0);

    // Total used = purchased - (available + expired unused)
    const totalUsed = totalPurchased - currentlyAvailable - expiredUnused;

    // Utilization rate = how much was actually used vs total purchased
    const utilizationRate = totalPurchased > 0 ? (totalUsed / totalPurchased) * 100 : 0;

    return {
        totalPurchased,
        totalUsed,
        currentlyAvailable,
        expiredUnused,
        utilizationRate,
    };
}

/**
 * Get detailed history of a specific purchase
 */
export async function getPurchaseHistory(purchaseId: string): Promise<{
    id: string;
    tokenAmount: number;
    tokensUsed: number;
    tokensRemaining: number;
    tokensExpired: number;
    status: string;
    purchasedAt: Date;
    expiresAt: Date | null;
    utilizationRate: number;
}> {
    const purchase = await prisma.tokenPurchase.findUnique({
        where: { id: purchaseId },
    });

    if (!purchase) {
        throw new Error("Purchase not found");
    }

    const tokensUsed = purchase.tokenAmount - purchase.tokensRemaining;
    const tokensExpired = purchase.status === "expired" ? purchase.tokensRemaining : 0;
    const utilizationRate = (tokensUsed / purchase.tokenAmount) * 100;

    return {
        id: purchase.id,
        tokenAmount: purchase.tokenAmount,
        tokensUsed,
        tokensRemaining: purchase.tokensRemaining,
        tokensExpired,
        status: purchase.status,
        purchasedAt: purchase.purchasedAt,
        expiresAt: purchase.expiresAt,
        utilizationRate,
    };
}
