import { createAuthClient } from "better-auth/react";
import {
    twoFactorClient,
    adminClient,
    emailOTPClient,
    lastLoginMethodClient
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    plugins: [
        // 2FA Client
        twoFactorClient({
            onTwoFactorRedirect() {
                // Redirect to 2FA verification page
                window.location.href = "/auth/verify-2fa";
            },
        }),
        // Admin Client - for user management
        adminClient(),
        // Email OTP Client - for passwordless auth
        emailOTPClient(),
        // Last Login Method Client - track user's preferred login
        lastLoginMethodClient(),
    ],
});

// Export all auth methods
export const {
    signIn,
    signOut,
    signUp,
    useSession,
    forgetPassword,
    resetPassword,
    changePassword,
    updateUser,
    linkSocial,
    unlinkAccount,
    listAccounts,
    twoFactor,
    sendVerificationEmail,
    verifyEmail,
    // Admin methods
    admin,
    // Email OTP methods
    emailOtp,
} = authClient;

// Export the full client for advanced usage
export default authClient;
