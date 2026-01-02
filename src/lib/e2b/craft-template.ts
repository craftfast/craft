/**
 * Craft E2B Template Builder
 * 
 * This creates a production-ready E2B template with:
 * - Node.js 24 (slim variant)
 * - pnpm 9.15.4 pre-installed
 * - Complete Next.js 15 + shadcn/ui base project pre-built
 * - All dependencies installed and cached
 * 
 * Benefits:
 * - Sandbox spawns in ~150ms with project READY TO USE
 * - No copying or initialization needed - project is already there!
 * - shadcn/ui components ready to add
 * - Consistent, tested setup every time
 * 
 * What's included:
 * 
 * Frontend:
 * - Next.js 15 + React 19 + TypeScript
 * - Tailwind CSS v4 (@tailwindcss/postcss)
 * - shadcn/ui (10+ components) + Sonner (toasts)
 * - Dark mode (next-themes)
 * 
 * Backend & Services (Supabase Pro Integration):
 * - Supabase Database (PostgreSQL) - managed by Craft
 * - Drizzle ORM (type-safe database queries)
 * - Supabase Auth (authentication) - SSO, OAuth, magic links
 * - Supabase Storage (file storage) - S3-compatible
 * - Supabase Realtime (live updates)
 * - OpenRouter + AI SDK (AI features)
 * - Upstash Redis (caching/sessions)
 * - Resend (transactional emails)
 * - Polar (payments & subscriptions)
 * - PostHog (analytics/feature flags)
 * 
 * Deployment:
 * - Vercel (one-click deployment) - managed by Craft
 * - vercel.json pre-configured
 * - Environment variables auto-injected
 * 
 * DX:
 * - Zustand (state management)
 * - React Hook Form + Zod (forms/validation)
 * - Lucide React (icons)
 * - Prettier (code formatting)
 * - Professional folder structure
 * - Comprehensive .env.example
 * - All dependencies pre-installed
 */

import { Template, waitForURL } from "e2b";

/**
 * Build the Craft E2B template with a complete Next.js + shadcn/ui base project
 */
export function buildCraftTemplate() {
    return Template()
        // Start with Node.js 24 slim (Ubuntu-based, minimal image)
        .fromNodeImage("24-slim")

        // Install essential packages
        .aptInstall([
            "curl",           // For downloading files and health checks
            "ca-certificates", // For HTTPS connections
            "git",            // Required for shadcn/ui CLI
        ])

        // Install pnpm globally using E2B's npmInstall method
        .npmInstall("pnpm@latest", { g: true })

        // Create a complete Next.js + shadcn/ui base project
        // This will be available at /home/user/project (no copying needed!)
        .runCmd([
            // Create temp project directory (npm doesn't allow names starting with .)
            "mkdir -p /home/user/base-template",
            "cd /home/user/base-template",

            // 1. Initialize Next.js with our exact configuration
            "pnpm dlx create-next-app@latest craft-base --yes --ts --tailwind --app --src-dir --use-pnpm --turbopack --no-eslint --import-alias '@/*'",

            // Move to the created directory
            "cd craft-base",

            // 2. Install shadcn/ui dependencies
            "pnpm add class-variance-authority clsx tailwind-merge lucide-react",
            "pnpm add -D @types/node",

            // 3. Install commonly used packages for better DX
            "pnpm add zod react-hook-form @hookform/resolvers",
            "pnpm add zustand",

            // 3.5. Install Supabase for database, auth, and storage (Craft-managed)
            "pnpm add @supabase/supabase-js",
            "pnpm add @supabase/ssr",

            // 3.6. Install Drizzle ORM for type-safe database queries
            "pnpm add drizzle-orm postgres",
            "pnpm add -D drizzle-kit",

            // 3.7. Install production services
            "pnpm add resend",                          // Email service (transactional)
            "pnpm add ai",                              // Vercel AI SDK
            "pnpm add openai",                          // OpenAI SDK (for OpenRouter)
            "pnpm add @upstash/redis",                  // Redis for caching/sessions
            "pnpm add @polar-sh/nextjs",                // Polar payments adapter for Next.js
            "pnpm add posthog-js posthog-node",         // PostHog analytics
            "pnpm add next-themes",                     // Dark mode support
            "pnpm add sonner",                          // Toast notifications (instead of shadcn toast)

            // 4. Initialize shadcn/ui (creates components.json and lib/utils.ts)
            "pnpm dlx shadcn@latest init -y -d",

            // 5. Pre-install commonly used shadcn components (no toast - using Sonner instead)
            "pnpm dlx shadcn@latest add button card input label form select dialog dropdown-menu avatar badge --yes --overwrite || true",

            // 6. Create .env.example with Supabase + Vercel configuration
            "echo '# ============================================================================' > .env.example",
            "echo '# App Configuration' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'NEXT_PUBLIC_APP_URL=http://localhost:3000' >> .env.example",
            "echo '' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo '# Supabase (Database, Auth, Storage) - Managed by Craft' >> .env.example",
            "echo '# These are auto-injected when you enable database in project settings' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'NEXT_PUBLIC_SUPABASE_URL=\"https://your-project.supabase.co\"' >> .env.example",
            "echo 'NEXT_PUBLIC_SUPABASE_ANON_KEY=\"your-anon-key\"' >> .env.example",
            "echo 'SUPABASE_SERVICE_ROLE_KEY=\"your-service-role-key\"' >> .env.example",
            "echo 'DATABASE_URL=\"postgresql://postgres:password@db.your-project.supabase.co:5432/postgres\"' >> .env.example",
            "echo '' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo '# Email (Resend - Free tier: https://resend.com)' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'RESEND_API_KEY=\"re_xxxxxxxxxxxx\"' >> .env.example",
            "echo 'RESEND_FROM_EMAIL=\"onboarding@resend.dev\"' >> .env.example",
            "echo '' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo '# AI (OpenRouter - https://openrouter.ai)' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'OPENROUTER_API_KEY=\"sk-or-v1-xxxxxxxxxxxx\"' >> .env.example",
            "echo '' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo '# Redis (Upstash - Free tier: https://upstash.com)' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'UPSTASH_REDIS_REST_URL=\"https://xxxxx.upstash.io\"' >> .env.example",
            "echo 'UPSTASH_REDIS_REST_TOKEN=\"AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxA==\"' >> .env.example",
            "echo '' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo '# Payments (Polar - https://polar.sh)' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'POLAR_ACCESS_TOKEN=\"your-polar-access-token\"' >> .env.example",
            "echo 'POLAR_ORGANIZATION_ID=\"your-organization-id\"' >> .env.example",
            "echo 'POLAR_WEBHOOK_SECRET=\"your-webhook-secret\"' >> .env.example",
            "echo '' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo '# Analytics (PostHog - Free tier: https://posthog.com)' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'NEXT_PUBLIC_POSTHOG_KEY=\"phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\"' >> .env.example",
            "echo 'NEXT_PUBLIC_POSTHOG_HOST=\"https://app.posthog.com\"' >> .env.example",

            // 7. Create Supabase client helpers
            "mkdir -p src/lib/supabase",

            // 7.1. Create Supabase browser client
            "echo 'import { createBrowserClient } from \"@supabase/ssr\";' > src/lib/supabase/client.ts",
            "echo '' >> src/lib/supabase/client.ts",
            "echo 'export function createClient() {' >> src/lib/supabase/client.ts",
            "echo '  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;' >> src/lib/supabase/client.ts",
            "echo '  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;' >> src/lib/supabase/client.ts",
            "echo '' >> src/lib/supabase/client.ts",
            "echo '  if (!url || !key) {' >> src/lib/supabase/client.ts",
            "echo '    throw new Error(\"Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.\");' >> src/lib/supabase/client.ts",
            "echo '  }' >> src/lib/supabase/client.ts",
            "echo '' >> src/lib/supabase/client.ts",
            "echo '  return createBrowserClient(url, key);' >> src/lib/supabase/client.ts",
            "echo '}' >> src/lib/supabase/client.ts",
            "echo '' >> src/lib/supabase/client.ts",
            "echo '// Check if Supabase is configured' >> src/lib/supabase/client.ts",
            "echo 'export function isSupabaseConfigured() {' >> src/lib/supabase/client.ts",
            "echo '  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);' >> src/lib/supabase/client.ts",
            "echo '}' >> src/lib/supabase/client.ts",

            // 7.2. Create Supabase server client
            "echo 'import { createServerClient } from \"@supabase/ssr\";' > src/lib/supabase/server.ts",
            "echo 'import { cookies } from \"next/headers\";' >> src/lib/supabase/server.ts",
            "echo '' >> src/lib/supabase/server.ts",
            "echo 'export async function createClient() {' >> src/lib/supabase/server.ts",
            "echo '  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;' >> src/lib/supabase/server.ts",
            "echo '  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;' >> src/lib/supabase/server.ts",
            "echo '' >> src/lib/supabase/server.ts",
            "echo '  if (!url || !key) {' >> src/lib/supabase/server.ts",
            "echo '    throw new Error(\"Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.\");' >> src/lib/supabase/server.ts",
            "echo '  }' >> src/lib/supabase/server.ts",
            "echo '' >> src/lib/supabase/server.ts",
            "echo '  const cookieStore = await cookies();' >> src/lib/supabase/server.ts",
            "echo '' >> src/lib/supabase/server.ts",
            "echo '  return createServerClient(' >> src/lib/supabase/server.ts",
            "echo '    url,' >> src/lib/supabase/server.ts",
            "echo '    key,' >> src/lib/supabase/server.ts",
            "echo '    {' >> src/lib/supabase/server.ts",
            "echo '      cookies: {' >> src/lib/supabase/server.ts",
            "echo '        getAll() {' >> src/lib/supabase/server.ts",
            "echo '          return cookieStore.getAll();' >> src/lib/supabase/server.ts",
            "echo '        },' >> src/lib/supabase/server.ts",
            "echo '        setAll(cookiesToSet) {' >> src/lib/supabase/server.ts",
            "echo '          try {' >> src/lib/supabase/server.ts",
            "echo '            cookiesToSet.forEach(({ name, value, options }) =>' >> src/lib/supabase/server.ts",
            "echo '              cookieStore.set(name, value, options)' >> src/lib/supabase/server.ts",
            "echo '            );' >> src/lib/supabase/server.ts",
            "echo '          } catch {' >> src/lib/supabase/server.ts",
            "echo '            // Server Component - ignore' >> src/lib/supabase/server.ts",
            "echo '          }' >> src/lib/supabase/server.ts",
            "echo '        },' >> src/lib/supabase/server.ts",
            "echo '      },' >> src/lib/supabase/server.ts",
            "echo '    }' >> src/lib/supabase/server.ts",
            "echo '  );' >> src/lib/supabase/server.ts",
            "echo '}' >> src/lib/supabase/server.ts",

            // 7.3. Create Supabase proxy helper (Next.js 16+ uses proxy instead of middleware)
            "echo 'import { createServerClient } from \"@supabase/ssr\";' > src/lib/supabase/proxy.ts",
            "echo 'import { NextResponse, type NextRequest } from \"next/server\";' >> src/lib/supabase/proxy.ts",
            "echo '' >> src/lib/supabase/proxy.ts",
            "echo 'export async function updateSession(request: NextRequest) {' >> src/lib/supabase/proxy.ts",
            "echo '  let supabaseResponse = NextResponse.next({ request });' >> src/lib/supabase/proxy.ts",
            "echo '' >> src/lib/supabase/proxy.ts",
            "echo '  // Skip Supabase if not configured' >> src/lib/supabase/proxy.ts",
            "echo '  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {' >> src/lib/supabase/proxy.ts",
            "echo '    return supabaseResponse;' >> src/lib/supabase/proxy.ts",
            "echo '  }' >> src/lib/supabase/proxy.ts",
            "echo '' >> src/lib/supabase/proxy.ts",
            "echo '  const supabase = createServerClient(' >> src/lib/supabase/proxy.ts",
            "echo '    process.env.NEXT_PUBLIC_SUPABASE_URL,' >> src/lib/supabase/proxy.ts",
            "echo '    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,' >> src/lib/supabase/proxy.ts",
            "echo '    {' >> src/lib/supabase/proxy.ts",
            "echo '      cookies: {' >> src/lib/supabase/proxy.ts",
            "echo '        getAll() {' >> src/lib/supabase/proxy.ts",
            "echo '          return request.cookies.getAll();' >> src/lib/supabase/proxy.ts",
            "echo '        },' >> src/lib/supabase/proxy.ts",
            "echo '        setAll(cookiesToSet) {' >> src/lib/supabase/proxy.ts",
            "echo '          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));' >> src/lib/supabase/proxy.ts",
            "echo '          supabaseResponse = NextResponse.next({ request });' >> src/lib/supabase/proxy.ts",
            "echo '          cookiesToSet.forEach(({ name, value, options }) =>' >> src/lib/supabase/proxy.ts",
            "echo '            supabaseResponse.cookies.set(name, value, options)' >> src/lib/supabase/proxy.ts",
            "echo '          );' >> src/lib/supabase/proxy.ts",
            "echo '        },' >> src/lib/supabase/proxy.ts",
            "echo '      },' >> src/lib/supabase/proxy.ts",
            "echo '    }' >> src/lib/supabase/proxy.ts",
            "echo '  );' >> src/lib/supabase/proxy.ts",
            "echo '' >> src/lib/supabase/proxy.ts",
            "echo '  // Use getClaims() in Next.js 16+ for secure JWT validation' >> src/lib/supabase/proxy.ts",
            "echo '  await supabase.auth.getClaims();' >> src/lib/supabase/proxy.ts",
            "echo '  return supabaseResponse;' >> src/lib/supabase/proxy.ts",
            "echo '}' >> src/lib/supabase/proxy.ts",

            // 7.4. Create proxy.ts in src (Next.js 16+ uses proxy instead of middleware)
            "echo 'import { type NextRequest } from \"next/server\";' > src/proxy.ts",
            "echo 'import { updateSession } from \"@/lib/supabase/proxy\";' >> src/proxy.ts",
            "echo '' >> src/proxy.ts",
            "echo 'export async function proxy(request: NextRequest) {' >> src/proxy.ts",
            "echo '  return await updateSession(request);' >> src/proxy.ts",
            "echo '}' >> src/proxy.ts",
            "echo '' >> src/proxy.ts",
            "echo 'export const config = {' >> src/proxy.ts",
            "echo '  matcher: [' >> src/proxy.ts",
            "echo '    \"/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)\",],' >> src/proxy.ts",
            "echo '};' >> src/proxy.ts",

            // 7.5. Create Supabase storage helper
            "mkdir -p src/lib/storage",
            "echo 'import { createClient } from \"@/lib/supabase/server\";' > src/lib/storage/supabase.ts",
            "echo '' >> src/lib/storage/supabase.ts",
            "echo 'export async function uploadFile(bucket: string, path: string, file: File | Buffer) {' >> src/lib/storage/supabase.ts",
            "echo '  const supabase = await createClient();' >> src/lib/storage/supabase.ts",
            "echo '  const { data, error } = await supabase.storage.from(bucket).upload(path, file);' >> src/lib/storage/supabase.ts",
            "echo '  if (error) throw error;' >> src/lib/storage/supabase.ts",
            "echo '  return data;' >> src/lib/storage/supabase.ts",
            "echo '}' >> src/lib/storage/supabase.ts",
            "echo '' >> src/lib/storage/supabase.ts",
            "echo 'export async function getPublicUrl(bucket: string, path: string) {' >> src/lib/storage/supabase.ts",
            "echo '  const supabase = await createClient();' >> src/lib/storage/supabase.ts",
            "echo '  const { data } = supabase.storage.from(bucket).getPublicUrl(path);' >> src/lib/storage/supabase.ts",
            "echo '  return data.publicUrl;' >> src/lib/storage/supabase.ts",
            "echo '}' >> src/lib/storage/supabase.ts",
            "echo '' >> src/lib/storage/supabase.ts",
            "echo 'export async function deleteFile(bucket: string, path: string) {' >> src/lib/storage/supabase.ts",
            "echo '  const supabase = await createClient();' >> src/lib/storage/supabase.ts",
            "echo '  const { error } = await supabase.storage.from(bucket).remove([path]);' >> src/lib/storage/supabase.ts",
            "echo '  if (error) throw error;' >> src/lib/storage/supabase.ts",
            "echo '}' >> src/lib/storage/supabase.ts",

            // 7.6. Create auth actions for Supabase
            "mkdir -p src/lib/auth",
            "echo '\"use server\";' > src/lib/auth/actions.ts",
            "echo '' >> src/lib/auth/actions.ts",
            "echo 'import { createClient } from \"@/lib/supabase/server\";' >> src/lib/auth/actions.ts",
            "echo 'import { redirect } from \"next/navigation\";' >> src/lib/auth/actions.ts",
            "echo '' >> src/lib/auth/actions.ts",
            "echo 'export async function signIn(formData: FormData) {' >> src/lib/auth/actions.ts",
            "echo '  const supabase = await createClient();' >> src/lib/auth/actions.ts",
            "echo '  const { error } = await supabase.auth.signInWithPassword({' >> src/lib/auth/actions.ts",
            "echo '    email: formData.get(\"email\") as string,' >> src/lib/auth/actions.ts",
            "echo '    password: formData.get(\"password\") as string,' >> src/lib/auth/actions.ts",
            "echo '  });' >> src/lib/auth/actions.ts",
            "echo '  if (error) throw error;' >> src/lib/auth/actions.ts",
            "echo '  redirect(\"/dashboard\");' >> src/lib/auth/actions.ts",
            "echo '}' >> src/lib/auth/actions.ts",
            "echo '' >> src/lib/auth/actions.ts",
            "echo 'export async function signUp(formData: FormData) {' >> src/lib/auth/actions.ts",
            "echo '  const supabase = await createClient();' >> src/lib/auth/actions.ts",
            "echo '  const { error } = await supabase.auth.signUp({' >> src/lib/auth/actions.ts",
            "echo '    email: formData.get(\"email\") as string,' >> src/lib/auth/actions.ts",
            "echo '    password: formData.get(\"password\") as string,' >> src/lib/auth/actions.ts",
            "echo '  });' >> src/lib/auth/actions.ts",
            "echo '  if (error) throw error;' >> src/lib/auth/actions.ts",
            "echo '  redirect(\"/auth/verify\");' >> src/lib/auth/actions.ts",
            "echo '}' >> src/lib/auth/actions.ts",
            "echo '' >> src/lib/auth/actions.ts",
            "echo 'export async function signOut() {' >> src/lib/auth/actions.ts",
            "echo '  const supabase = await createClient();' >> src/lib/auth/actions.ts",
            "echo '  await supabase.auth.signOut();' >> src/lib/auth/actions.ts",
            "echo '  redirect(\"/\");' >> src/lib/auth/actions.ts",
            "echo '}' >> src/lib/auth/actions.ts",
            "echo '' >> src/lib/auth/actions.ts",
            "echo 'export async function getUser() {' >> src/lib/auth/actions.ts",
            "echo '  const supabase = await createClient();' >> src/lib/auth/actions.ts",
            "echo '  const { data: { user } } = await supabase.auth.getUser();' >> src/lib/auth/actions.ts",
            "echo '  return user;' >> src/lib/auth/actions.ts",
            "echo '}' >> src/lib/auth/actions.ts",

            // 7.7. Create auth callback route
            "mkdir -p src/app/auth/callback",
            "echo 'import { createClient } from \"@/lib/supabase/server\";' > src/app/auth/callback/route.ts",
            "echo 'import { NextResponse } from \"next/server\";' >> src/app/auth/callback/route.ts",
            "echo '' >> src/app/auth/callback/route.ts",
            "echo 'export async function GET(request: Request) {' >> src/app/auth/callback/route.ts",
            "echo '  const { searchParams, origin } = new URL(request.url);' >> src/app/auth/callback/route.ts",
            "echo '  const code = searchParams.get(\"code\");' >> src/app/auth/callback/route.ts",
            "echo '  const next = searchParams.get(\"next\") ?? \"/dashboard\";' >> src/app/auth/callback/route.ts",
            "echo '' >> src/app/auth/callback/route.ts",
            "echo '  if (code) {' >> src/app/auth/callback/route.ts",
            "echo '    const supabase = await createClient();' >> src/app/auth/callback/route.ts",
            "echo '    const { error } = await supabase.auth.exchangeCodeForSession(code);' >> src/app/auth/callback/route.ts",
            "echo '    if (!error) {' >> src/app/auth/callback/route.ts",
            "echo '      return NextResponse.redirect(\\`\\${origin}\\${next}\\`);' >> src/app/auth/callback/route.ts",
            "echo '    }' >> src/app/auth/callback/route.ts",
            "echo '  }' >> src/app/auth/callback/route.ts",
            "echo '  return NextResponse.redirect(\\`\\${origin}/auth/error\\`);' >> src/app/auth/callback/route.ts",
            "echo '}' >> src/app/auth/callback/route.ts",

            // 7.8. Create Resend email service
            "mkdir -p src/lib/email",
            "echo 'import { Resend } from \"resend\";' > src/lib/email/resend.ts",
            "echo '' >> src/lib/email/resend.ts",
            "echo 'export const resend = new Resend(process.env.RESEND_API_KEY);' >> src/lib/email/resend.ts",
            "echo '' >> src/lib/email/resend.ts",
            "echo 'export async function sendEmail({' >> src/lib/email/resend.ts",
            "echo '  to,' >> src/lib/email/resend.ts",
            "echo '  subject,' >> src/lib/email/resend.ts",
            "echo '  html,' >> src/lib/email/resend.ts",
            "echo '}: {' >> src/lib/email/resend.ts",
            "echo '  to: string;' >> src/lib/email/resend.ts",
            "echo '  subject: string;' >> src/lib/email/resend.ts",
            "echo '  html: string;' >> src/lib/email/resend.ts",
            "echo '}) {' >> src/lib/email/resend.ts",
            "echo '  return resend.emails.send({' >> src/lib/email/resend.ts",
            "echo '    from: process.env.RESEND_FROM_EMAIL || \"onboarding@resend.dev\",' >> src/lib/email/resend.ts",
            "echo '    to,' >> src/lib/email/resend.ts",
            "echo '    subject,' >> src/lib/email/resend.ts",
            "echo '    html,' >> src/lib/email/resend.ts",
            "echo '  });' >> src/lib/email/resend.ts",
            "echo '}' >> src/lib/email/resend.ts",

            // 7.9. Create AI service with OpenRouter
            "mkdir -p src/lib/ai",
            "echo 'import { createOpenAI } from \"@ai-sdk/openai\";' > src/lib/ai/openrouter.ts",
            "echo '' >> src/lib/ai/openrouter.ts",
            "echo 'export const openrouter = createOpenAI({' >> src/lib/ai/openrouter.ts",
            "echo '  baseURL: \"https://openrouter.ai/api/v1\",' >> src/lib/ai/openrouter.ts",
            "echo '  apiKey: process.env.OPENROUTER_API_KEY,' >> src/lib/ai/openrouter.ts",
            "echo '});' >> src/lib/ai/openrouter.ts",

            // 7.10. Create Upstash Redis client
            "mkdir -p src/lib/cache",
            "echo 'import { Redis } from \"@upstash/redis\";' > src/lib/cache/redis.ts",
            "echo '' >> src/lib/cache/redis.ts",
            "echo 'export const redis = new Redis({' >> src/lib/cache/redis.ts",
            "echo '  url: process.env.UPSTASH_REDIS_REST_URL || \"\",' >> src/lib/cache/redis.ts",
            "echo '  token: process.env.UPSTASH_REDIS_REST_TOKEN || \"\",' >> src/lib/cache/redis.ts",
            "echo '});' >> src/lib/cache/redis.ts",

            // 7.11. Create Polar checkout route handler (using @polar-sh/nextjs adapter)
            "mkdir -p src/app/api/checkout",
            "echo 'import { Checkout } from \"@polar-sh/nextjs\";' > src/app/api/checkout/route.ts",
            "echo '' >> src/app/api/checkout/route.ts",
            "echo '// Checkout handler - redirect users here with ?products=PRODUCT_ID' >> src/app/api/checkout/route.ts",
            "echo 'export const GET = Checkout({' >> src/app/api/checkout/route.ts",
            "echo '  accessToken: process.env.POLAR_ACCESS_TOKEN!,' >> src/app/api/checkout/route.ts",
            "echo '  successUrl: process.env.NEXT_PUBLIC_APP_URL + \"/checkout/success\",' >> src/app/api/checkout/route.ts",
            "echo '  server: process.env.NODE_ENV === \"production\" ? \"production\" : \"sandbox\",' >> src/app/api/checkout/route.ts",
            "echo '});' >> src/app/api/checkout/route.ts",

            // 7.11b. Create Polar webhook handler
            "mkdir -p src/app/api/webhooks/polar",
            "echo 'import { Webhooks } from \"@polar-sh/nextjs\";' > src/app/api/webhooks/polar/route.ts",
            "echo '' >> src/app/api/webhooks/polar/route.ts",
            "echo 'export const POST = Webhooks({' >> src/app/api/webhooks/polar/route.ts",
            "echo '  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,' >> src/app/api/webhooks/polar/route.ts",
            "echo '  onPayload: async (payload) => {' >> src/app/api/webhooks/polar/route.ts",
            "echo '    // Handle any webhook event' >> src/app/api/webhooks/polar/route.ts",
            "echo '    console.log(\"Polar webhook:\", payload.type);' >> src/app/api/webhooks/polar/route.ts",
            "echo '  },' >> src/app/api/webhooks/polar/route.ts",
            "echo '  onOrderPaid: async (payload) => {' >> src/app/api/webhooks/polar/route.ts",
            "echo '    // Handle successful payment' >> src/app/api/webhooks/polar/route.ts",
            "echo '    console.log(\"Order paid:\", payload.data.id);' >> src/app/api/webhooks/polar/route.ts",
            "echo '  },' >> src/app/api/webhooks/polar/route.ts",
            "echo '  onSubscriptionCreated: async (payload) => {' >> src/app/api/webhooks/polar/route.ts",
            "echo '    // Handle new subscription' >> src/app/api/webhooks/polar/route.ts",
            "echo '    console.log(\"Subscription created:\", payload.data.id);' >> src/app/api/webhooks/polar/route.ts",
            "echo '  },' >> src/app/api/webhooks/polar/route.ts",
            "echo '});' >> src/app/api/webhooks/polar/route.ts",

            // 7.12. Create Drizzle ORM configuration (using latest API)
            "mkdir -p src/lib/db",
            "echo 'import { drizzle } from \"drizzle-orm/postgres-js\";' > src/lib/db/index.ts",
            "echo 'import postgres from \"postgres\";' >> src/lib/db/index.ts",
            "echo 'import * as schema from \"./schema\";' >> src/lib/db/index.ts",
            "echo '' >> src/lib/db/index.ts",
            "echo '// Connection string from Supabase' >> src/lib/db/index.ts",
            "echo 'const connectionString = process.env.DATABASE_URL!;' >> src/lib/db/index.ts",
            "echo '' >> src/lib/db/index.ts",
            "echo '// Create postgres client with connection pooling support' >> src/lib/db/index.ts",
            "echo '// Set prepare: false if using Supabase connection pooler in Transaction mode' >> src/lib/db/index.ts",
            "echo 'const client = postgres(connectionString, { prepare: false });' >> src/lib/db/index.ts",
            "echo '' >> src/lib/db/index.ts",
            "echo '// Export drizzle instance with schema for type-safe queries' >> src/lib/db/index.ts",
            "echo 'export const db = drizzle({ client, schema });' >> src/lib/db/index.ts",

            // 7.13. Create Drizzle schema file
            "echo 'import { pgTable, text, timestamp, uuid } from \"drizzle-orm/pg-core\";' > src/lib/db/schema.ts",
            "echo '' >> src/lib/db/schema.ts",
            "echo '// Example: Users table (Supabase Auth handles auth users separately)' >> src/lib/db/schema.ts",
            "echo 'export const profiles = pgTable(\"profiles\", {' >> src/lib/db/schema.ts",
            "echo '  id: uuid(\"id\").primaryKey().defaultRandom(),' >> src/lib/db/schema.ts",
            "echo '  userId: text(\"user_id\").notNull().unique(), // Links to Supabase Auth' >> src/lib/db/schema.ts",
            "echo '  displayName: text(\"display_name\"),' >> src/lib/db/schema.ts",
            "echo '  avatarUrl: text(\"avatar_url\"),' >> src/lib/db/schema.ts",
            "echo '  createdAt: timestamp(\"created_at\").defaultNow().notNull(),' >> src/lib/db/schema.ts",
            "echo '  updatedAt: timestamp(\"updated_at\").defaultNow().notNull(),' >> src/lib/db/schema.ts",
            "echo '});' >> src/lib/db/schema.ts",
            "echo '' >> src/lib/db/schema.ts",
            "echo '// Example: Posts table' >> src/lib/db/schema.ts",
            "echo 'export const posts = pgTable(\"posts\", {' >> src/lib/db/schema.ts",
            "echo '  id: uuid(\"id\").primaryKey().defaultRandom(),' >> src/lib/db/schema.ts",
            "echo '  title: text(\"title\").notNull(),' >> src/lib/db/schema.ts",
            "echo '  content: text(\"content\"),' >> src/lib/db/schema.ts",
            "echo '  authorId: text(\"author_id\").notNull(),' >> src/lib/db/schema.ts",
            "echo '  createdAt: timestamp(\"created_at\").defaultNow().notNull(),' >> src/lib/db/schema.ts",
            "echo '  updatedAt: timestamp(\"updated_at\").defaultNow().notNull(),' >> src/lib/db/schema.ts",
            "echo '});' >> src/lib/db/schema.ts",

            // 7.14. Create drizzle.config.ts
            "echo 'import { defineConfig } from \"drizzle-kit\";' > drizzle.config.ts",
            "echo '' >> drizzle.config.ts",
            "echo 'export default defineConfig({' >> drizzle.config.ts",
            "echo '  schema: \"./src/lib/db/schema.ts\",' >> drizzle.config.ts",
            "echo '  out: \"./drizzle\",' >> drizzle.config.ts",
            "echo '  dialect: \"postgresql\",' >> drizzle.config.ts",
            "echo '  dbCredentials: {' >> drizzle.config.ts",
            "echo '    url: process.env.DATABASE_URL!,' >> drizzle.config.ts",
            "echo '  },' >> drizzle.config.ts",
            "echo '});' >> drizzle.config.ts",

            // 7.15. Create PostHog analytics provider
            "mkdir -p src/lib/analytics",
            "echo 'import posthog from \"posthog-js\";' > src/lib/analytics/posthog.ts",
            "echo '' >> src/lib/analytics/posthog.ts",
            "echo 'export function initPostHog() {' >> src/lib/analytics/posthog.ts",
            "echo '  if (typeof window !== \"undefined\" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {' >> src/lib/analytics/posthog.ts",
            "echo '    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {' >> src/lib/analytics/posthog.ts",
            "echo '      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || \"https://app.posthog.com\",' >> src/lib/analytics/posthog.ts",
            "echo '      loaded: (posthog) => {' >> src/lib/analytics/posthog.ts",
            "echo '        if (process.env.NODE_ENV === \"development\") posthog.debug();' >> src/lib/analytics/posthog.ts",
            "echo '      },' >> src/lib/analytics/posthog.ts",
            "echo '    });' >> src/lib/analytics/posthog.ts",
            "echo '  }' >> src/lib/analytics/posthog.ts",
            "echo '}' >> src/lib/analytics/posthog.ts",
            "echo '' >> src/lib/analytics/posthog.ts",
            "echo 'export { posthog };' >> src/lib/analytics/posthog.ts",

            // 7.16. Create Sonner toast provider component
            "mkdir -p src/components/providers",
            "echo '\"use client\";' > src/components/providers/toast-provider.tsx",
            "echo '' >> src/components/providers/toast-provider.tsx",
            "echo 'import { Toaster } from \"sonner\";' >> src/components/providers/toast-provider.tsx",
            "echo '' >> src/components/providers/toast-provider.tsx",
            "echo 'export function ToastProvider() {' >> src/components/providers/toast-provider.tsx",
            "echo '  return <Toaster position=\"top-right\" richColors />;' >> src/components/providers/toast-provider.tsx",
            "echo '}' >> src/components/providers/toast-provider.tsx",

            // 8. Add prettier config for consistent formatting
            "echo '{' > .prettierrc",
            "echo '  \"semi\": true,' >> .prettierrc",
            "echo '  \"singleQuote\": false,' >> .prettierrc",
            "echo '  \"tabWidth\": 2,' >> .prettierrc",
            "echo '  \"trailingComma\": \"es5\"' >> .prettierrc",
            "echo '}' >> .prettierrc",

            // 8.5. Create vercel.json for one-click deployment
            "echo '{' > vercel.json",
            "echo '  \"framework\": \"nextjs\",' >> vercel.json",
            "echo '  \"buildCommand\": \"pnpm build\",' >> vercel.json",
            "echo '  \"installCommand\": \"pnpm install\",' >> vercel.json",
            "echo '  \"outputDirectory\": \".next\"' >> vercel.json",
            "echo '}' >> vercel.json",

            // 9. Create a helpful README template
            "echo '# Craft Project' > README.md",
            "echo '' >> README.md",
            "echo 'Built with Craft AI - Next.js 16 + Supabase + Vercel' >> README.md",
            "echo '' >> README.md",
            "echo '## 🚀 Quick Start' >> README.md",
            "echo '' >> README.md",
            "echo '**Note:** Database, auth, and storage are auto-configured when you deploy via Craft!' >> README.md",
            "echo '' >> README.md",
            "echo '```bash' >> README.md",
            "echo '# Start dev server (Supabase credentials auto-injected by Craft)' >> README.md",
            "echo 'pnpm dev' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '## 📦 Tech Stack' >> README.md",
            "echo '' >> README.md",
            "echo '- **Framework**: Next.js 16 + React 19 + TypeScript' >> README.md",
            "echo '- **Styling**: Tailwind CSS v4 + shadcn/ui + Sonner toasts' >> README.md",
            "echo '- **Database**: Supabase PostgreSQL (managed by Craft)' >> README.md",
            "echo '- **ORM**: Drizzle (type-safe queries)' >> README.md",
            "echo '- **Auth**: Supabase Auth (SSO, OAuth, magic links)' >> README.md",
            "echo '- **Storage**: Supabase Storage (S3-compatible)' >> README.md",
            "echo '- **Realtime**: Supabase Realtime (live updates)' >> README.md",
            "echo '- **Email**: Resend (transactional emails)' >> README.md",
            "echo '- **AI**: OpenRouter + Vercel AI SDK' >> README.md",
            "echo '- **Cache**: Upstash Redis' >> README.md",
            "echo '- **Payments**: Polar (subscriptions & one-time)' >> README.md",
            "echo '- **Analytics**: PostHog' >> README.md",
            "echo '- **State**: Zustand' >> README.md",
            "echo '- **Forms**: React Hook Form + Zod' >> README.md",
            "echo '- **Deployment**: Vercel (one-click via Craft)' >> README.md",
            "echo '' >> README.md",
            "echo '## 🔐 Authentication' >> README.md",
            "echo '' >> README.md",
            "echo 'Supabase Auth is pre-configured with server-side rendering support.' >> README.md",
            "echo '' >> README.md",
            "echo '```tsx' >> README.md",
            "echo '// Server Component' >> README.md",
            "echo 'import { createClient } from \"@/lib/supabase/server\";' >> README.md",
            "echo '' >> README.md",
            "echo 'export default async function Page() {' >> README.md",
            "echo '  const supabase = await createClient();' >> README.md",
            "echo '  const { data: { user } } = await supabase.auth.getUser();' >> README.md",
            "echo '  return <div>Hello {user?.email}</div>;' >> README.md",
            "echo '}' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '```tsx' >> README.md",
            "echo '// Client Component' >> README.md",
            "echo 'import { createClient } from \"@/lib/supabase/client\";' >> README.md",
            "echo '' >> README.md",
            "echo 'const supabase = createClient();' >> README.md",
            "echo 'await supabase.auth.signInWithPassword({ email, password });' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '## 📁 File Storage' >> README.md",
            "echo '' >> README.md",
            "echo '```ts' >> README.md",
            "echo 'import { uploadFile, getPublicUrl } from \"@/lib/storage/supabase\";' >> README.md",
            "echo '' >> README.md",
            "echo '// Upload a file' >> README.md",
            "echo 'await uploadFile(\"avatars\", \"user-123.jpg\", file);' >> README.md",
            "echo '' >> README.md",
            "echo '// Get public URL' >> README.md",
            "echo 'const url = await getPublicUrl(\"avatars\", \"user-123.jpg\");' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '## 🗄️ Database' >> README.md",
            "echo '' >> README.md",
            "echo '```ts' >> README.md",
            "echo 'import { createClient } from \"@/lib/supabase/server\";' >> README.md",
            "echo '' >> README.md",
            "echo 'const supabase = await createClient();' >> README.md",
            "echo '' >> README.md",
            "echo '// Query data' >> README.md",
            "echo 'const { data } = await supabase.from(\"posts\").select(\"*\");' >> README.md",
            "echo '' >> README.md",
            "echo '// Insert data' >> README.md",
            "echo 'await supabase.from(\"posts\").insert({ title: \"Hello\" });' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '## 📧 Email' >> README.md",
            "echo '' >> README.md",
            "echo '```ts' >> README.md",
            "echo 'import { sendEmail } from \"@/lib/email/resend\";' >> README.md",
            "echo '' >> README.md",
            "echo 'await sendEmail({' >> README.md",
            "echo '  to: \"user@example.com\",' >> README.md",
            "echo '  subject: \"Welcome!\",' >> README.md",
            "echo '  html: \"<p>Thanks for signing up!</p>\"' >> README.md",
            "echo '});' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '## 🤖 AI' >> README.md",
            "echo '' >> README.md",
            "echo '```ts' >> README.md",
            "echo 'import { openrouter } from \"@/lib/ai/openrouter\";' >> README.md",
            "echo 'import { generateText } from \"ai\";' >> README.md",
            "echo '' >> README.md",
            "echo 'const result = await generateText({' >> README.md",
            "echo '  model: openrouter(\"anthropic/claude-3.5-sonnet\"),' >> README.md",
            "echo '  prompt: \"Hello\"' >> README.md",
            "echo '});' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '## 🚀 Deployment' >> README.md",
            "echo '' >> README.md",
            "echo 'Deploy with one click via Craft - environment variables are auto-configured!' >> README.md",
            "echo '' >> README.md",
            "echo 'Or deploy manually to Vercel:' >> README.md",
            "echo '1. Push to GitHub' >> README.md",
            "echo '2. Import to Vercel' >> README.md",
            "echo '3. Add environment variables from .env.example' >> README.md",
            "echo '' >> README.md",
            "echo '---' >> README.md",
            "echo '' >> README.md",
            "echo 'Built with ❤️ using [Craft](https://craft.dev)' >> README.md",

            // 10. Move to final location and clean up
            "cd /home/user",
            "mv /home/user/base-template/craft-base /home/user/project",
            "rm -rf /home/user/base-template",

            // 11. Set proper permissions
            "chmod -R 755 /home/user/project",

            // Success marker
            "echo '✅ Full-stack SaaS template ready: Supabase + Vercel + AI + Payments + Analytics' > /home/user/project/.craft-ready"
        ].join(" && "))

        // Set working directory to project root (pre-populated with Next.js!)
        .setWorkdir("/home/user/project")

        // Configure environment variables
        .setEnvs({
            // Node.js environment
            NODE_ENV: "development",

            // Disable Next.js telemetry
            NEXT_TELEMETRY_DISABLED: "1",

            // Turbopack settings (faster builds)
            TURBOPACK_ENABLED: "1",

            // Next.js dev server settings
            PORT: "3000",           // Next.js reads this for port
        })

        // 🎯 START & READY COMMANDS: Run Next.js and wait for it to be ready
        // This ensures the Next.js app is running and accessible when sandbox spawns
        // - Start command: Runs pnpm dev with Turbopack for fast HMR
        // - Ready command: Uses E2B's waitForURL helper to verify app is accessible
        .setStartCmd(
            "pnpm dev",
            waitForURL("http://localhost:3000")
        );

    // Template is now ready!
    // This is a COMPLETE production SaaS starter - idea to launch in minutes!
    // When sandbox spawns:
    // ✅ Full-stack Next.js app (frontend + backend APIs)
    // ✅ All dependencies installed (no npm install needed)
    // ✅ 10+ shadcn/ui components + Sonner toasts
    // ✅ Database: Supabase PostgreSQL (managed by Craft)
    // ✅ ORM: Drizzle (type-safe database queries)
    // ✅ Auth: Supabase Auth (SSO, OAuth, magic links)
    // ✅ Storage: Supabase Storage (S3-compatible)
    // ✅ Realtime: Supabase Realtime (live updates)
    // ✅ Email: Resend (transactional emails)
    // ✅ AI: OpenRouter + AI SDK (LLM integrations)
    // ✅ Cache: Upstash Redis (sessions/rate limiting)
    // ✅ Payments: Polar (subscriptions & one-time)
    // ✅ Analytics: PostHog (events/feature flags)
    // ✅ Deployment: Vercel (one-click via Craft)
    // ✅ AI can immediately start building - no setup needed!
}

/**
 * Template metadata for E2B dashboard
 */
export const craftTemplateMetadata = {
    name: "craft-next",
    description: "Complete SaaS starter: Next.js 16 + Supabase + Drizzle ORM + Polar + Vercel - Ship in minutes!",
    version: "3.2.0",
    tags: [
        "nodejs", "pnpm", "nextjs", "react", "typescript",
        "tailwind", "shadcn", "sonner",
        "supabase", "postgresql", "drizzle", "orm",
        "auth", "storage", "realtime", "proxy",
        "email", "resend",
        "ai", "openrouter", "ai-sdk",
        "redis", "upstash",
        "payments", "polar", "subscriptions", "checkout", "webhooks",
        "analytics", "posthog",
        "vercel", "deployment",
        "zustand", "forms", "zod"
    ],
};

/**
 * Build and export the template for CLI usage
 * 
 * Usage:
 * ```bash
 * # Build for development
 * pnpm e2b:build:dev
 * 
 * # Build for production
 * pnpm e2b:build:prod
 * ```
 */
export const craftTemplate = buildCraftTemplate();
