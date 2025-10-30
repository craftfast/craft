import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { assignPlanToUser } from "@/lib/subscription";
import { logSecurityEvent, logLockoutCleared } from "@/lib/security-logger";

// Validate that NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET) {
    throw new Error(
        "NEXTAUTH_SECRET is not set. Please add it to your environment variables."
    );
}

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        // Google OAuth Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),

        // GitHub OAuth Provider
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
        }),

        // Email + Password Provider
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                });

                if (!user || !user.password) {
                    throw new Error("Invalid credentials");
                }

                // Check if account is locked (Issue 13)
                if (user.lockedUntil && user.lockedUntil > new Date()) {
                    const remainingMinutes = Math.ceil(
                        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
                    );
                    throw new Error(
                        `Account is locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`
                    );
                }

                // Check if email is verified
                if (!user.emailVerified) {
                    throw new Error("Please verify your email before signing in");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    // Increment failed login attempts (Issue 13)
                    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
                    const LOCKOUT_THRESHOLD = 5;
                    const LOCKOUT_DURATION_MINUTES = 30; // 30 minutes

                    // Log failed login attempt (Issue 16)
                    await logSecurityEvent({
                        userId: user.id,
                        eventType: "LOGIN_FAILED",
                        email: user.email,
                        success: false,
                        errorReason: "Invalid password",
                        severity: "warning",
                    });

                    if (failedAttempts >= LOCKOUT_THRESHOLD) {
                        // Lock the account for 30 minutes
                        const lockedUntil = new Date(
                            Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
                        );

                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                failedLoginAttempts: failedAttempts,
                                lockedUntil,
                                lastFailedLoginAt: new Date(),
                            },
                        });

                        // Log account lockout (Issue 16)
                        await logSecurityEvent({
                            userId: user.id,
                            eventType: "ACCOUNT_LOCKED",
                            email: user.email,
                            success: true,
                            severity: "critical",
                            metadata: {
                                failedAttempts,
                                lockoutDurationMinutes: LOCKOUT_DURATION_MINUTES,
                            },
                        });

                        throw new Error(
                            `Account locked due to ${LOCKOUT_THRESHOLD} failed login attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.`
                        );
                    } else {
                        // Update failed attempts count
                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                failedLoginAttempts: failedAttempts,
                                lastFailedLoginAt: new Date(),
                            },
                        });

                        throw new Error("Invalid credentials");
                    }
                }

                // Successful login - reset failed attempts and unlock account (Issue 13)
                if (user.failedLoginAttempts > 0 || user.lockedUntil) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedLoginAttempts: 0,
                            lockedUntil: null,
                            lastFailedLoginAt: null,
                        },
                    });

                    // Log lockout cleared (Issue 16)
                    if (user.lockedUntil) {
                        await logLockoutCleared(user.id, user.email);
                    }
                }

                // Log successful login (Issue 16)
                await logSecurityEvent({
                    userId: user.id,
                    eventType: "LOGIN_SUCCESS",
                    email: user.email,
                    success: true,
                });

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
        updateAge: 24 * 60 * 60, // 24 hours in seconds
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    events: {
        // Assign Hobby plan when a new user is created via OAuth (Google/GitHub)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async createUser(message: any) {
            const userId = message.user.id;
            const email = message.user.email;
            try {
                await assignPlanToUser(userId, "HOBBY");
                console.log(`✅ Hobby plan assigned to new OAuth user: ${email}`);

                // Log account creation (Issue 16)
                await logSecurityEvent({
                    userId,
                    eventType: "ACCOUNT_CREATED",
                    email,
                    success: true,
                });
            } catch (error) {
                console.error("Error assigning Hobby plan to OAuth user:", error);
                // Don't fail the signup if plan assignment fails
            }
        },
        // Handle account linking and provider email management
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async linkAccount(message: any) {
            const { account, user } = message;

            // When a user links an OAuth account (Google/GitHub), just log it
            if (account.provider === "google" || account.provider === "github") {
                console.log(`✅ ${account.provider} account linked successfully`);

                // Log account linking (Issue 16)
                await logSecurityEvent({
                    userId: user.id,
                    eventType: "ACCOUNT_LINKED",
                    email: user.email,
                    provider: account.provider,
                    success: true,
                    severity: "warning",
                });
            }
        },
    },
    callbacks: {
        // Handle account linking for OAuth sign-ins
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async signIn({ user, account, profile }: any) {
            // For OAuth providers (Google, GitHub)
            if (account?.provider === "google" || account?.provider === "github") {
                const email = user?.email || profile?.email;

                if (!email) {
                    console.warn(`No email provided by ${account.provider}`);
                    return true; // Allow sign in, but account linking won't work
                }

                try {
                    // Check if a user with this email already exists
                    const existingUser = await prisma.user.findUnique({
                        where: { email },
                        include: {
                            accounts: {
                                where: {
                                    provider: account.provider,
                                },
                            },
                        },
                    });

                    // If user exists but doesn't have this OAuth provider linked yet
                    if (existingUser && existingUser.accounts.length === 0) {
                        // Account linking detected - create a pending link request
                        console.log(`🔒 Account linking requires confirmation for ${account.provider} → ${email}`);

                        // Generate a unique token for confirmation
                        const token = `${existingUser.id}_${account.provider}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
                        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                        // Delete any existing pending links for this user + provider
                        await prisma.pendingAccountLink.deleteMany({
                            where: {
                                userId: existingUser.id,
                                provider: account.provider,
                            },
                        });

                        // Create pending account link
                        await prisma.pendingAccountLink.create({
                            data: {
                                userId: existingUser.id,
                                email,
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                token,
                                expiresAt,
                            },
                        });

                        // Prevent automatic linking by returning false and redirecting
                        // NextAuth will not create the account link
                        return `/auth/confirm-link?token=${token}`;
                    }
                } catch (error) {
                    console.error(`Error checking for existing user during ${account.provider} sign in:`, error);
                }
            }

            return true; // Allow sign in
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async jwt({ token, user, trigger, session, account }: any) {
            if (user) {
                token.id = user.id;
                token.emailVerified = user.emailVerified;
                token.hasPassword = !!user.password;
            }

            // Session fingerprinting (Issue 14)
            // Capture IP address and user-agent for security monitoring
            // Note: In Edge runtime or middleware, these would be available from headers
            // For API routes, we'll capture them during sign-in
            if (account || trigger === "signIn") {
                // Try to get request context from NextAuth internals
                // This works during initial sign-in when account is present
                try {
                    // In a real-world scenario, you'd pass these via custom parameters
                    // or extract from headers in API routes that call NextAuth
                    // For now, we'll set placeholders that can be updated via session update
                    if (!token.ipAddress) {
                        token.ipAddress = "unknown";
                    }
                    if (!token.userAgent) {
                        token.userAgent = "unknown";
                    }
                } catch (error) {
                    console.error("Error capturing session fingerprint:", error);
                }
            }

            // Handle session updates from the client (e.g., profile updates)
            if (trigger === "update" && session) {
                if (session.name !== undefined) {
                    token.name = session.name;
                }
                if (session.email !== undefined) {
                    token.email = session.email;
                }
                // Update fingerprint if provided (from client-side session update)
                if (session.ipAddress !== undefined) {
                    token.ipAddress = session.ipAddress;
                }
                if (session.userAgent !== undefined) {
                    token.userAgent = session.userAgent;
                }
                // Don't store image in token - it will be fetched from DB
                // This prevents massive session cookies when using base64 images
            }

            return token;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async session({ session, token }: any) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                session.user.emailVerified = token.emailVerified as Date | null;
                session.user.hasPassword = token.hasPassword as boolean;

                // Fetch fresh user data including image from database
                // This avoids storing large base64 images in the session cookie
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { image: true }
                });
                session.user.image = dbUser?.image || null;
            }

            // Add session fingerprinting data (Issue 14)
            session.ipAddress = token.ipAddress as string | undefined;
            session.userAgent = token.userAgent as string | undefined;

            return session;
        },
    },
    debug: process.env.NODE_ENV === "development",
};
