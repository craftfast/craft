/**
 * Polar Webhooks Utilities
 * 
 * Utilities for handling and verifying Polar webhook events.
 */

import { createHmac } from "crypto";
import { prisma } from "@/lib/db";
import { WebhookEventStatus } from "@prisma/client";

/**
 * Verify webhook signature from Polar
 */
export function verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
): boolean {
    try {
        const hmac = createHmac("sha256", secret);
        hmac.update(payload);
        const expectedSignature = hmac.digest("hex");

        return signature === expectedSignature;
    } catch (error) {
        console.error("Error verifying webhook signature:", error);
        return false;
    }
}

/**
 * Log webhook event to database
 */
export async function logWebhookEvent(
    eventType: string,
    eventId: string,
    payload: Record<string, unknown>
) {
    try {
        await prisma.polarWebhookEvent.create({
            data: {
                eventType,
                eventId,
                payload: payload as never,
                status: WebhookEventStatus.PENDING,
            },
        });
    } catch (error) {
        // If event already exists (duplicate), that's okay
        if (error instanceof Error && error.message.includes("Unique constraint")) {
            console.log(`Webhook event ${eventId} already logged (duplicate delivery)`);
            return;
        }
        console.error("Error logging webhook event:", error);
    }
}

/**
 * Update webhook event status
 */
export async function updateWebhookEventStatus(
    eventId: string,
    status: WebhookEventStatus,
    errorMessage?: string
) {
    try {
        await prisma.polarWebhookEvent.updateMany({
            where: { eventId },
            data: {
                status,
                processedAt: status === WebhookEventStatus.COMPLETED ? new Date() : undefined,
                errorMessage,
                retryCount: {
                    increment: status === WebhookEventStatus.FAILED ? 1 : 0,
                },
            },
        });
    } catch (error) {
        console.error("Error updating webhook event status:", error);
    }
}

/**
 * Check if webhook event has already been processed
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
    try {
        const event = await prisma.polarWebhookEvent.findUnique({
            where: { eventId },
            select: { status: true },
        });

        return event?.status === WebhookEventStatus.COMPLETED;
    } catch (error) {
        console.error("Error checking event status:", error);
        return false;
    }
}

/**
 * Get customer ID from external ID
 */
export async function getCustomerFromExternalId(externalId: string) {
    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: externalId },
                    { polarCustomerExtId: externalId },
                ],
            },
            select: {
                id: true,
                polarCustomerId: true,
                polarCustomerExtId: true,
            },
        });

        return user;
    } catch (error) {
        console.error("Error getting customer from external ID:", error);
        return null;
    }
}

/**
 * Retry failed webhook events
 */
export async function retryFailedWebhooks(maxRetries: number = 3) {
    try {
        const failedEvents = await prisma.polarWebhookEvent.findMany({
            where: {
                status: WebhookEventStatus.FAILED,
                retryCount: {
                    lt: maxRetries,
                },
            },
            orderBy: {
                createdAt: "asc",
            },
            take: 10, // Process 10 at a time
        });

        console.log(`Found ${failedEvents.length} failed webhooks to retry`);

        for (const event of failedEvents) {
            try {
                // Mark as processing
                await updateWebhookEventStatus(event.eventId, WebhookEventStatus.PROCESSING);

                // Re-process the event (you'll implement the actual processing logic in webhook handlers)
                // For now, just log it
                console.log(`Retrying webhook event ${event.eventId} (type: ${event.eventType})`);

                // This would call your actual webhook handler
                // await processWebhookEvent(event.eventType, event.payload);

                // Mark as completed (for now - will be updated when handlers are implemented)
                // await updateWebhookEventStatus(event.eventId, WebhookEventStatus.COMPLETED);
            } catch (error) {
                console.error(`Error retrying webhook ${event.eventId}:`, error);
                await updateWebhookEventStatus(
                    event.eventId,
                    WebhookEventStatus.FAILED,
                    error instanceof Error ? error.message : "Unknown error"
                );
            }
        }

        return {
            success: true,
            processed: failedEvents.length,
        };
    } catch (error) {
        console.error("Error retrying failed webhooks:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
