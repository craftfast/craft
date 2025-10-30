import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

// Export all auth methods
export const { signIn, signOut, signUp, useSession } = authClient;

// Export the full client for advanced usage
export default authClient;
