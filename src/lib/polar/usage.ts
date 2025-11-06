/**
 * Polar Usage Service
 * 
 * Handles usage event reporting for usage-based billing with Polar meters.
 */

import { prisma } from "@/lib/db";

const POLAR_API_BASE = process.env.POLAR_SERVER === "production"
    ? "https://api.polar.sh/v1"
    : "https://sandbox-api.polar.sh/v1";

const POLAR_HEADERS = {
    "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
};

interface UsageEventParams {
    userId: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalCredits: number;
    metadata?: Record<string, unknown>;
}

/**
 * Report usage to Polar meters
 * 
 * This sends AI credit usage events to Polar for usage-based billing.
 */
export async function reportUsageToPolar(params: UsageEventParams) {
    try {
        const {
            userId,
            model,
            inputTokens,
            outputTokens,
            totalCredits,
            metadata = {},
        } = params;

        // Get user with external customer ID
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                polarCustomerExtId: true,
                polarCustomerId: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.polarCustomerExtId && !user.polarCustomerId) {
            console.warn(`User ${userId} not synced with Polar, skipping usage reporting`);
            return { success: true, skipped: true };
        }

        // Create usage event payload
        const eventPayload = {
            external_customer_id: user.polarCustomerExtId || user.id,
            event_name: "ai_credits_used",
            properties: {
                credits: totalCredits,
                model,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                timestamp: new Date().toISOString(),
                ...metadata,
            },
        };

        // Send event to Polar
        const response = await fetch(`${POLAR_API_BASE}/events/`, {
            method: "POST",
            headers: POLAR_HEADERS,
            body: JSON.stringify(eventPayload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Polar usage event error:", errorText);
            throw new Error(`Failed to report usage: ${errorText}`);
        }

        const result = await response.json();

        // Log the usage event in our database for tracking
        await prisma.polarUsageEvent.create({
            data: {
                userId: user.id,
                externalCustomerId: user.polarCustomerExtId || user.id,
                eventName: "ai_credits_used",
                metadata: eventPayload.properties,
                polarEventId: result.id || null,
            },
        });

        console.log(`Reported ${totalCredits} credits usage for user ${userId} to Polar`);

        return {
            success: true,
            eventId: result.id,
        };
    } catch (error) {
        console.error("Error reporting usage to Polar:", error);

        // Don't fail the main operation if usage reporting fails
        // Just log the error
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get customer meter balance from Polar
 * 
 * Returns the current balance for a customer's usage meters.
 */
export async function getCustomerMeterBalance(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                polarCustomerExtId: true,
                polarCustomerId: true,
            },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.polarCustomerExtId && !user.polarCustomerId) {
            throw new Error("User not synced with Polar");
        }

        // Get customer state which includes meter balances
        const endpoint = user.polarCustomerExtId
            ? `${POLAR_API_BASE}/customers/state/external/${encodeURIComponent(user.polarCustomerExtId)}`
            : `${POLAR_API_BASE}/customers/state/${user.polarCustomerId}`;

        const response = await fetch(endpoint, {
            method: "GET",
            headers: POLAR_HEADERS,
        });

        if (!response.ok) {
            throw new Error(`Failed to get meter balance: ${await response.text()}`);
        }

        const customerState = await response.json();

        return {
            success: true,
            meters: customerState.meters || [],
            state: customerState,
        };
    } catch (error) {
        console.error("Error getting meter balance:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Batch report usage events
 * 
 * Efficiently report multiple usage events at once.
 */
export async function batchReportUsage(events: UsageEventParams[]) {
    const results = await Promise.allSettled(
        events.map((event) => reportUsageToPolar(event))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Batch usage report: ${successful} successful, ${failed} failed`);

    return {
        success: failed === 0,
        successful,
        failed,
        results,
    };
}
