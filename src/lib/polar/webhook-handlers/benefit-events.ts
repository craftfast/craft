/**
 * Polar Benefit Event Handlers
 * 
 * Handles benefit grant/revocation events from Polar webhooks.
 * Benefits could include access grants, feature unlocks, etc.
 */

import { prisma } from "@/lib/db";

/**
 * Handle benefit_grant.created event
 */
export async function handleBenefitGrantCreated(data: any) {
    console.log("Processing benefit_grant.created event:", data.id);

    try {
        const benefitGrant = data;

        // Find user by customer ID
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { polarCustomerId: benefitGrant.customer_id },
                ],
            },
        });

        if (!user) {
            console.log(`User not found for benefit grant ${benefitGrant.id}`);
            return { success: true };
        }

        console.log(`Benefit grant ${benefitGrant.id} created for user ${user.id}`);

        // TODO: Process benefit grants
        // This could enable specific features, grant access tokens, etc.
        // Depends on what benefits you configure in Polar

        return { success: true };
    } catch (error) {
        console.error("Error handling benefit_grant.created:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle benefit_grant.updated event
 */
export async function handleBenefitGrantUpdated(data: any) {
    console.log("Processing benefit_grant.updated event:", data.id);

    try {
        const benefitGrant = data;

        // Find user by customer ID
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { polarCustomerId: benefitGrant.customer_id },
                ],
            },
        });

        if (!user) {
            console.log(`User not found for benefit grant ${benefitGrant.id}`);
            return { success: true };
        }

        console.log(`Benefit grant ${benefitGrant.id} updated for user ${user.id}`);

        // TODO: Update benefit state

        return { success: true };
    } catch (error) {
        console.error("Error handling benefit_grant.updated:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Handle benefit_grant.revoked event
 */
export async function handleBenefitGrantRevoked(data: any) {
    console.log("Processing benefit_grant.revoked event:", data.id);

    try {
        const benefitGrant = data;

        // Find user by customer ID
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { polarCustomerId: benefitGrant.customer_id },
                ],
            },
        });

        if (!user) {
            console.log(`User not found for benefit grant ${benefitGrant.id}`);
            return { success: true };
        }

        console.log(`Benefit grant ${benefitGrant.id} revoked for user ${user.id}`);

        // TODO: Revoke benefit access
        // This could disable features, revoke access tokens, etc.

        return { success: true };
    } catch (error) {
        console.error("Error handling benefit_grant.revoked:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
