import crypto from "crypto";

/**
 * Generate webhook secret
 */
export function generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString("hex");
}

/**
 * Sign webhook payload using HMAC-SHA256
 */
export function signWebhookPayload(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payloadString);
    return hmac.digest("hex");
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
    payload: any,
    signature: string,
    secret: string
): boolean {
    const expectedSignature = signWebhookPayload(payload, secret);
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * Trigger webhook delivery
 */
export async function triggerWebhook(
    url: string,
    eventType: string,
    payload: any,
    secret: string
): Promise<{
    success: boolean;
    responseCode?: number;
    responseBody?: string;
    error?: string;
}> {
    try {
        const signature = signWebhookPayload(payload, secret);
        const timestamp = Date.now();

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Webhook-Signature": signature,
                "X-Webhook-Event": eventType,
                "X-Webhook-Timestamp": timestamp.toString(),
            },
            body: JSON.stringify(payload),
        });

        const responseBody = await response.text();

        return {
            success: response.ok,
            responseCode: response.status,
            responseBody: responseBody.substring(0, 1000), // Limit to 1KB
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Send webhook for project events
 */
export async function sendProjectWebhook(
    projectId: string,
    eventType: string,
    eventData: any
) {
    const { prisma } = await import("@/lib/db");

    // Get active webhooks for this project that listen to this event
    const webhooks = await prisma.projectWebhook.findMany({
        where: {
            projectId,
            isActive: true,
        },
    });

    const filteredWebhooks = webhooks.filter((webhook) => {
        const events = webhook.events as string[];
        return events.includes(eventType) || events.includes("*");
    });

    // Trigger webhooks in parallel
    const deliveryPromises = filteredWebhooks.map(async (webhook) => {
        const payload = {
            event: eventType,
            projectId,
            timestamp: new Date().toISOString(),
            data: eventData,
        };

        const result = await triggerWebhook(
            webhook.url,
            eventType,
            payload,
            webhook.secret
        );

        // Create delivery record
        await prisma.webhookDelivery.create({
            data: {
                webhookId: webhook.id,
                eventType,
                payload,
                responseCode: result.responseCode,
                responseBody: result.responseBody,
                status: result.success ? "success" : "failed",
                attemptCount: 1,
                lastAttemptAt: new Date(),
            },
        });

        // Update webhook last triggered time
        await prisma.projectWebhook.update({
            where: { id: webhook.id },
            data: { lastTriggeredAt: new Date() },
        });

        return result;
    });

    await Promise.all(deliveryPromises);
}

/**
 * Retry failed webhook delivery
 */
export async function retryWebhookDelivery(deliveryId: string) {
    const { prisma } = await import("@/lib/db");

    const delivery = await prisma.webhookDelivery.findUnique({
        where: { id: deliveryId },
        include: { webhook: true },
    });

    if (!delivery) {
        throw new Error("Delivery not found");
    }

    const result = await triggerWebhook(
        delivery.webhook.url,
        delivery.eventType,
        delivery.payload,
        delivery.webhook.secret
    );

    await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
            responseCode: result.responseCode,
            responseBody: result.responseBody,
            status: result.success ? "success" : "failed",
            attemptCount: delivery.attemptCount + 1,
            lastAttemptAt: new Date(),
        },
    });

    return result;
}
