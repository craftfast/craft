import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor, admin, emailOTP, lastLoginMethod } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";
import { createAuthMiddleware } from "better-auth/api";
import {
    logLoginSuccess,
    logAccountCreated,
    logEmailVerified,
    logAccountLinked,
    logPasswordResetRequested,
    logPasswordResetSuccess,
    logLoginFailure,
    logPasswordResetFailed,
} from "@/lib/security-logger";
import { sendPasswordResetEmail, sendVerificationEmail, sendOTPEmail } from "@/lib/email";
import { assignPlanToUser } from "@/lib/subscription";

// Validate required environment variables
if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error(
        "BETTER_AUTH_SECRET is not set. Please add it to your environment variables."
    );
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    appName: "Craft",
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }, request) => {
            // This is now only used as a fallback - OTP is the primary method
            await sendVerificationEmail({ user, url, token });
        },
        sendOnSignUp: false, // Disabled - using OTP instead
        sendOnSignIn: false, // Disabled - using OTP instead
        autoSignInAfterVerification: false,
        async afterEmailVerification(user, request) {
            // Log email verification event
            await logEmailVerified(user.id, user.email, request as Request);
            console.log(`✅ Email verified for user: ${user.email}`);
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url, token }, request) => {
            // This is now only used as a fallback - OTP is the primary method
            await logPasswordResetRequested(user.email, request as Request);
            await sendPasswordResetEmail(user.email, token, url);
        },
        async onPasswordReset({ user }, request) {
            // Log password reset success
            await logPasswordResetSuccess(user.id, user.email, request as Request);
            console.log(`✅ Password reset for user: ${user.email}`);
        },
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes cache
        },
    },
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "github"],
            // Security: Only allow linking OAuth accounts with matching email addresses
            // This prevents account hijacking and maintains clear account ownership
            allowDifferentEmails: false,
        },
    },
    // Better Auth built-in rate limiting (replaces custom implementation)
    rateLimit: {
        enabled: true,
        window: 60, // 60 seconds
        max: 100, // max 100 requests per window
        storage: "database",
        modelName: "rateLimit",
        customRules: {
            "/sign-in/email": {
                window: 10,
                max: 3,
            },
            "/sign-up/email": {
                window: 60,
                max: 5,
            },
            "/forget-password": {
                window: 60,
                max: 3,
            },
            "/reset-password": {
                window: 60,
                max: 3,
            },
            "/two-factor/verify-totp": {
                window: 10,
                max: 3,
            },
            "/two-factor/verify-otp": {
                window: 10,
                max: 3,
            },
        },
    },
    plugins: [
        // 2FA Plugin
        twoFactor({
            issuer: "Craft",
            backupCodeOptions: {
                amount: 10,
                length: 10,
            },
        }),
        // Admin Plugin - for user management, roles, banning
        admin({
            defaultRole: "user",
            adminRoles: ["admin"],
        }),
        // Email OTP Plugin - for passwordless auth and verification
        emailOTP({
            // Override default email verification to use OTP instead of links
            overrideDefaultEmailVerification: true,
            // Send OTP email on signup for verification
            sendVerificationOnSignUp: true,
            async sendVerificationOTP({ email, otp, type }) {
                // Send OTP email based on type
                await sendOTPEmail(email, otp, type);

                const typeLabels = {
                    "sign-in": "Sign In",
                    "email-verification": "Email Verification",
                    "forget-password": "Password Reset",
                };

                console.log(`📧 Sent ${typeLabels[type]} OTP to ${email}: ${otp}`);
            },
            otpLength: 6,
            expiresIn: 300, // 5 minutes
            allowedAttempts: 3,
        }),
        // Last Login Method Plugin - track user's preferred login method
        lastLoginMethod({
            storeInDatabase: true,
            cookieName: "craft.last_login_method",
            maxAge: 60 * 60 * 24 * 30, // 30 days
        }),
        // Next.js Cookies Plugin - MUST BE LAST!
        // Fixes server action cookie issues
        nextCookies(),
    ],
    hooks: {
        // Before hook - Simplified to only handle business logic validation
        before: createAuthMiddleware(async (ctx) => {
            const request = ctx.request;

            if (!request) {
                return;
            }

            // Note: Rate limiting is now handled by Better Auth's built-in rate limiter
            // Note: Account lockout is now handled by Better Auth's admin plugin (ban feature)
            // Note: Session fingerprinting is automatically handled by Better Auth sessions
        }),

        // After hook - Log successful events
        after: createAuthMiddleware(async (ctx) => {
            const newSession = ctx.context.newSession;
            const request = ctx.request;

            // Skip if no request
            if (!request) return;

            // Handle successful email sign-in
            if (ctx.path === "/sign-in/email" && newSession) {
                await logLoginSuccess(
                    newSession.session.userId,
                    newSession.user.email,
                    request,
                    "email"
                );
            }

            // Handle failed email sign-in (no session created)
            if (ctx.path === "/sign-in/email" && !newSession && ctx.context.returned === false) {
                const email = ctx.body?.email;

                if (email && typeof email === "string") {
                    // Log failed login attempt
                    await logLoginFailure(email, request, "Invalid credentials");
                }
            }

            // Handle successful OAuth sign-in (Google or GitHub)
            if (ctx.path.startsWith("/sign-in/social") && newSession) {
                const provider = ctx.path.includes("google") ? "google" :
                    ctx.path.includes("github") ? "github" :
                        "oauth";

                await logLoginSuccess(
                    newSession.session.userId,
                    newSession.user.email,
                    request,
                    provider
                );
            }

            // Handle successful account creation
            if (ctx.path === "/sign-up/email" && newSession) {
                await logAccountCreated(
                    newSession.session.userId,
                    newSession.user.email,
                    request
                );

                // Assign default Hobby plan to new user
                try {
                    await assignPlanToUser(newSession.session.userId, "HOBBY");
                    console.log(`✅ Hobby plan assigned to user: ${newSession.user.email}`);
                } catch (planError) {
                    console.error("Error assigning Hobby plan:", planError);
                    // Don't fail the registration if plan assignment fails
                }
            }

            // Handle email verification
            if (ctx.path === "/verify-email" && ctx.context.returned) {
                const email = ctx.body?.email;
                const userId = ctx.body?.userId;

                if (email && userId) {
                    await logEmailVerified(
                        userId,
                        email,
                        request
                    );
                }
            }

            // Handle account linking (OAuth account linked to existing account)
            if (ctx.path === "/link-account" && ctx.context.returned) {
                const email = ctx.body?.email;
                const userId = ctx.body?.userId;
                const provider = ctx.body?.provider;

                if (email && userId && provider) {
                    await logAccountLinked(
                        userId,
                        email,
                        provider,
                        request
                    );
                }
            }

            // Handle password reset success
            if (ctx.path === "/reset-password" && ctx.context.returned) {
                const email = ctx.body?.email;
                const userId = ctx.body?.userId;

                if (email && userId) {
                    await logPasswordResetSuccess(
                        userId,
                        email,
                        request
                    );
                }
            }

            // Handle failed password reset (invalid/expired token, weak password, etc.)
            if (ctx.path === "/reset-password" && !ctx.context.returned && ctx.context.returned === false) {
                const email = ctx.body?.email;

                if (email && typeof email === "string") {
                    const errorMessage = ctx.context.error?.message || "Password reset failed";
                    await logPasswordResetFailed(email, request, errorMessage);
                }
            }
        }),
    },
});

export default auth;
