/**
 * Environment Variables Validation Script
 * 
 * Validates that all required environment variables are set
 * Run this on application startup to catch configuration errors early
 * 
 * Usage:
 *   tsx scripts/validate-env.ts
 */

interface EnvValidation {
    name: string;
    required: boolean;
    description: string;
    example?: string;
}

const ENV_VARIABLES: EnvValidation[] = [
    // Database
    {
        name: "DATABASE_URL",
        required: true,
        description: "PostgreSQL database connection URL",
        example: "postgresql://user:pass@host:5432/dbname"
    },

    // Razorpay Payment Gateway
    {
        name: "RAZORPAY_KEY_ID",
        required: true,
        description: "Razorpay Key ID for payment processing"
    },
    {
        name: "RAZORPAY_KEY_SECRET",
        required: true,
        description: "Razorpay Key Secret for payment processing"
    },
    {
        name: "RAZORPAY_WEBHOOK_SECRET",
        required: true,
        description: "Razorpay webhook signature verification secret"
    },
    {
        name: "RAZORPAY_CURRENCY",
        required: false,
        description: "Razorpay currency (default: USD)",
        example: "USD"
    },

    // Better Auth
    {
        name: "BETTER_AUTH_SECRET",
        required: true,
        description: "Better Auth secret key for session encryption"
    },
    {
        name: "BETTER_AUTH_URL",
        required: true,
        description: "Better Auth base URL",
        example: "http://localhost:3000"
    },
    {
        name: "NEXT_PUBLIC_BETTER_AUTH_URL",
        required: true,
        description: "Better Auth public URL for client-side",
        example: "http://localhost:3000"
    },

    // OAuth Providers (optional)
    {
        name: "GOOGLE_CLIENT_ID",
        required: false,
        description: "Google OAuth client ID"
    },
    {
        name: "GOOGLE_CLIENT_SECRET",
        required: false,
        description: "Google OAuth client secret"
    },
    {
        name: "GITHUB_CLIENT_ID",
        required: false,
        description: "GitHub OAuth client ID"
    },
    {
        name: "GITHUB_CLIENT_SECRET",
        required: false,
        description: "GitHub OAuth client secret"
    },

    // Email (Resend)
    {
        name: "RESEND_ACCOUNT_API_KEY",
        required: true,
        description: "Resend API key for sending emails"
    },
    {
        name: "RESEND_ACCOUNT_EMAIL_FROM",
        required: true,
        description: "Resend verified sender email address",
        example: "team@notifications.example.com"
    },

    // AI Providers (at least one required)
    {
        name: "ANTHROPIC_API_KEY",
        required: false,
        description: "Anthropic API key for Claude models"
    },
    {
        name: "OPENAI_API_KEY",
        required: false,
        description: "OpenAI API key for GPT models"
    },
    {
        name: "GOOGLE_GENERATIVE_AI_API_KEY",
        required: false,
        description: "Google AI API key for Gemini models"
    },
    {
        name: "XAI_API_KEY",
        required: false,
        description: "xAI API key for Grok models"
    },
    {
        name: "OPENROUTER_API_KEY",
        required: false,
        description: "OpenRouter API key for aggregated models"
    },

    // E2B Sandbox
    {
        name: "E2B_API_KEY",
        required: true,
        description: "E2B API key for code execution sandboxes"
    },
    {
        name: "E2B_TEMPLATE_ID",
        required: true,
        description: "E2B template ID for sandboxes",
        example: "craft-next-dev"
    },

    // Cloudflare R2 Storage
    {
        name: "CLOUDFLARE_R2_ACCOUNT_ID",
        required: true,
        description: "Cloudflare R2 account ID"
    },
    {
        name: "CLOUDFLARE_R2_ACCESS_KEY_ID",
        required: true,
        description: "Cloudflare R2 access key ID"
    },
    {
        name: "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
        required: true,
        description: "Cloudflare R2 secret access key"
    },
    {
        name: "CLOUDFLARE_R2_BUCKET_NAME",
        required: true,
        description: "Cloudflare R2 bucket name"
    },
    {
        name: "CLOUDFLARE_R2_PUBLIC_URL",
        required: false,
        description: "Cloudflare R2 public URL for file access",
        example: "https://pub-xxx.r2.dev"
    },

    // Upstash Redis (for rate limiting)
    {
        name: "UPSTASH_REDIS_REST_URL",
        required: true,
        description: "Upstash Redis REST URL"
    },
    {
        name: "UPSTASH_REDIS_REST_TOKEN",
        required: true,
        description: "Upstash Redis REST token"
    },

    // Neon Database Integration (for AI Agent provisioning)
    {
        name: "NEON_API_KEY",
        required: true,
        description: "Neon API key for database provisioning"
    },
    {
        name: "NEON_FREE_ORG_ID",
        required: true,
        description: "Neon organization ID for FREE/HOBBY tier users"
    },
    {
        name: "NEON_PRO_ORG_ID",
        required: true,
        description: "Neon organization ID for PRO/ENTERPRISE tier users"
    },

    // Application Configuration
    {
        name: "NEXT_PUBLIC_APP_URL",
        required: true,
        description: "Application URL",
        example: "http://localhost:3000"
    },
    {
        name: "CRON_SECRET",
        required: true,
        description: "Secret for authenticating cron jobs"
    },
    {
        name: "PRISMA_QUERY_LOGS",
        required: false,
        description: "Enable Prisma query logging (true/false)",
        example: "false"
    },
];

function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log("🔍 Validating environment variables...\n");

    for (const envVar of ENV_VARIABLES) {
        const value = process.env[envVar.name];
        const status = value ? "✓" : (envVar.required ? "✗" : "⚠");

        if (!value) {
            if (envVar.required) {
                errors.push(`${envVar.name}: ${envVar.description}`);
                console.log(`  ${status} ${envVar.name} - MISSING (REQUIRED)`);
                if (envVar.example) {
                    console.log(`    Example: ${envVar.example}`);
                }
            } else {
                warnings.push(`${envVar.name}: ${envVar.description} (optional)`);
                console.log(`  ${status} ${envVar.name} - Not set (optional)`);
            }
        } else {
            console.log(`  ${status} ${envVar.name} - Set`);
        }
    }

    // Special validation: At least one AI provider API key must be set
    const aiProviders = [
        "ANTHROPIC_API_KEY",
        "OPENAI_API_KEY",
        "GOOGLE_GENERATIVE_AI_API_KEY",
        "XAI_API_KEY",
        "OPENROUTER_API_KEY"
    ];
    const hasAnyAIProvider = aiProviders.some(key => process.env[key]);

    if (!hasAnyAIProvider) {
        errors.push("At least one AI provider API key is required (Anthropic, OpenAI, Google AI, xAI, or OpenRouter)");
        console.log("\n  ✗ AI Providers - At least ONE AI provider API key is required");
    } else {
        console.log("\n  ✓ AI Providers - At least one provider configured");
    }

    console.log("\n" + "=".repeat(80));

    if (errors.length > 0) {
        console.log("\n❌ VALIDATION FAILED\n");
        console.log("Missing required environment variables:");
        errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
        });
        console.log("\nPlease check your .env file and ensure all required variables are set.");
    } else {
        console.log("\n✅ VALIDATION PASSED");
        console.log("All required environment variables are set!");
    }

    if (warnings.length > 0) {
        console.log("\n⚠️  Optional variables not set:");
        warnings.forEach((warning, index) => {
            console.log(`  ${index + 1}. ${warning}`);
        });
    }

    console.log("\n" + "=".repeat(80) + "\n");

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

// Run validation
const result = validateEnvironment();

// Exit with error code if validation failed
if (!result.valid) {
    process.exit(1);
}
