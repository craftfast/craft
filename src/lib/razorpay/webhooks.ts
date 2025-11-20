/**
 * Razorpay Webhook Utilities
 * 
 * Utilities for logging and managing Razorpay webhook events.
 */

import { prisma } from "@/lib/db";
import { WebhookEventStatus } from "@prisma/client";

/**
 * Log webhook event to database
 */
export async function logWebhookEvent(
    eventType: string,
    eventId: string,
    payload: any
): Promise<void> {
    try {
        await prisma.razorpayWebhookEvent.create({
            data: {
                eventType,
                eventId,
                payload,
                status: "PENDING",
            },
        });
        console.log(`Logged webhook event: ${eventType} (${eventId})`);
    } catch (error) {
        // If duplicate, it's already logged (idempotency)
        if (error instanceof Error && error.message.includes("Unique constraint")) {
            console.log(`Webhook event ${eventId} already processed (idempotent)`);
        } else {
            console.error("Error logging webhook event:", error);
            throw error;
        }
    }
}

/**
 * Update webhook event status
 */
export async function updateWebhookEventStatus(
    eventId: string,
    status: WebhookEventStatus,
    errorMessage?: string
): Promise<void> {
    try {
        await prisma.razorpayWebhookEvent.updateMany({
            where: { eventId },
            data: {
                status,
                processedAt: status === "COMPLETED" || status === "FAILED" ? new Date() : undefined,
                errorMessage,
                retryCount: status === "FAILED" ? { increment: 1 } : undefined,
            },
        });
    } catch (error) {
        console.error("Error updating webhook event status:", error);
    }
}

/**
 * Check if webhook event has been processed
 */
export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
    try {
        const event = await prisma.razorpayWebhookEvent.findUnique({
            where: { eventId },
            select: { status: true },
        });

        return event?.status === "COMPLETED";
    } catch (error) {
        console.error("Error checking webhook event status:", error);
        return false;
    }
}

/**
 * Get user by Razorpay customer ID or email
 */
export async function getUserByRazorpayInfo(customerId?: string, email?: string) {
    try {
        if (customerId) {
            const user = await prisma.user.findUnique({
                where: { razorpayCustomerId: customerId },
                select: {
                    id: true,
                    email: true,
                    razorpayCustomerId: true,
                },
            });
            if (user) return user;
        }

        if (email) {
            return await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    razorpayCustomerId: true,
                },
            });
        }

        return null;
    } catch (error) {
        console.error("Error getting user by Razorpay info:", error);
        return null;
    }
}

/**
 * Get failed webhook events for retry
 */
export async function getFailedWebhookEvents(limit = 10) {
    try {
        const failedEvents = await prisma.razorpayWebhookEvent.findMany({
            where: {
                status: "FAILED",
                retryCount: { lt: 3 }, // Max 3 retries
            },
            orderBy: { createdAt: "asc" },
            take: limit,
        });

        return failedEvents;
    } catch (error) {
        console.error("Error getting failed webhook events:", error);
        return [];
    }
}
