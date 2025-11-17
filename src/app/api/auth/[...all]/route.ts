import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Better Auth API Route Handler
 * 
 * All authentication is handled by Better Auth with built-in features:
 * - Rate limiting (configured in auth.ts)
 * - Session management
 * - 2FA, OAuth, email/password auth
 * - Account banning (admin plugin)
 */
const handlers = toNextJsHandler(auth);

export const GET = handlers.GET;
export const POST = handlers.POST;
