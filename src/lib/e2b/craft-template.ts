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
 * Backend & Services:
 * - Prisma ORM + PostgreSQL (Neon-ready)
 * - Better Auth (authentication)
 * - Resend (transactional emails)
 * - Cloudflare R2 (file storage, S3-compatible)
 * - OpenRouter + AI SDK (AI features)
 * - Upstash Redis (caching/sessions)
 * - Polar (payments/subscriptions)
 * - PostHog (analytics/feature flags)
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

import { Template } from "e2b";

/**
 * Build the Craft E2B template with a complete Next.js + shadcn/ui base project
 */
export function buildCraftTemplate() {
    return Template()
        // Start with Node.js 24 slim (Ubuntu-based, minimal image)
        .fromNodeImage("24-slim")

        // Install essential packages
        .aptInstall([
            "curl",           // For downloading pnpm installer
            "ca-certificates", // For HTTPS connections
            "git",            // Required for shadcn/ui CLI
        ])

        // Install pnpm 9.15.4 (latest stable)
        .runCmd(
            "curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=9.15.4 sh -"
        )

        // Create a complete Next.js + shadcn/ui base project
        // This will be available at /home/user/project (no copying needed!)
        .runCmd([
            // Set up pnpm in PATH for this session
            "export PATH=/home/user/.local/share/pnpm:$PATH",

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

            // 3.5. Install Prisma for database (PostgreSQL ready)
            "pnpm add @prisma/client",
            "pnpm add -D prisma",

            // 3.6. Install Better Auth for authentication
            "pnpm add better-auth",

            // 3.7. Install production services
            "pnpm add resend",                          // Email service
            "pnpm add @aws-sdk/client-s3",              // Cloudflare R2 (S3-compatible)
            "pnpm add @aws-sdk/s3-request-presigner",   // R2 presigned URLs
            "pnpm add ai",                              // Vercel AI SDK
            "pnpm add openai",                          // OpenAI SDK (for OpenRouter)
            "pnpm add @upstash/redis",                  // Redis for caching/sessions
            "pnpm add @polar-sh/sdk",                   // Polar payments
            "pnpm add posthog-js posthog-node",         // PostHog analytics
            "pnpm add next-themes",                     // Dark mode support
            "pnpm add sonner",                          // Toast notifications (instead of shadcn toast)

            // 4. Initialize shadcn/ui (creates components.json and lib/utils.ts)
            "pnpm dlx shadcn@latest init -y -d",

            // 5. Pre-install commonly used shadcn components (no toast - using Sonner instead)
            "pnpm dlx shadcn@latest add button card input label form select dialog dropdown-menu avatar badge --yes --overwrite || true",

            // 6. Initialize Prisma with PostgreSQL
            "pnpm dlx prisma init --datasource-provider postgresql",

            // 6.5. Update .env.example with all variables
            "echo '# ============================================================================' > .env.example",
            "echo '# App Configuration' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'NEXT_PUBLIC_APP_URL=http://localhost:3000' >> .env.example",
            "echo 'NEXT_PUBLIC_API_URL=' >> .env.example",
            "echo '' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo '# Database (Neon - Free tier: https://neon.tech)' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'DATABASE_URL=\"postgresql://user:password@localhost:5432/mydb?schema=public\"' >> .env.example",
            "echo '' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo '# Authentication (Better Auth)' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'BETTER_AUTH_SECRET=\"your-secret-key-here-change-in-production\"' >> .env.example",
            "echo 'BETTER_AUTH_URL=\"http://localhost:3000\"' >> .env.example",
            "echo '' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo '# Email (Resend - Free tier: https://resend.com)' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'RESEND_API_KEY=\"re_xxxxxxxxxxxx\"' >> .env.example",
            "echo 'RESEND_FROM_EMAIL=\"onboarding@resend.dev\"' >> .env.example",
            "echo '' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo '# File Storage (Cloudflare R2 - Free tier: 10GB)' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'R2_ACCOUNT_ID=\"your-account-id\"' >> .env.example",
            "echo 'R2_ACCESS_KEY_ID=\"your-access-key\"' >> .env.example",
            "echo 'R2_SECRET_ACCESS_KEY=\"your-secret-key\"' >> .env.example",
            "echo 'R2_BUCKET_NAME=\"your-bucket-name\"' >> .env.example",
            "echo 'R2_PUBLIC_URL=\"https://pub-xxxxx.r2.dev\"' >> .env.example",
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
            "echo 'POLAR_ACCESS_TOKEN=\"polar_at_xxxxxxxxxxxx\"' >> .env.example",
            "echo 'POLAR_ORGANIZATION_ID=\"your-org-id\"' >> .env.example",
            "echo '' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo '# Analytics (PostHog - Free tier: https://posthog.com)' >> .env.example",
            "echo '# ============================================================================' >> .env.example",
            "echo 'NEXT_PUBLIC_POSTHOG_KEY=\"phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\"' >> .env.example",
            "echo 'NEXT_PUBLIC_POSTHOG_HOST=\"https://app.posthog.com\"' >> .env.example",

            // 7. Create Prisma client helper
            "mkdir -p src/lib",
            "echo 'import { PrismaClient } from \"@prisma/client\";' > src/lib/db.ts",
            "echo '' >> src/lib/db.ts",
            "echo 'const globalForPrisma = globalThis as unknown as {' >> src/lib/db.ts",
            "echo '  prisma: PrismaClient | undefined;' >> src/lib/db.ts",
            "echo '};' >> src/lib/db.ts",
            "echo '' >> src/lib/db.ts",
            "echo 'export const prisma =' >> src/lib/db.ts",
            "echo '  globalForPrisma.prisma ??' >> src/lib/db.ts",
            "echo '  new PrismaClient({' >> src/lib/db.ts",
            "echo '    log: [\"query\"],' >> src/lib/db.ts",
            "echo '  });' >> src/lib/db.ts",
            "echo '' >> src/lib/db.ts",
            "echo 'if (process.env.NODE_ENV !== \"production\") globalForPrisma.prisma = prisma;' >> src/lib/db.ts",

            // 7.5. Add basic User model to Prisma schema
            "echo '' >> prisma/schema.prisma",
            "echo '// Example model - customize as needed' >> prisma/schema.prisma",
            "echo 'model User {' >> prisma/schema.prisma",
            "echo '  id        String   @id @default(cuid())' >> prisma/schema.prisma",
            "echo '  email     String   @unique' >> prisma/schema.prisma",
            "echo '  name      String?' >> prisma/schema.prisma",
            "echo '  createdAt DateTime @default(now())' >> prisma/schema.prisma",
            "echo '  updatedAt DateTime @updatedAt' >> prisma/schema.prisma",
            "echo '}' >> prisma/schema.prisma",

            // 7.6. Create Better Auth configuration
            "mkdir -p src/lib/auth",
            "echo 'import { betterAuth } from \"better-auth\";' > src/lib/auth/auth.ts",
            "echo 'import { prismaAdapter } from \"better-auth/adapters/prisma\";' >> src/lib/auth/auth.ts",
            "echo 'import { prisma } from \"@/lib/db\";' >> src/lib/auth/auth.ts",
            "echo '' >> src/lib/auth/auth.ts",
            "echo 'export const auth = betterAuth({' >> src/lib/auth/auth.ts",
            "echo '  database: prismaAdapter(prisma, {' >> src/lib/auth/auth.ts",
            "echo '    provider: \"postgresql\",' >> src/lib/auth/auth.ts",
            "echo '  }),' >> src/lib/auth/auth.ts",
            "echo '  emailAndPassword: {' >> src/lib/auth/auth.ts",
            "echo '    enabled: true,' >> src/lib/auth/auth.ts",
            "echo '  },' >> src/lib/auth/auth.ts",
            "echo '  trustedOrigins: [process.env.BETTER_AUTH_URL || \"http://localhost:3000\"],' >> src/lib/auth/auth.ts",
            "echo '});' >> src/lib/auth/auth.ts",

            // 7.7. Create Better Auth API route
            "mkdir -p src/app/api/auth/[...all]",
            "echo 'import { auth } from \"@/lib/auth/auth\";' > src/app/api/auth/[...all]/route.ts",
            "echo 'import { toNextJsHandler } from \"better-auth/next-js\";' >> src/app/api/auth/[...all]/route.ts",
            "echo '' >> src/app/api/auth/[...all]/route.ts",
            "echo 'export const { GET, POST } = toNextJsHandler(auth);' >> src/app/api/auth/[...all]/route.ts",

            // 7.8. Create Better Auth client
            "echo 'import { createAuthClient } from \"better-auth/react\";' > src/lib/auth/client.ts",
            "echo '' >> src/lib/auth/client.ts",
            "echo 'export const authClient = createAuthClient({' >> src/lib/auth/client.ts",
            "echo '  baseURL: process.env.NEXT_PUBLIC_APP_URL || \"http://localhost:3000\",' >> src/lib/auth/client.ts",
            "echo '});' >> src/lib/auth/client.ts",
            "echo '' >> src/lib/auth/client.ts",
            "echo 'export const { signIn, signUp, signOut, useSession } = authClient;' >> src/lib/auth/client.ts",

            // 7.9. Create Resend email service
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

            // 7.10. Create Cloudflare R2 storage service
            "mkdir -p src/lib/storage",
            "echo 'import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from \"@aws-sdk/client-s3\";' > src/lib/storage/r2.ts",
            "echo 'import { getSignedUrl } from \"@aws-sdk/s3-request-presigner\";' >> src/lib/storage/r2.ts",
            "echo '' >> src/lib/storage/r2.ts",
            "echo 'const r2 = new S3Client({' >> src/lib/storage/r2.ts",
            "echo '  region: \"auto\",' >> src/lib/storage/r2.ts",
            "echo '  endpoint: \\`https://\\${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com\\`,' >> src/lib/storage/r2.ts",
            "echo '  credentials: {' >> src/lib/storage/r2.ts",
            "echo '    accessKeyId: process.env.R2_ACCESS_KEY_ID || \"\",' >> src/lib/storage/r2.ts",
            "echo '    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || \"\",' >> src/lib/storage/r2.ts",
            "echo '  },' >> src/lib/storage/r2.ts",
            "echo '});' >> src/lib/storage/r2.ts",
            "echo '' >> src/lib/storage/r2.ts",
            "echo 'export async function uploadFile(key: string, file: Buffer, contentType: string) {' >> src/lib/storage/r2.ts",
            "echo '  await r2.send(new PutObjectCommand({' >> src/lib/storage/r2.ts",
            "echo '    Bucket: process.env.R2_BUCKET_NAME,' >> src/lib/storage/r2.ts",
            "echo '    Key: key,' >> src/lib/storage/r2.ts",
            "echo '    Body: file,' >> src/lib/storage/r2.ts",
            "echo '    ContentType: contentType,' >> src/lib/storage/r2.ts",
            "echo '  }));' >> src/lib/storage/r2.ts",
            "echo '  return \\`\\${process.env.R2_PUBLIC_URL}/\\${key}\\`;' >> src/lib/storage/r2.ts",
            "echo '}' >> src/lib/storage/r2.ts",

            // 7.11. Create AI service with OpenRouter
            "mkdir -p src/lib/ai",
            "echo 'import { createOpenAI } from \"@ai-sdk/openai\";' > src/lib/ai/openrouter.ts",
            "echo '' >> src/lib/ai/openrouter.ts",
            "echo 'export const openrouter = createOpenAI({' >> src/lib/ai/openrouter.ts",
            "echo '  baseURL: \"https://openrouter.ai/api/v1\",' >> src/lib/ai/openrouter.ts",
            "echo '  apiKey: process.env.OPENROUTER_API_KEY,' >> src/lib/ai/openrouter.ts",
            "echo '});' >> src/lib/ai/openrouter.ts",

            // 7.12. Create Upstash Redis client
            "mkdir -p src/lib/cache",
            "echo 'import { Redis } from \"@upstash/redis\";' > src/lib/cache/redis.ts",
            "echo '' >> src/lib/cache/redis.ts",
            "echo 'export const redis = new Redis({' >> src/lib/cache/redis.ts",
            "echo '  url: process.env.UPSTASH_REDIS_REST_URL || \"\",' >> src/lib/cache/redis.ts",
            "echo '  token: process.env.UPSTASH_REDIS_REST_TOKEN || \"\",' >> src/lib/cache/redis.ts",
            "echo '});' >> src/lib/cache/redis.ts",

            // 7.13. Create Polar payments client
            "mkdir -p src/lib/payments",
            "echo 'import { Polar } from \"@polar-sh/sdk\";' > src/lib/payments/polar.ts",
            "echo '' >> src/lib/payments/polar.ts",
            "echo 'export const polar = new Polar({' >> src/lib/payments/polar.ts",
            "echo '  accessToken: process.env.POLAR_ACCESS_TOKEN || \"\",' >> src/lib/payments/polar.ts",
            "echo '});' >> src/lib/payments/polar.ts",

            // 7.14. Create PostHog analytics provider
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

            // 7.15. Create Sonner toast provider component
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

            // 9. Create a helpful README template
            "echo '# Craft Project' > README.md",
            "echo '' >> README.md",
            "echo 'Built with Craft AI - Next.js 15 + shadcn/ui + Prisma + Better Auth' >> README.md",
            "echo '' >> README.md",
            "echo '## Quick Start' >> README.md",
            "echo '' >> README.md",
            "echo '```bash' >> README.md",
            "echo '# 1. Install dependencies' >> README.md",
            "echo 'pnpm install' >> README.md",
            "echo '' >> README.md",
            "echo '# 2. Set up database (get free PostgreSQL from https://neon.tech)' >> README.md",
            "echo 'cp .env.example .env' >> README.md",
            "echo '# Add your DATABASE_URL to .env' >> README.md",
            "echo '' >> README.md",
            "echo '# 3. Run database migrations' >> README.md",
            "echo 'pnpm prisma db push' >> README.md",
            "echo '' >> README.md",
            "echo '# 4. Start dev server' >> README.md",
            "echo 'pnpm dev' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '## Tech Stack' >> README.md",
            "echo '' >> README.md",
            "echo '- Next.js 15 + React 19' >> README.md",
            "echo '- TypeScript' >> README.md",
            "echo '- Tailwind CSS v4' >> README.md",
            "echo '- shadcn/ui components + Sonner toasts' >> README.md",
            "echo '- Prisma + PostgreSQL (database)' >> README.md",
            "echo '- Better Auth (authentication)' >> README.md",
            "echo '- Resend (email)' >> README.md",
            "echo '- Cloudflare R2 (file storage)' >> README.md",
            "echo '- OpenRouter + AI SDK (AI features)' >> README.md",
            "echo '- Upstash Redis (caching)' >> README.md",
            "echo '- Polar (payments)' >> README.md",
            "echo '- PostHog (analytics)' >> README.md",
            "echo '- Zustand (state management)' >> README.md",
            "echo '- React Hook Form + Zod (forms & validation)' >> README.md",
            "echo '' >> README.md",
            "echo '## Database Setup' >> README.md",
            "echo '' >> README.md",
            "echo '1. Create a free PostgreSQL database at [Neon](https://neon.tech)' >> README.md",
            "echo '2. Copy the connection string' >> README.md",
            "echo '3. Add it to `.env` as `DATABASE_URL`' >> README.md",
            "echo '4. Run `pnpm prisma db push` to create tables' >> README.md",
            "echo '5. Use `pnpm prisma studio` to view/edit data' >> README.md",
            "echo '' >> README.md",
            "echo '## Authentication' >> README.md",
            "echo '' >> README.md",
            "echo 'Better Auth is pre-configured with email/password authentication.' >> README.md",
            "echo '' >> README.md",
            "echo '```tsx' >> README.md",
            "echo '// In your components' >> README.md",
            "echo 'import { useSession, signIn, signOut } from \"@/lib/auth/client\";' >> README.md",
            "echo '' >> README.md",
            "echo 'const { data: session } = useSession();' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '## Services Quick Start' >> README.md",
            "echo '' >> README.md",
            "echo '### Email (Resend)' >> README.md",
            "echo '```ts' >> README.md",
            "echo 'import { sendEmail } from \"@/lib/email/resend\";' >> README.md",
            "echo 'await sendEmail({ to: \"user@example.com\", subject: \"Hello\", html: \"<p>Hi</p>\" });' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '### File Storage (R2)' >> README.md",
            "echo '```ts' >> README.md",
            "echo 'import { uploadFile } from \"@/lib/storage/r2\";' >> README.md",
            "echo 'const url = await uploadFile(\"path/file.jpg\", buffer, \"image/jpeg\");' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '### AI (OpenRouter)' >> README.md",
            "echo '```ts' >> README.md",
            "echo 'import { openrouter } from \"@/lib/ai/openrouter\";' >> README.md",
            "echo 'import { generateText } from \"ai\";' >> README.md",
            "echo 'const result = await generateText({ model: openrouter(\"anthropic/claude-3.5-sonnet\"), prompt: \"Hello\" });' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '### Caching (Redis)' >> README.md",
            "echo '```ts' >> README.md",
            "echo 'import { redis } from \"@/lib/cache/redis\";' >> README.md",
            "echo 'await redis.set(\"key\", \"value\", { ex: 3600 });' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '### Payments (Polar)' >> README.md",
            "echo '```ts' >> README.md",
            "echo 'import { polar } from \"@/lib/payments/polar\";' >> README.md",
            "echo 'const products = await polar.products.list({ organizationId: process.env.POLAR_ORGANIZATION_ID });' >> README.md",
            "echo '```' >> README.md",
            "echo '' >> README.md",
            "echo '### Analytics (PostHog)' >> README.md",
            "echo '```ts' >> README.md",
            "echo 'import { posthog } from \"@/lib/analytics/posthog\";' >> README.md",
            "echo 'posthog.capture(\"event_name\", { property: \"value\" });' >> README.md",
            "echo '```' >> README.md",

            // 10. Move to final location and clean up
            "cd /home/user",
            "mv /home/user/base-template/craft-base /home/user/project",
            "rm -rf /home/user/base-template",

            // 11. Set proper permissions
            "chmod -R 755 /home/user/project",

            // Success marker
            "echo '✅ Full-stack SaaS template ready: Auth + DB + Email + Storage + AI + Payments + Analytics' > /home/user/project/.craft-ready"
        ].join(" && "))

        // Set working directory to project root (pre-populated with Next.js!)
        .setWorkdir("/home/user/project")

        // Configure environment variables
        .setEnvs({
            // Add pnpm to PATH
            PATH: "/home/user/.local/share/pnpm:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",

            // Node.js environment
            NODE_ENV: "development",

            // Disable Next.js telemetry
            NEXT_TELEMETRY_DISABLED: "1",

            // Turbopack settings (faster builds)
            TURBOPACK_ENABLED: "1",

            // pnpm settings
            PNPM_HOME: "/home/user/.local/share/pnpm",
        });

    // Template is now ready!
    // This is a COMPLETE production SaaS starter - idea to launch in minutes!
    // When sandbox spawns:
    // ✅ Full-stack Next.js app (frontend + backend APIs)
    // ✅ All dependencies installed (no npm install needed)
    // ✅ 10+ shadcn/ui components + Sonner toasts
    // ✅ Database: Prisma + PostgreSQL (just add DATABASE_URL)
    // ✅ Auth: Better Auth (email/password ready)
    // ✅ Email: Resend (transactional emails)
    // ✅ Storage: Cloudflare R2 (file uploads)
    // ✅ AI: OpenRouter + AI SDK (LLM integrations)
    // ✅ Cache: Upstash Redis (sessions/rate limiting)
    // ✅ Payments: Polar (subscriptions/one-time)
    // ✅ Analytics: PostHog (events/feature flags)
    // ✅ AI can immediately start building - no setup needed!
}

/**
 * Template metadata for E2B dashboard
 */
export const craftTemplateMetadata = {
    name: "craft-next",
    description: "Complete SaaS starter: Next.js 15 + Auth + DB + Email + Storage + AI + Payments + Analytics - Ship in minutes!",
    version: "2.0.0",
    tags: [
        "nodejs", "pnpm", "nextjs", "react", "typescript",
        "tailwind", "shadcn", "sonner",
        "prisma", "postgresql", "neon",
        "auth", "better-auth",
        "email", "resend",
        "storage", "cloudflare-r2",
        "ai", "openrouter", "ai-sdk",
        "redis", "upstash",
        "payments", "polar",
        "analytics", "posthog",
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
