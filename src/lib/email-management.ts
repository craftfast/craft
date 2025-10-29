import { prisma } from "@/lib/db";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";

/**
 * Generate a verification token for email verification
 */
export function generateEmailVerificationToken(): {
    token: string;
    expiry: Date;
} {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return { token, expiry };
}

/**
 * Add a new email address to user's account
 * @param userId - User ID
 * @param email - Email address to add
 * @returns UserEmail record or error
 */
export async function addUserEmail(userId: string, email: string) {
    // Check if user already has 3 emails
    const emailCount = await prisma.userEmail.count({
        where: { userId },
    });

    if (emailCount >= 3) {
        throw new Error("Maximum of 3 email addresses allowed");
    }

    // Check if email already exists (either in User table or UserEmail table)
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("This email is already in use");
    }

    const existingUserEmail = await prisma.userEmail.findUnique({
        where: { email },
    });

    if (existingUserEmail) {
        throw new Error("This email is already in use");
    }

    // Generate verification token
    const { token, expiry } = generateEmailVerificationToken();

    // Create the user email record
    const userEmail = await prisma.userEmail.create({
        data: {
            userId,
            email,
            isVerified: false,
            isPrimary: false,
            verificationToken: token,
            verificationExpiry: expiry,
            provider: "credentials",
        },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/verify?token=${token}`;

    await sendEmail({
        to: email,
        subject: "Verify your email address",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">
          This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
    });

    return userEmail;
}

/**
 * Verify an email address using the verification token
 */
export async function verifyUserEmail(token: string) {
    const userEmail = await prisma.userEmail.findUnique({
        where: { verificationToken: token },
    });

    if (!userEmail) {
        throw new Error("Invalid verification token");
    }

    if (userEmail.verificationExpiry && userEmail.verificationExpiry < new Date()) {
        throw new Error("Verification token has expired");
    }

    // Mark email as verified
    const updatedEmail = await prisma.userEmail.update({
        where: { id: userEmail.id },
        data: {
            isVerified: true,
            verificationToken: null,
            verificationExpiry: null,
        },
    });

    return updatedEmail;
}

/**
 * Make an email address the primary email
 * Only verified emails can be set as primary
 */
export async function makePrimaryEmail(userId: string, emailId: string) {
    const userEmail = await prisma.userEmail.findFirst({
        where: {
            id: emailId,
            userId,
        },
    });

    if (!userEmail) {
        throw new Error("Email not found");
    }

    if (!userEmail.isVerified) {
        throw new Error("Only verified emails can be set as primary");
    }

    // Use a transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
        // First, get the current primary email from the User table
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Check if current primary email exists in UserEmail table
        const currentPrimaryInUserEmails = await tx.userEmail.findFirst({
            where: {
                userId,
                email: user.email,
            },
        });

        // If it exists, mark it as non-primary
        if (currentPrimaryInUserEmails) {
            await tx.userEmail.update({
                where: { id: currentPrimaryInUserEmails.id },
                data: { isPrimary: false },
            });
        }

        // Mark all other emails as non-primary
        await tx.userEmail.updateMany({
            where: {
                userId,
                NOT: { id: emailId },
            },
            data: { isPrimary: false },
        });

        // Mark the selected email as primary
        await tx.userEmail.update({
            where: { id: emailId },
            data: { isPrimary: true },
        });

        // Update the User's main email field
        await tx.user.update({
            where: { id: userId },
            data: { email: userEmail.email },
        });
    });
}

/**
 * Delete an email address
 * Cannot delete provider-based emails or the current primary email
 */
export async function deleteUserEmail(userId: string, emailId: string) {
    const userEmail = await prisma.userEmail.findFirst({
        where: {
            id: emailId,
            userId,
        },
    });

    if (!userEmail) {
        throw new Error("Email not found");
    }

    // Check if this email is associated with an active OAuth provider
    if (userEmail.provider && userEmail.provider !== "credentials") {
        const account = await prisma.account.findFirst({
            where: {
                userId,
                provider: userEmail.provider,
                providerAccountId: userEmail.providerAccountId || undefined,
            },
        });

        if (account) {
            throw new Error(
                `Cannot delete email associated with ${userEmail.provider} authentication. Please disconnect the ${userEmail.provider} account first.`
            );
        }
    }

    // Prevent deletion of primary email
    if (userEmail.isPrimary) {
        const verifiedEmailCount = await prisma.userEmail.count({
            where: {
                userId,
                isVerified: true,
            },
        });

        if (verifiedEmailCount <= 1) {
            throw new Error(
                "You must have at least one verified email address. Add another verified email before deleting this one."
            );
        }

        throw new Error(
            "Cannot delete your primary email. Please set another email as primary first."
        );
    }

    await prisma.userEmail.delete({
        where: { id: emailId },
    });
}

/**
 * Get all emails for a user
 * Includes the primary email from User table if not already in UserEmail table
 */
export async function getUserEmails(userId: string) {
    // Get the user's primary email
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            email: true,
            emailVerified: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    // Get all emails from UserEmail table
    const userEmails = await prisma.userEmail.findMany({
        where: { userId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    // Check if the primary email from User table exists in UserEmail table
    const primaryEmailExists = userEmails.some(
        (email) => email.email === user.email
    );

    // If primary email doesn't exist in UserEmail table, add it to the response
    if (!primaryEmailExists && user.email) {
        // Create a UserEmail record for the primary email if it doesn't exist
        // This ensures the primary email is always tracked
        const primaryEmailRecord = await prisma.userEmail.upsert({
            where: { email: user.email },
            update: {
                isPrimary: true,
                isVerified: !!user.emailVerified,
            },
            create: {
                userId,
                email: user.email,
                isPrimary: true,
                isVerified: !!user.emailVerified,
                provider: "credentials", // Default to credentials for existing users
            },
        });

        // Add to the beginning of the array
        userEmails.unshift(primaryEmailRecord);
    }

    return userEmails;
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(userId: string, emailId: string) {
    const userEmail = await prisma.userEmail.findFirst({
        where: {
            id: emailId,
            userId,
        },
    });

    if (!userEmail) {
        throw new Error("Email not found");
    }

    if (userEmail.isVerified) {
        throw new Error("Email is already verified");
    }

    // Generate new verification token
    const { token, expiry } = generateEmailVerificationToken();

    // Update the record
    await prisma.userEmail.update({
        where: { id: emailId },
        data: {
            verificationToken: token,
            verificationExpiry: expiry,
        },
    });

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email/verify?token=${token}`;

    await sendEmail({
        to: userEmail.email,
        subject: "Verify your email address",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" 
           style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 40px;">
          This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
    });
}
