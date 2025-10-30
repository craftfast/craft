import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";
import { createAuthMiddleware } from "better-auth/api";
import {
    logLoginSuccess,
    logAccountCreated,
    logEmailVerified,
    logAccountLinked,
} from "@/lib/security-logger";
import {
    checkAccountLockout,
    incrementFailedAttempts,
    clearFailedAttempts,
} from "@/lib/auth-lockout";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
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
    },
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google", "github"],
        },
    },
    hooks: {
        // Before hook - Rate limiting and account lockout checks
        before: createAuthMiddleware(async (ctx) => {
            const request = ctx.request;

            // Only apply rate limiting and lockout checks to sensitive authentication endpoints
            const rateLimitedPaths = [
                "/sign-in/email",
                "/sign-up/email",
                "/forget-password",
                "/reset-password",
            ];

            if (!request || !rateLimitedPaths.some(path => ctx.path === path)) {
                return;
            }

            // Extract client IP for rate limiting
            const clientIp = getClientIp(request);
            const identifier = `auth:${clientIp}`;

            // Check rate limit (5 attempts per hour per IP)
            const { success, limit, remaining, reset } = await checkRateLimit(identifier);

            if (!success) {
                const resetDate = new Date(reset);
                const minutesUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / 60000);

                throw new Error(
                    `Too many authentication attempts. Please try again in ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''}.`
                );
            }

            // Add rate limit info to response headers (for client visibility)
            if (ctx.context.response) {
                ctx.context.response.headers.set("X-RateLimit-Limit", limit.toString());
                ctx.context.response.headers.set("X-RateLimit-Remaining", remaining.toString());
                ctx.context.response.headers.set("X-RateLimit-Reset", reset.toString());
            }

            // Check account lockout for email sign-in attempts
            if (ctx.path === "/sign-in/email") {
                const email = ctx.body?.email;

                if (email && typeof email === "string") {
                    const lockoutStatus = await checkAccountLockout(email);

                    if (lockoutStatus.locked) {
                        throw new Error(
                            lockoutStatus.message ||
                            `Account locked. Try again in ${lockoutStatus.remainingMinutes} minutes.`
                        );
                    }
                }
            }
        }),

        // After hook - Log successful events and clear failed attempts
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

                // Clear failed login attempts on successful login
                await clearFailedAttempts(newSession.session.userId);
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

                // Clear failed login attempts on successful OAuth login
                await clearFailedAttempts(newSession.session.userId);
            }

            // Handle successful account creation
            if (ctx.path === "/sign-up/email" && newSession) {
                await logAccountCreated(
                    newSession.session.userId,
                    newSession.user.email,
                    request
                );
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
        }),
    },
});

export default auth;
