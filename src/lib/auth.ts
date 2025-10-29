import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { assignPlanToUser } from "@/lib/subscription";

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        // Google OAuth Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
        }),

        // GitHub OAuth Provider
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID || "",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
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

                // Check if email is verified
                if (!user.emailVerified) {
                    throw new Error("Please verify your email before signing in");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid credentials");
                }

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
            } catch (error) {
                console.error("Error assigning Hobby plan to OAuth user:", error);
                // Don't fail the signup if plan assignment fails
            }
        },
        // Handle account linking and provider email management
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async linkAccount(message: any) {
            const { account, user } = message;

            // When a user links an OAuth account (Google/GitHub), add their provider email
            if (account.provider === "google" || account.provider === "github") {
                try {
                    const userId = user.id;
                    const providerEmail = user.email;

                    if (!providerEmail) {
                        console.log(`No email found for ${account.provider} account`);
                        return;
                    }

                    // Check if this email already exists in UserEmail table
                    const existingUserEmail = await prisma.userEmail.findUnique({
                        where: { email: providerEmail },
                    });

                    if (!existingUserEmail) {
                        // Add the provider email as verified and primary (if it's the user's first email)
                        const emailCount = await prisma.userEmail.count({
                            where: { userId },
                        });

                        // Check if user's main email matches this provider email
                        const mainUser = await prisma.user.findUnique({
                            where: { id: userId },
                            select: { email: true },
                        });

                        const isMainEmail = mainUser?.email === providerEmail;

                        await prisma.userEmail.create({
                            data: {
                                userId,
                                email: providerEmail,
                                isVerified: true, // Provider emails are pre-verified
                                isPrimary: isMainEmail || emailCount === 0, // Make primary if it's the main email or first email
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                            },
                        });

                        console.log(`✅ Added ${account.provider} email to user's email list: ${providerEmail}`);
                    } else if (existingUserEmail.userId !== userId) {
                        // Email belongs to another user - this is a conflict
                        console.warn(`⚠️ Email ${providerEmail} from ${account.provider} already belongs to another user`);
                    } else {
                        // Update provider info if email already exists for this user
                        await prisma.userEmail.update({
                            where: { id: existingUserEmail.id },
                            data: {
                                provider: account.provider,
                                providerAccountId: account.providerAccountId,
                                isVerified: true,
                            },
                        });
                        console.log(`✅ Updated provider info for ${providerEmail}`);
                    }
                } catch (error) {
                    console.error(`Error managing ${account.provider} email:`, error);
                    // Don't fail the OAuth login if email management fails
                }
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
                    return true; // Allow sign in, but email management won't work
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
                        // This is account linking - the account will be automatically linked
                        // by NextAuth's adapter, and our linkAccount event will handle UserEmail
                        console.log(`🔗 Linking ${account.provider} account to existing user: ${email}`);
                    }
                } catch (error) {
                    console.error(`Error checking for existing user during ${account.provider} sign in:`, error);
                }
            }

            return true; // Allow sign in
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async jwt({ token, user, trigger, session }: any) {
            if (user) {
                token.id = user.id;
                token.emailVerified = user.emailVerified;
                token.hasPassword = !!user.password;
            }

            // Handle session updates from the client (e.g., profile updates)
            if (trigger === "update" && session) {
                if (session.name !== undefined) {
                    token.name = session.name;
                }
                if (session.email !== undefined) {
                    token.email = session.email;
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
            return session;
        },
    },
    debug: process.env.NODE_ENV === "development",
};
