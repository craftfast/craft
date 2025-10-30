"use client";

/**
 * Better Auth doesn't require a SessionProvider wrapper like NextAuth did.
 * This component is kept for backward compatibility and can be removed
 * once all components are updated.
 *
 * Better Auth sessions are managed automatically through the authClient.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
