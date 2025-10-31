import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Session type from Better Auth
 */
export type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

/**
 * Get the current session on the server side.
 * Replaces NextAuth's getServerSession.
 * 
 * @example
 * ```typescript
 * import { getSession } from "@/lib/get-session";
 * 
 * export default async function Page() {
 *   const session = await getSession();
 *   if (!session) {
 *     redirect('/auth/signin');
 *   }
 *   return <div>Hello {session.user.name}</div>;
 * }
 * ```
 */
export async function getSession(): Promise<Session> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    return session;
}

/**
 * Get the current session or throw an error if not authenticated.
 * Useful for protected routes that require authentication.
 * 
 * @example
 * ```typescript
 * import { requireSession } from "@/lib/get-session";
 * 
 * export default async function Page() {
 *   const session = await requireSession();
 *   return <div>Hello {session.user.name}</div>;
 * }
 * ```
 */
export async function requireSession(): Promise<NonNullable<Session>> {
    const session = await getSession();

    if (!session) {
        throw new Error("Unauthorized - Session required");
    }

    return session;
}
