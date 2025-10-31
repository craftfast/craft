import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    plugins: [
        twoFactorClient({
            onTwoFactorRedirect() {
                // Redirect to 2FA verification page
                window.location.href = "/auth/verify-2fa";
            },
        }),
    ],
});

// Export all auth methods
export const { signIn, signOut, signUp, useSession, forgetPassword, resetPassword, twoFactor } = authClient;

// Export the full client for advanced usage
export default authClient;
