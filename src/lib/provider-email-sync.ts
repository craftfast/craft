import { prisma } from "@/lib/db";

/**
 * Sync OAuth provider email with user's email list
 * This handles cases where the user changes their email on Google/GitHub
 */
export async function syncProviderEmail(
    userId: string,
    provider: string,
    providerAccountId: string,
    newEmail: string
) {
    try {
        // Find the existing provider email record
        const existingProviderEmail = await prisma.userEmail.findFirst({
            where: {
                userId,
                provider,
                providerAccountId,
            },
        });

        if (!existingProviderEmail) {
            // First time seeing this provider - add the email
            const emailCount = await prisma.userEmail.count({
                where: { userId },
            });

            // Check if this email is already taken
            const emailExists = await prisma.userEmail.findUnique({
                where: { email: newEmail },
            });

            if (emailExists && emailExists.userId !== userId) {
                console.warn(`Email ${newEmail} from ${provider} already belongs to another user`);
                return null;
            }

            if (emailExists && emailExists.userId === userId) {
                // Update existing email with provider info
                return await prisma.userEmail.update({
                    where: { id: emailExists.id },
                    data: {
                        provider,
                        providerAccountId,
                        isVerified: true,
                    },
                });
            }

            // Create new email entry
            return await prisma.userEmail.create({
                data: {
                    userId,
                    email: newEmail,
                    isVerified: true,
                    isPrimary: emailCount === 0,
                    provider,
                    providerAccountId,
                },
            });
        }

        // If the email has changed on the provider side
        if (existingProviderEmail.email !== newEmail) {
            // Check if new email is already taken
            const emailTaken = await prisma.userEmail.findUnique({
                where: { email: newEmail },
            });

            if (emailTaken && emailTaken.userId !== userId) {
                console.warn(`Cannot sync ${provider} email: ${newEmail} belongs to another user`);
                return existingProviderEmail; // Keep the old email
            }

            // Update the email address
            const wasPrimary = existingProviderEmail.isPrimary;

            const updated = await prisma.userEmail.update({
                where: { id: existingProviderEmail.id },
                data: {
                    email: newEmail,
                    isVerified: true,
                },
            });

            // If this was the primary email, update the user's main email field too
            if (wasPrimary) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { email: newEmail },
                });
            }

            console.log(`✅ Synced ${provider} email change: ${existingProviderEmail.email} → ${newEmail}`);
            return updated;
        }

        // Email unchanged - just ensure it's verified
        if (!existingProviderEmail.isVerified) {
            return await prisma.userEmail.update({
                where: { id: existingProviderEmail.id },
                data: { isVerified: true },
            });
        }

        return existingProviderEmail;
    } catch (error) {
        console.error(`Error syncing ${provider} email:`, error);
        return null;
    }
}

/**
 * Check if a user can delete an email based on their auth providers
 */
export async function canDeleteEmail(userId: string, emailId: string): Promise<{
    canDelete: boolean;
    reason?: string;
}> {
    const userEmail = await prisma.userEmail.findFirst({
        where: {
            id: emailId,
            userId,
        },
    });

    if (!userEmail) {
        return { canDelete: false, reason: "Email not found" };
    }

    // Check if this email is associated with an OAuth provider
    if (userEmail.provider && userEmail.provider !== "credentials") {
        // Check if the user has an active account with this provider
        const account = await prisma.account.findFirst({
            where: {
                userId,
                provider: userEmail.provider,
                providerAccountId: userEmail.providerAccountId || undefined,
            },
        });

        if (account) {
            return {
                canDelete: false,
                reason: `This email is linked to your ${userEmail.provider} account. Please disconnect the ${userEmail.provider} account first.`,
            };
        }
    }

    // Check if this is the primary email
    if (userEmail.isPrimary) {
        const emailCount = await prisma.userEmail.count({
            where: { userId, isVerified: true },
        });

        if (emailCount <= 1) {
            return {
                canDelete: false,
                reason: "You must have at least one verified email address. Add another verified email before deleting this one.",
            };
        }

        return {
            canDelete: false,
            reason: "Cannot delete your primary email. Please set another email as primary first.",
        };
    }

    return { canDelete: true };
}
