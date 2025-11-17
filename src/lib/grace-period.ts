/**
 * Grace Period Management Utility
 * 
 * Handles payment failure grace periods and subscription recovery
 * 
 * Grace Period Policy:
 * - 7 days grace period after payment failure
 * - Reminder emails sent on days 1, 3, 5, 7
 * - Auto-downgrade to Hobby plan after grace period expires
 * - Users can update payment method and retry during grace period
 */

import { prisma } from "@/lib/db";
import { SubscriptionStatus } from "@prisma/client";

export interface GracePeriodStatus {
    isInGracePeriod: boolean;
    daysRemaining: number;
    gracePeriodEndsAt: Date | null;
    paymentFailedAt: Date | null;
    canRetryPayment: boolean;
    shouldSendReminder: boolean;
    nextReminderDay: number | null;
}

/**
 * Check if user is in grace period
 * 
 * @param userId - User ID
 * @returns Grace period status
 */
export async function getGracePeriodStatus(
    userId: string
): Promise<GracePeriodStatus> {
    const subscription = await prisma.userSubscription.findUnique({
        where: { userId },
    });

    if (!subscription) {
        return {
            isInGracePeriod: false,
            daysRemaining: 0,
            gracePeriodEndsAt: null,
            paymentFailedAt: null,
            canRetryPayment: false,
            shouldSendReminder: false,
            nextReminderDay: null,
        };
    }

    const isInGracePeriod = subscription.status === SubscriptionStatus.PAST_DUE;

    if (!isInGracePeriod || !subscription.gracePeriodEndsAt) {
        return {
            isInGracePeriod: false,
            daysRemaining: 0,
            gracePeriodEndsAt: null,
            paymentFailedAt: subscription.paymentFailedAt,
            canRetryPayment: false,
            shouldSendReminder: false,
            nextReminderDay: null,
        };
    }

    const now = new Date();
    const gracePeriodEnd = subscription.gracePeriodEndsAt;
    const remainingMs = gracePeriodEnd.getTime() - now.getTime();
    const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    // Calculate which reminder day we're on
    const daysSinceFailure = subscription.paymentFailedAt
        ? Math.floor((now.getTime() - subscription.paymentFailedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const reminderDays = [1, 3, 5, 7];
    const shouldSendReminder = reminderDays.includes(daysSinceFailure);
    const nextReminderDay = reminderDays.find(day => day > daysSinceFailure) || null;

    return {
        isInGracePeriod,
        daysRemaining: Math.max(0, daysRemaining),
        gracePeriodEndsAt: gracePeriodEnd,
        paymentFailedAt: subscription.paymentFailedAt,
        canRetryPayment: daysRemaining > 0,
        shouldSendReminder,
        nextReminderDay,
    };
}

/**
 * Start grace period for failed payment
 * 
 * @param userId - User ID
 * @param graceDays - Number of days for grace period (default: 7)
 */
export async function startGracePeriod(
    userId: string,
    graceDays: number = 7
): Promise<void> {
    const gracePeriodEndsAt = new Date();
    gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + graceDays);

    await prisma.userSubscription.updateMany({
        where: { userId },
        data: {
            status: SubscriptionStatus.PAST_DUE,
            paymentFailedAt: new Date(),
            gracePeriodEndsAt,
            updatedAt: new Date(),
        },
    });

    console.log(`Grace period started for user ${userId}, expires ${gracePeriodEndsAt.toISOString()}`);
}

/**
 * End grace period and downgrade to Hobby plan
 * 
 * @param userId - User ID
 */
export async function endGracePeriod(
    userId: string
): Promise<void> {
    const hobbyPlan = await prisma.plan.findUnique({
        where: { name: "HOBBY" },
    });

    if (!hobbyPlan) {
        throw new Error("Hobby plan not found in database");
    }

    await prisma.userSubscription.updateMany({
        where: { userId },
        data: {
            planId: hobbyPlan.id,
            status: SubscriptionStatus.CANCELLED,
            gracePeriodEndsAt: null,
            cancelAtPeriodEnd: true,
            cancelledAt: new Date(),
            updatedAt: new Date(),
        },
    });

    console.log(`Grace period ended for user ${userId}, downgraded to Hobby plan`);
}

/**
 * Recover from grace period after successful payment
 * 
 * @param userId - User ID
 */
export async function recoverFromGracePeriod(
    userId: string
): Promise<void> {
    await prisma.userSubscription.updateMany({
        where: { userId },
        data: {
            status: SubscriptionStatus.ACTIVE,
            gracePeriodEndsAt: null,
            paymentFailedAt: null,
            updatedAt: new Date(),
        },
    });

    console.log(`User ${userId} recovered from grace period`);
}

/**
 * Get all subscriptions in grace period that need reminders
 * 
 * @returns List of user IDs and their grace period info
 */
export async function getSubscriptionsNeedingReminders(): Promise<
    Array<{
        userId: string;
        email: string;
        daysRemaining: number;
        daysSinceFailure: number;
    }>
> {
    const now = new Date();

    const subscriptions = await prisma.userSubscription.findMany({
        where: {
            status: SubscriptionStatus.PAST_DUE,
            gracePeriodEndsAt: {
                gte: now, // Grace period hasn't expired yet
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
        },
    });

    const reminderDays = [1, 3, 5, 7];

    return subscriptions
        .map((sub) => {
            if (!sub.paymentFailedAt || !sub.gracePeriodEndsAt) {
                return null;
            }

            const daysSinceFailure = Math.floor(
                (now.getTime() - sub.paymentFailedAt.getTime()) / (1000 * 60 * 60 * 24)
            );

            const remainingMs = sub.gracePeriodEndsAt.getTime() - now.getTime();
            const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

            // Only include if today is a reminder day
            if (!reminderDays.includes(daysSinceFailure)) {
                return null;
            }

            return {
                userId: sub.userId,
                email: sub.user.email,
                daysRemaining,
                daysSinceFailure,
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
}

/**
 * Get all subscriptions with expired grace periods
 * 
 * @returns List of user IDs to downgrade
 */
export async function getExpiredGracePeriods(): Promise<string[]> {
    const now = new Date();

    const subscriptions = await prisma.userSubscription.findMany({
        where: {
            status: SubscriptionStatus.PAST_DUE,
            gracePeriodEndsAt: {
                lt: now, // Grace period has expired
            },
        },
        select: {
            userId: true,
        },
    });

    return subscriptions.map((sub) => sub.userId);
}

/**
 * Process all expired grace periods (run as cron job)
 */
export async function processExpiredGracePeriods(): Promise<{
    processed: number;
    errors: Array<{ userId: string; error: string }>;
}> {
    const expiredUserIds = await getExpiredGracePeriods();
    const errors: Array<{ userId: string; error: string }> = [];

    console.log(`Processing ${expiredUserIds.length} expired grace periods...`);

    for (const userId of expiredUserIds) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    subscription: {
                        include: {
                            plan: true
                        }
                    }
                }
            });

            await endGracePeriod(userId);

            // Send final notification email
            if (user && user.subscription) {
                const { sendSubscriptionDowngradedEmail } = await import("./subscription-emails");
                await sendSubscriptionDowngradedEmail({
                    user: {
                        email: user.email,
                        name: user.name
                    },
                    planName: user.subscription.plan.displayName || user.subscription.plan.name,
                    amount: user.subscription.plan.priceMonthlyUsd,
                    currency: "USD",
                    reason: "grace_period_expired"
                });
                console.log(`Grace period expiration email sent to ${user.email}`);
            }
        } catch (error) {
            console.error(`Failed to process grace period for user ${userId}:`, error);
            errors.push({
                userId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    console.log(`Processed ${expiredUserIds.length - errors.length}/${expiredUserIds.length} grace periods`);

    return {
        processed: expiredUserIds.length - errors.length,
        errors,
    };
}

/**
 * Send grace period reminder emails (run as cron job)
 */
export async function sendGracePeriodReminders(): Promise<{
    sent: number;
    errors: Array<{ userId: string; error: string }>;
}> {
    const usersNeedingReminders = await getSubscriptionsNeedingReminders();
    const errors: Array<{ userId: string; error: string }> = [];

    console.log(`Sending ${usersNeedingReminders.length} grace period reminders...`);

    for (const user of usersNeedingReminders) {
        try {
            // Get user's subscription details
            const subscription = await prisma.userSubscription.findUnique({
                where: { userId: user.userId },
                include: {
                    plan: true
                }
            });

            const userData = await prisma.user.findUnique({
                where: { id: user.userId }
            });

            if (subscription && userData && subscription.gracePeriodEndsAt) {
                // Send grace period reminder email
                const { sendGracePeriodReminderEmail } = await import("./subscription-emails");
                await sendGracePeriodReminderEmail({
                    user: {
                        email: user.email,
                        name: userData.name
                    },
                    planName: subscription.plan.displayName || subscription.plan.name,
                    amount: subscription.plan.priceMonthlyUsd,
                    currency: "USD",
                    daysRemaining: user.daysRemaining,
                    gracePeriodEndsAt: subscription.gracePeriodEndsAt
                });

                console.log(`Reminder sent to ${user.email} (${user.daysRemaining} days remaining)`);
            }
        } catch (error) {
            console.error(`Failed to send reminder to user ${user.userId}:`, error);
            errors.push({
                userId: user.userId,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    console.log(`Sent ${usersNeedingReminders.length - errors.length}/${usersNeedingReminders.length} reminders`);

    return {
        sent: usersNeedingReminders.length - errors.length,
        errors,
    };
}
