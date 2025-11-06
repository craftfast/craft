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
import { sendPasswordResetEmail, sendOTPEmail } from "@/lib/email";
import { assignPlanToUser } from "@/lib/subscription";
import { validatePassword } from "@/lib/password-validation";
import { createPolarCustomer } from "@/lib/polar/customer";

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
            // This is now deprecated - we use OTP verification instead
            // Keeping this for backward compatibility with old magic links
            console.log(`⚠️ Magic link verification requested for ${user.email} - redirecting to OTP flow`);
        },
        sendOnSignUp: false, // Disabled - we handle OTP sending manually in signup flow
        sendOnSignIn: false, // Disabled - we handle OTP sending manually in signin flow
        autoSignInAfterVerification: false, // Require manual sign-in after verification
        async afterEmailVerification(user, request) {
            // Log email verification event
            await logEmailVerified(user.id, user.email, request as Request);
            console.log(`✅ Email verified for user: ${user.email}`);
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 12, // Better Auth built-in validation
        maxPasswordLength: 128, // Better Auth built-in validation
        sendResetPassword: async ({ user, url, token }, request) => {
            // Log password reset request
            await logPasswordResetRequested(user.email, request as Request);

            // Send password reset email
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
            async sendVerificationOTP({ email, otp, type }) {
                // Send OTP email using the dedicated OTP email template
                await sendOTPEmail(email, otp, type);

                console.log(`📧 Sent ${type} OTP to ${email}: ${otp}`);
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
        // Before hook - Validate passwords and business logic
        before: createAuthMiddleware(async (ctx) => {
            const request = ctx.request;

            if (!request) {
                return;
            }

            // Validate password strength for sign-up and password reset
            if (ctx.path === "/sign-up/email" || ctx.path === "/reset-password") {
                const password = ctx.body?.password;

                if (password && typeof password === "string") {
                    const validation = validatePassword(password);

                    if (!validation.isValid) {
                        throw new Error(validation.errors[0]);
                    }
                }
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

            // Log all session creations for debugging
            if (newSession) {
                console.log(`🔍 New session created on path: ${ctx.path}`);
            }

            // Handle successful OAuth sign-in (Google or GitHub)
            // Better Auth uses /callback/:id for OAuth callbacks
            const isOAuthPath = ctx.path.startsWith("/sign-in/social") ||
                ctx.path.startsWith("/callback/") ||
                ctx.path.includes("/callback/");

            if (isOAuthPath && newSession) {
                console.log(`🔍 OAuth sign-in detected: ${ctx.path}`);
                console.log(`🔍 Full context path: ${JSON.stringify({ path: ctx.path, method: ctx.request?.method })}`);

                // Try to determine provider from the session or accounts
                let provider = "oauth";
                try {
                    const accounts = await prisma.account.findMany({
                        where: { userId: newSession.session.userId },
                    });
                    if (accounts.length > 0) {
                        provider = accounts[0].providerId || "oauth";
                    }
                } catch (e) {
                    console.log("Could not determine OAuth provider, using 'oauth'");
                }

                await logLoginSuccess(
                    newSession.session.userId,
                    newSession.user.email,
                    request,
                    provider
                );

                // Create Polar customer if user doesn't have one yet
                // This handles both new signups and existing users who haven't been migrated
                try {
                    const user = await prisma.user.findUnique({
                        where: { id: newSession.session.userId },
                    });

                    console.log(`🔍 User fetched: ${user?.email}, polarCustomerId: ${user?.polarCustomerId || 'NOT SET'}`);

                    if (user && !user.polarCustomerId) {
                        // User doesn't have Polar customer - create one
                        console.log(`🔄 Creating Polar customer for OAuth user: ${user.email}`);

                        createPolarCustomer(user)
                            .then((result) => {
                                if (result.success && 'customerId' in result) {
                                    console.log(`✅ Polar customer created for OAuth user: ${user.email}`);
                                } else if (!result.success && 'error' in result) {
                                    console.error(`❌ Failed to create Polar customer: ${result.error}`);
                                }
                            })
                            .catch((error) => {
                                console.error("Error creating Polar customer:", error);
                            });
                    } else if (user?.polarCustomerId) {
                        console.log(`✓ OAuth user already has Polar customer: ${user.email}`);
                    }
                } catch (customerError) {
                    console.error("Error checking OAuth user for Polar customer creation:", customerError);
                }
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

                // Create Polar customer account (async, non-blocking)
                try {
                    // Fetch user with full details
                    const user = await prisma.user.findUnique({
                        where: { id: newSession.session.userId },
                    });

                    if (user && !user.polarCustomerId) {
                        // User doesn't have Polar customer - create one
                        console.log(`🔄 Creating Polar customer for new user: ${user.email}`);

                        // Create Polar customer in background (don't block signup)
                        createPolarCustomer(user)
                            .then((result) => {
                                if (result.success && 'customerId' in result) {
                                    console.log(`✅ Polar customer created for user: ${newSession.user.email}`);
                                } else if (!result.success && 'error' in result) {
                                    console.error(`❌ Failed to create Polar customer: ${result.error}`);
                                }
                            })
                            .catch((error) => {
                                console.error("Error creating Polar customer:", error);
                            });
                    } else if (user?.polarCustomerId) {
                        console.log(`✓ User already has Polar customer: ${user.email}`);
                    }
                } catch (customerError) {
                    console.error("Error initiating Polar customer creation:", customerError);
                    // Don't fail the registration if customer creation fails
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
